const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

const criarPedido = require('./controllers/criarPedido');
const listarPedidos = require('./controllers/listarPedidos');
const resumoPedidos = require('./controllers/resumoPedidos');
const buscarPedidoPorId = require('./controllers/buscarPedidoPorId');
const atualizarPedido = require('./controllers/atualizarPedido');
const atualizarStatusPedido = require('./controllers/atualizarStatusPedido');
const excluirPedido = require('./controllers/excluirPedido');

router.get('/resumo', protectedRoute, resumoPedidos);
router.get('/', protectedRoute, listarPedidos);
router.get('/:id', protectedRoute, buscarPedidoPorId);
router.post('/', protectedRoute, criarPedido);
router.put('/:id', protectedRoute, atualizarPedido);
router.patch('/:id/status', protectedRoute, atualizarStatusPedido);
router.delete('/:id', protectedRoute, excluirPedido);

// exportando as rotas
module.exports = router