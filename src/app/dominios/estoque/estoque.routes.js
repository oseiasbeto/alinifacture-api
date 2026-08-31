const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// configurando as rotas
router.get('/resumo', protectedRoute, require("./controllers/resumoEstoque"));
router.get('/niveis', protectedRoute, require("./controllers/listarNiveis"));
router.get('/movimentos', protectedRoute, require("./controllers/listarMovimentos"));
router.post('/entrada', protectedRoute, require("./controllers/registrarEntrada"));
router.post('/saida', protectedRoute, require("./controllers/registrarSaida"));
router.post('/ajuste', protectedRoute, require("./controllers/ajustarEstoque"));

// exportando as rotas
module.exports = router