// Teste de importação do controller
import * as ticketController from './controllers/ticketController.js';

console.log('Testing controller import...');
console.log('ticketController:', ticketController);
console.log('create function:', typeof ticketController.create);
console.log('index function:', typeof ticketController.index);

// Verificar se todas as funções existem
const expectedFunctions = ['create', 'index', 'show', 'update', 'updateStatus', 'assignToSupport', 'unassignTicket', 'myTickets'];

expectedFunctions.forEach(funcName => {
  console.log(`${funcName}:`, typeof ticketController[funcName]);
});

export default ticketController;
