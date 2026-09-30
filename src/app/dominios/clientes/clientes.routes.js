const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
const { totaisCompras, comprasDoCliente } = require('./controllers/comprasCliente');
//const validObjectId = require("../../middlewares/validObjectId")

router.post('/', protectedRoute, require('./controllers/criarCliente'));
router.get('/', protectedRoute, require('./controllers/listarClientes'));
router.get('/resumo', protectedRoute, require('./controllers/resumoClientes'));
router.put('/:id', protectedRoute, require('./controllers/atualizarCliente'));
router.delete('/:id', protectedRoute, require('./controllers/deletarCliente'));


router.get('/compras/totais', protectedRoute, totaisCompras)
router.get('/:id/compras', protectedRoute, comprasDoCliente)

// exportando as rotas
module.exports = router