// ETAPA 1: Adicionando imports dos models
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';

// Função utilitária para normalizar e validar status
const normalizeStatus = (status) => {
  if (!status) return null;
  
  // Converter para string e remover espaços
  const cleanStatus = String(status).trim().toLowerCase();
  
  // Mapeamento de status para normalização
  const statusMap = {
    'open': 'open',
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'inprogress': 'in_progress',
    'progress': 'in_progress',
    'closed': 'closed',
    'close': 'closed',
    'finished': 'closed',
    'done': 'closed'
  };
  
  // Verificar se existe mapeamento
  if (statusMap[cleanStatus]) {
    const normalizedStatus = statusMap[cleanStatus];
    console.log(`🔄 Status mapping: "${status}" → "${normalizedStatus}"`);
    return normalizedStatus;
  }
  
  // Validar se é um status válido (caso já esteja normalizado)
  const validStatuses = ['open', 'in_progress', 'closed'];
  if (validStatuses.includes(cleanStatus)) {
    return cleanStatus;
  }
  
  // Se chegou aqui, o status é inválido
  throw new Error(`Invalid status "${status}". Must be: ${validStatuses.join(', ')} (or variations like "close", "in-progress")`);
};

// CONTROLLER SUPER SIMPLES PARA TESTE
export const create = async (req, res) => {
  try {
    // ETAPA 3: Validação de permissão - apenas clientes e suporte podem criar tickets
    if (!['client', 'support'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Only clients and support can open tickets' });
    }

    const { title, description, priority, type } = req.body;
    
    // Validação básica
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Validar type se fornecido
    if (type && !['bug', 'suporte_tecnico', 'solicitacao', 'sugestao_implementacao'].includes(type)) {
      return res.status(400).json({ error: 'Type must be one of: bug, suporte_tecnico, solicitacao, sugestao_implementacao' });
    }
    
    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || 'medium',
      type: type || 'suporte_tecnico',
      UserUuid: req.userId,
      CompanyUuid: req.companyId,
    });
    
    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const index = async (req, res) => {
  try {
    console.log('🔍 Fetching tickets for user:', {
      userId: req.userId,
      userRole: req.userRole,
      companyId: req.companyId,
      queryParams: req.query
    });

    let where = {};
    
    // ETAPA 3: Lógica de permissão para visualização
    if (req.userRole === 'support') {
      // Suporte pode ver todos os tickets
      console.log('🔧 Support user - fetching all tickets');
    } else {
      // Cliente vê apenas tickets da própria empresa
      where.CompanyUuid = req.companyId;
      console.log('👤 Client user - filtering by company:', req.companyId);
    }
    
    // FILTROS DINÂMICOS baseados nos query parameters
    const { status, priority, type, assignedToUuid, search } = req.query;
    
    // Filtro por status
    if (status) {
      try {
        const normalizedStatus = normalizeStatus(status);
        if (normalizedStatus) {
          where.status = normalizedStatus;
          console.log(`🔎 Filtering by status: "${status}" → "${normalizedStatus}"`);
          console.log(`🔍 WHERE clause after status filter:`, where);
        }
      } catch (error) {
        console.error(`❌ Error normalizing status "${status}":`, error.message);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Filtro por priority
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority)) {
        where.priority = priority;
        console.log(`🔎 Filtering by priority: ${priority}`);
      } else {
        return res.status(400).json({ 
          error: `Invalid priority "${priority}". Must be: ${validPriorities.join(', ')}` 
        });
      }
    }
    
    // Filtro por type
    if (type) {
      const validTypes = ['bug', 'suporte_tecnico', 'solicitacao', 'sugestao_implementacao'];
      if (validTypes.includes(type)) {
        where.type = type;
        console.log(`� Filtering by type: ${type}`);
      } else {
        return res.status(400).json({ 
          error: `Invalid type "${type}". Must be: ${validTypes.join(', ')}` 
        });
      }
    }
    
    // Filtro por assignedToUuid (apenas para suporte)
    if (assignedToUuid && req.userRole === 'support') {
      if (assignedToUuid === 'null' || assignedToUuid === 'unassigned') {
        where.assignedToUuid = null;
        console.log('🔎 Filtering by unassigned tickets');
      } else {
        where.assignedToUuid = assignedToUuid;
        console.log(`🔎 Filtering by assignedToUuid: ${assignedToUuid}`);
      }
    }
    
    console.log('🔎 Final WHERE clause:', where);
    
    // Buscar tickets com filtros aplicados
    const tickets = await Ticket.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['uuid', 'name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['uuid', 'name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 Found ${tickets.length} tickets with filters`);
    
    // Debug: mostrar status dos tickets encontrados
    if (tickets.length > 0) {
      console.log('📋 Status of found tickets:', tickets.map(t => `${t.uuid}: ${t.status}`));
      if (status) {
        const matchingStatus = tickets.filter(t => t.status === normalizeStatus(status));
        console.log(`🎯 Tickets matching status "${status}": ${matchingStatus.length}/${tickets.length}`);
      }
    }
    
    // Aplicar filtro de busca por texto (se fornecido)
    let filteredTickets = tickets;
    if (search && tickets.length > 0) {
      const searchLower = search.toLowerCase();
      filteredTickets = tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
      );
      console.log(`🔍 After text search "${search}": ${filteredTickets.length} tickets`);
    }
    
    // Garantir que sempre retornamos um array válido
    const response = { 
      tickets: filteredTickets || [],
      count: filteredTickets ? filteredTickets.length : 0,
      filters: {
        status: status || null,
        priority: priority || null,
        type: type || null,
        assignedToUuid: assignedToUuid || null,
        search: search || null
      },
      debug: {
        whereClause: where,
        userRole: req.userRole,
        totalFound: tickets.length,
        afterTextFilter: filteredTickets.length
      }
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const show = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['uuid', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['uuid', 'name', 'email'],
          required: false
        }
      ]
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // ETAPA 3: Verificar permissões - cliente só vê tickets da própria empresa
    if (req.userRole === 'client' && ticket.CompanyUuid !== req.companyId) {
      return res.status(403).json({ error: 'You can only view tickets from your company' });
    }
    
    return res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, description, priority, status, type } = req.body;
    
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Normalizar status usando função utilitária
    if (status) {
      try {
        status = normalizeStatus(status);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Atualizar campos fornecidos
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (priority) ticket.priority = priority;
    if (status) ticket.status = status;
    if (type) ticket.type = type;
    
    await ticket.save();
    
    return res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    // ETAPA 3: Validação de permissão - apenas suporte pode alterar status
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support can update status' });
    }

    const { id } = req.params;
    let { status } = req.body;
    
    // Normalizar e validar status usando função utilitária
    try {
      status = normalizeStatus(status);
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    console.log(`🔄 Updating ticket ${id} status from "${ticket.status}" to "${status}"`);
    
    ticket.status = status;
    await ticket.save();
    
    console.log(`✅ Ticket ${id} status updated successfully to "${status}"`);
    
    return res.json({
      message: `Ticket status updated to ${status}`,
      ticket: {
        uuid: ticket.uuid,
        title: ticket.title,
        status: ticket.status,
        updatedAt: ticket.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};

export const assignToSupport = async (req, res) => {
  try {
    // ETAPA 3: Adicionar validações de permissão
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support users can assign tickets' });
    }

    const { id } = req.params;
    const { supportUserId } = req.body;
    
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Se supportUserId for fornecido, verificar se o usuário existe e é suporte
    if (supportUserId) {
      const supportUser = await User.findByPk(supportUserId);
      if (!supportUser) {
        return res.status(404).json({ error: 'Support user not found' });
      }
      if (supportUser.role !== 'support') {
        return res.status(400).json({ error: 'User must have support role' });
      }
      ticket.assignedToUuid = supportUserId;
    } else {
      // Se não for fornecido supportUserId, atribuir ao próprio usuário logado
      ticket.assignedToUuid = req.userId;
    }
    
    // REGRA DE NEGÓCIO: Automaticamente mover status para 'in_progress' quando atribuído
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    
    await ticket.save();
    
    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['uuid', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['uuid', 'name', 'email']
        }
      ]
    });
    
    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const unassignTicket = async (req, res) => {
  try {
    // ETAPA 3: Adicionar validação de permissão
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support users can unassign tickets' });
    }

    const { id } = req.params;
    
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    ticket.assignedToUuid = null;
    
    // REGRA DE NEGÓCIO: Voltar status para 'open' quando desatribuído
    if (ticket.status === 'in_progress') {
      ticket.status = 'open';
    }
    
    await ticket.save();
    
    const updatedTicket = await Ticket.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['uuid', 'name', 'email']
      }]
    });
    
    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error unassigning ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const myTickets = async (req, res) => {
  try {
    // ETAPA 3: Adicionar validação de permissão
    if (req.userRole !== 'support') {
      return res.status(403).json({ error: 'Only support users can access my tickets' });
    }

    console.log('🔍 Fetching my tickets for support user:', req.userId);

    const tickets = await Ticket.findAll({
      where: { assignedToUuid: req.userId },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['uuid', 'name', 'email'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 Found ${tickets.length} tickets assigned to user ${req.userId}`);
    
    const response = {
      tickets: tickets || [],
      count: tickets ? tickets.length : 0
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error fetching my tickets:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};

// Função de teste para verificar filtros de status
export const testStatusFilter = async (req, res) => {
  try {
    console.log('🧪 TESTING STATUS FILTER...');
    
    const { status } = req.query;
    console.log(`🔍 Testing with status parameter: "${status}"`);
    
    if (!status) {
      return res.status(400).json({ error: 'Please provide status parameter' });
    }
    
    // 1. Testar normalização
    let normalizedStatus;
    try {
      normalizedStatus = normalizeStatus(status);
      console.log(`✅ Status normalized: "${status}" → "${normalizedStatus}"`);
    } catch (error) {
      console.error(`❌ Normalization failed:`, error.message);
      return res.status(400).json({ error: error.message });
    }
    
    // 2. Contar todos os tickets
    const totalTickets = await Ticket.count();
    console.log(`📊 Total tickets in database: ${totalTickets}`);
    
    // 3. Contar tickets com o status específico
    const ticketsWithStatus = await Ticket.count({
      where: { status: normalizedStatus }
    });
    console.log(`🎯 Tickets with status "${normalizedStatus}": ${ticketsWithStatus}`);
    
    // 4. Buscar tickets com filtro
    const where = { status: normalizedStatus };
    const filteredTickets = await Ticket.findAll({
      where,
      attributes: ['uuid', 'title', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`📋 Found tickets:`, filteredTickets.map(t => `${t.uuid}: ${t.status}`));
    
    return res.json({
      test: {
        inputStatus: status,
        normalizedStatus,
        totalTickets,
        ticketsWithStatus,
        foundTickets: filteredTickets.length,
        tickets: filteredTickets.map(t => ({
          uuid: t.uuid,
          title: t.title,
          status: t.status,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Função de DEBUG para verificar dados brutos
export const debug = async (req, res) => {
  try {
    console.log('🐛 DEBUG: Checking raw data...');
    
    // 1. Contar tickets sem filtros
    const totalTickets = await Ticket.count();
    console.log(`📊 Total tickets in database: ${totalTickets}`);
    
    // 2. Listar todos os tickets sem includes
    const allTickets = await Ticket.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    console.log(`📝 Sample tickets:`, allTickets.map(t => ({
      uuid: t.uuid,
      title: t.title,
      UserUuid: t.UserUuid,
      CompanyUuid: t.CompanyUuid,
      assignedToUuid: t.assignedToUuid
    })));
    
    // 3. Contar usuários
    const totalUsers = await User.count();
    console.log(`👥 Total users in database: ${totalUsers}`);
    
    // 4. Informações do req
    console.log('🔐 Request info:', {
      userId: req.userId,
      userRole: req.userRole,
      companyId: req.companyId
    });
    
    return res.json({
      debug: {
        totalTickets,
        totalUsers,
        sampleTickets: allTickets.map(t => ({
          uuid: t.uuid,
          title: t.title,
          UserUuid: t.UserUuid,
          CompanyUuid: t.CompanyUuid,
          assignedToUuid: t.assignedToUuid
        })),
        requestInfo: {
          userId: req.userId,
          userRole: req.userRole,
          companyId: req.companyId
        }
      }
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({ error: error.message });
  }
};

console.log('ETAPA 3 - Controller com validações e regras de negócio funcionando!');
