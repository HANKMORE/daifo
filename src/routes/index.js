const { Router } = require('express');
const router = Router();

const { 
    getUsers, 
    createUser, 
    loginUser, 
    getClients, 
    getVisitHistory, 
    getClientDetails,
    getVisitHistoryByClientId
} = require('../controllers/index.controller');

// Rutas para empleados
router.get('/appweb_empleado', getUsers);
router.post('/appweb_empleado', createUser);

// Ruta para autenticación
router.post('/login', loginUser);

// Rutas para clientes
router.get('/clientes', getClients); // Obtener todos los clientes
router.get('/visit_history/:cliente_id', getVisitHistory); // Obtener historial de visitas de un cliente
router.get('/client_details/:cliente_id', getClientDetails); // Obtener detalles de un cliente (datos, última visita e historial)
router.get('/api/clientes/:cliente_id/visitas', getVisitHistoryByClientId); // Obtener detalles de un cliente (datos, última visita e historial)
module.exports = router;
