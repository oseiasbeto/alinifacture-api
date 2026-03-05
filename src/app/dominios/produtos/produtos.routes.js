const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const criarProduto = require("./controllers/criarProduto")
const listarProdutos = require("./controllers/listarProdutos")
const atualizarProduto = require("./controllers/atualizarProduto")
const deletarProduto = require("./controllers/deletarProduto")

// configurando as rotas
router.post("/", protectedRoute, criarProduto)
router.get("/", protectedRoute, listarProdutos)
router.put("/:id", protectedRoute, atualizarProduto)
router.delete("/:id", protectedRoute, deletarProduto)

// exportando as rotas
module.exports = router