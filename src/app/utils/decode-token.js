const { verify } = require("jsonwebtoken");

const decodeToken = (token, secreetKey) => {
    try {
        const decoded = verify(token, secreetKey);
        return decoded;
    } catch (error) {
        // Retorna null em vez de lançar exceção
        return null;
    }
}

module.exports = decodeToken;