const bcrypt = require('bcryptjs');
const Utilizador = require('../../../models/Utilizador'); // ajuste o caminho correto
const Session = require('../../../models/Session'); // ajuste o caminho correto (nome do modelo exportado)
const moment = require('moment');

const { randomUUID } = require("crypto")

const generateAccessToken = require('../../../utils/generate-access-token');
const generateRefreshToken = require('../../../utils/generate-refresh-token');
const encryptRefreshToken = require('../../../utils/encrypt-refresh-token');

const login = async (req, res) => {
  try {
    const { email, palavraPasse } = req.body;

    // 1. Validação básica dos campos
    if (!email || !palavraPasse) {
      return res.status(400).json({
        success: false,
        message: 'Email e palavra-passe são obrigatórios.'
      });
    }

    // 2. Busca o utilizador pelo email (case insensitive)
    const cleanedEmail = email.trim().toLowerCase();

    const utilizador = await Utilizador.findOne({ email: cleanedEmail })
      .select('+palavraPasse nomeProprio apelido cargo empresa email telefone ultimoLogin ativo fotoPerfil');

    if (!utilizador) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // 3. Verifica se a conta está ativa
    if (!utilizador.ativo) {
      return res.status(403).json({
        success: false,
        message: 'Esta conta foi desativada. Contacte o administrador.'
      });
    }

    // 4. Verifica a palavra-passe
    const isMatch = await bcrypt.compare(palavraPasse, utilizador.palavraPasse);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Verificar chaves JWT
    if (!process.env.JWT_ACCESS_TOKEN_SECRET || !process.env.JWT_REFRESH_TOKEN_SECRET) {
      throw new Error("Configuração de tokens JWT incompleta.");
    }

    const expires_access_token_in = "7d";
    const expires_refresh_token_in = "1y";

    const access_token = generateAccessToken(utilizador, expires_access_token_in);
    const refresh_token = generateRefreshToken(utilizador, expires_refresh_token_in);
    const _encrypted_refresh_token = encryptRefreshToken(refresh_token);


    const newSession = new Session({
      id: randomUUID(),
      userAgent: (req.headers["user-agent"] || "unknown").substring(0, 255), // Limitar tamanho
      crypto: {
        key: _encrypted_refresh_token.key,
        iv: _encrypted_refresh_token.iv,
      },
      token: _encrypted_refresh_token.encrypted_refresh_token,
      user: utilizador._id,
      status: "a", // Garantir status explícito
    });

    // 7. Salva a nova sessão no banco de dados
    await newSession.save();
    // 9. Dados seguros para retornar ao frontend (sem palavra-passe)
    const utilizadorResponse = {
      _id: utilizador._id,
      nomeCompleto: utilizador.nomeProprio,
      email: utilizador.email,
      cargo: utilizador.cargo,
      telefone: utilizador.telefone || null,
      fotoPerfil: utilizador.fotoPerfil || null,
      ultimoLogin: utilizador.ultimoLogin,
      ativo: utilizador.ativo
    };

    // 10. Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      accessToken: access_token,
      sessaoId: newSession.id, // usando o campo 'identificador' em vez de _id
      utilizador: utilizadorResponse
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor. Tente novamente mais tarde.'
    });
  }
};

module.exports = login;