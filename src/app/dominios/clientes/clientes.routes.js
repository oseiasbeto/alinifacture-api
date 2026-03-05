const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const criarCliente = require('./controllers/criarCliente');
const listarClientes = require('./controllers/listarClientes');
const atualizarCliente = require('./controllers/atualizarCliente');
const deletarCliente = require('./controllers/deletarCliente');

router.post('/', protectedRoute, criarCliente);
router.get('/', protectedRoute, listarClientes);
router.put('/:id', protectedRoute, atualizarCliente);
router.delete('/:id', protectedRoute, deletarCliente);

// exportando as rotas
module.exports = router