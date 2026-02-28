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

// configurando as rotas
router.post("/login", login)
router.post("/registro", registro)
router.post("/refresh-token", refreshToken)
router.post("/logout", logout)

// exportando as rotas
module.exports = router