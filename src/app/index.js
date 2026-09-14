// Importando as bibliotecas necessárias
require('dotenv').config() // Carrega variáveis de ambiente do arquivo .env
const path = require("path") // Módulo nativo do Node.js para manipulação de caminhos de arquivos/diretórios
const cors = require("cors") // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const express = require("express") // Framework web para Node.js
const app = express() // Criando uma instância do Express
const bodyParser = require('body-parser') // Middleware para processar dados do corpo da requisição

// Conectando ao banco de dados
const connectDB = require('./config/connectDb'); // Importa a função de conexão com o banco de dados
connectDB(); // Chama a função para estabelecer a conexão

// Configuração dos middlewares
app.use(cors()) // Habilita CORS para permitir requisições de diferentes domínios
app.use(express.json()) // Permite o recebimento de JSON no corpo das requisições
app.use(bodyParser.urlencoded({ extended: true })); // Configura o body-parser para processar dados codificados na URL

// Servindo arquivos estáticos da pasta 'uploads'
app.use("/files", express.static(path.resolve(__dirname, "..", "uploads")))

// Importando as rotas do aplicativo
const utilizadores = require("./dominios/utilizadores/utilizadores.routes") // Rotas relacionadas a utilizadores
const produtos = require("./dominios/produtos/produtos.routes") // Rotas relacionadas a produtos
const clientes = require("./dominios/clientes/clientes.routes") // Rotas relacionadas a clientes
const estoque = require("./dominios/estoque/estoque.routes") // Rotas relacionadas a clientes
const pedidos = require("./dominios/pedidos/pedidos.routes") // Rotas relacionadas a clientes
const financeiro = require("./dominios/financeiro/financeiro.routes") // Rotas relacionadas a financeiro

// Registrando as rotas no aplicativo
app.use("/v1/utilizadores", utilizadores) // Rotas relacionadas a utilizadores
app.use("/v1/produtos", produtos) // Rotas relacionadas a produtos (ajuste o prefixo conforme necessário)
app.use("/v1/clientes", clientes) // Rotas relacionadas a clientes
app.use("/v1/estoque", estoque) // Rotas relacionadas a estoque
app.use("/v1/pedidos", pedidos) // Rotas relacionadas a pedidos

app.use("/v1/financeiro", financeiro) // Rotas relacionadas a financeiro

// Rota de boas-vindas
app.get("/", async (req, res) => {
    res.json({
        message: "🚀 Bem-vindo à API da Alini Facture", 
    })
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack); // Exibe o erro no console para facilitar o debug

    // Retorna uma resposta de erro para o cliente
    res.status(500).json({
        message: 'Ocorreu um erro interno, por favor tente novamente mais tarde.', // Mensagem genérica para o usuário
        error: process.env.NODE_ENV === 'dev' ? err : {} // Exibe detalhes do erro apenas em ambiente de desenvolvimento
    });
});

// Exportando a instância do Express para ser utilizada em outros módulos
module.exports = { app }
