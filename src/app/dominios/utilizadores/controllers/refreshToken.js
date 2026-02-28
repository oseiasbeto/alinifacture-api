const Utilizador = require('../../../models/Utilizador'); // ajuste o caminho correto
const Session = require('../../../models/Session'); // ajuste o caminho correto (nome do modelo exportado)
const moment = require('moment');

const generateAccessToken = require('../../../utils/generate-access-token');
const generateRefreshToken = require('../../../utils/generate-refresh-token');
const encryptRefreshToken = require('../../../utils/encrypt-refresh-token');
const decryptRefreshToken = require('../../../utils/decrypt-refresh-token');
const decodeToken = require('../../../utils/decode-token');

const refreshToken = async (req, res) => {
    try {
        const { session_id } = req.body;

        // Validação mais robusta do session_id
        if (!session_id || typeof session_id !== "string" || session_id.trim() === "") {
            return res.status(400).send({
                message: "Informe um ID de sessão válido.",
            });
        }

        // Busca a sessão de forma atômica
        const session = await Session.findOne(
            { id: session_id, status: "a" }
        );

        if (!session) {
            return res.status(401).send({
                message: "Nenhuma sessão ativa encontrada com este ID.",
            });
        }

        const _key = session.crypto.key;
        const iv = session.crypto.iv;
        const encrypted_refresh_token = session.token;
        const secret_refresh_token_key = process.env.JWT_REFRESH_TOKEN_SECRET;

        if (!secret_refresh_token_key) {
            throw new Error("Chave secreta de refresh token não configurada.");
        }

        const decrypt_token = decryptRefreshToken({
            key: _key,
            iv,
            encryptedRefreshToken: encrypted_refresh_token,
        });

        const decoded_data = decodeToken(decrypt_token, secret_refresh_token_key);
        const utilizador = await Utilizador.findOne({ _id: decoded_data?.id })
        .populate("empresa")

        if (!utilizador) {
            return res.status(400).send({
                message: "Usuário não encontrado. Faça login novamente.",
            });
        }

        // Verificar se a sessão pertence ao usuário decodificado (opcional, se aplicável)
        if (session?.user?.toString() !== utilizador?._id.toString()) {
            return res.status(403).send({
                message: "Sessão não pertence a este usuário.",
            });
        }

        const expires_access_token_in = "30d";
        const expires_refresh_token_in = "1y";

        const access_token = generateAccessToken(utilizador, expires_access_token_in);
        const refresh_token = generateRefreshToken(utilizador, expires_refresh_token_in);
        const _encrypted_refresh_token = encryptRefreshToken(refresh_token);

        // Atualizar a sessão com o novo token
        await session.updateOne({
            $set: {
                userAgent: req.headers["user-agent"]?.substring(0, 255) || "unknown", // Limitar tamanho
                crypto: {
                    key: _encrypted_refresh_token.key,
                    iv: _encrypted_refresh_token.iv,
                },
                token: _encrypted_refresh_token.encrypted_refresh_token
            },
        });

        const utilizadorResponse = {
            _id: utilizador._id,
            nomeCompleto: utilizador.nomeProprio,
            email: utilizador.email,
            cargo: utilizador.cargo,
            empresa: utilizador.empresa,
            telefone: utilizador.telefone || null,
            fotoPerfil: utilizador.fotoPerfil || null,
            ultimoLogin: utilizador.ultimoLogin,
            ativo: utilizador.ativo
        };

        return res.status(200).send({
            accessToken: access_token,
            sessaoId: session.id,
            utilizador: utilizadorResponse,
            message: "Token de acesso atualizado com sucesso.",
        });
    } catch (err) {
        console.error("Erro ao atualizar token:", err);
        return res.status(500).send({
            message: "Erro interno ao processar a solicitação.",
        });
    }
}

module.exports = refreshToken