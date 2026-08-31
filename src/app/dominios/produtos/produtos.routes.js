const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// configurando as rotas
router.post("/", protectedRoute, require("./controllers/criarProduto"))
router.get("/", protectedRoute, require("./controllers/listarProdutos"))
router.get("/resumo", protectedRoute, require("./controllers/resumoProduto"))
router.get("/:id", protectedRoute, require("./controllers/detalhesProduto"))
router.put("/:id", protectedRoute, require("./controllers/atualizarProduto"))
router.delete("/:id", protectedRoute, require("./controllers/deletarProduto"))

// exportando as rotas
module.exports = router