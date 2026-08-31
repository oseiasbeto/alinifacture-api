const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

router.post('/', protectedRoute, require('./controllers/criarCliente'));
router.get('/', protectedRoute, require('./controllers/listarClientes'));
router.get('/resumo', protectedRoute, require('./controllers/resumoClientes'));
router.put('/:id', protectedRoute, require('./controllers/atualizarCliente'));
router.delete('/:id', protectedRoute, require('./controllers/deletarCliente'));

// exportando as rotas
module.exports = router