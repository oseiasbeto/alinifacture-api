const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

const resumoDashboard = require('./controllers/resumoDashboard');

router.get('/resumo/dashboard', protectedRoute, resumoDashboard);

// exportando as rotas
module.exports = router