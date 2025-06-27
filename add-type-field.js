import { sequelize } from './src/config/database.js';

async function addTypeColumn() {
  try {
    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' AND column_name = 'type'
    `);
    
    if (results.length === 0) {
      // Adicionar a coluna type como varchar primeiro
      await sequelize.query(`
        ALTER TABLE tickets 
        ADD COLUMN type VARCHAR(50) DEFAULT 'suporte_tecnico'
      `);
      
      console.log('✅ Coluna type adicionada como VARCHAR');
    }
    
    // Criar o ENUM type se não existir
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tickets_type') THEN
          CREATE TYPE enum_tickets_type AS ENUM ('bug', 'suporte_tecnico', 'solicitacao', 'sugestao_implementacao');
        END IF;
      END
      $$;
    `);
    
    console.log('✅ ENUM type criado');
    
    // Remover o default temporariamente
    await sequelize.query(`
      ALTER TABLE tickets ALTER COLUMN type DROP DEFAULT
    `);
    
    // Alterar a coluna para usar o ENUM
    await sequelize.query(`
      ALTER TABLE tickets 
      ALTER COLUMN type TYPE enum_tickets_type 
      USING type::enum_tickets_type
    `);
    
    // Adicionar o default de volta
    await sequelize.query(`
      ALTER TABLE tickets ALTER COLUMN type SET DEFAULT 'suporte_tecnico'::enum_tickets_type
    `);
    
    console.log('✅ Campo type configurado como ENUM com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar campo type:', error.message);
    process.exit(1);
  }
}

addTypeColumn();
