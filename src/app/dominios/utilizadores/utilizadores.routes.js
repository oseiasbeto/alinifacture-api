const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const login = require("./controllers/login")
const registro = require("./controllers/registro")
const refreshToken = require("./controllers/refreshToken")
const logout = require("./controllers/logout")
const criarUtilizador = require('./controllers/criarUtilizador');
const listarUtilizadores = require('./controllers/listarUtilizadores');
const buscarUtilizadorPorId = require('./controllers/buscarUtilizadorPorId');
const atualizarUtilizador = require('./controllers/atualizarUtilizador');
const redefinirSenhaUtilizador = require('./controllers/redefinirSenhaUtilizador');
const eliminarUtilizador = require('./controllers/eliminarUtilizador');
const resumoUtilizadores = require('./controllers/resumoUtilizadores');

// configurando as rotas
router.post("/login", login)
router.post("/registro", registro)
router.post("/refresh-token", refreshToken)
router.post("/logout", logout)


router.get('/resumo', resumoUtilizadores);
router.get('/', protectedRoute, listarUtilizadores);
router.get('/:id', protectedRoute, buscarUtilizadorPorId);
router.post('/', protectedRoute, criarUtilizador);
router.put('/:id', protectedRoute, atualizarUtilizador);
router.patch('/:id/redefinir-senha', protectedRoute, redefinirSenhaUtilizador);
router.delete('/:id', protectedRoute, eliminarUtilizador);

// exportando as rotas
module.exports = router