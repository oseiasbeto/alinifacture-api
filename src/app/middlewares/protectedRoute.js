
require("dotenv").config()
const jwt = require("jsonwebtoken")

const protectedRoute = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.status(401).send({ nessagem: "Informe o seu token de acesso." })

    const partts = authHeader.split(" ")

    if (!partts.length == 2)
        return res.status(401).send({ message: "Token invalido." })

    const [schema, token] = partts

    if (!/^Bearer$/i.test(schema))
        return res.status(401).send({ message: "Token mal formatado." })

    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: "Token invalido." })
        
        req.user = decoded
        return next()
    })
}

module.exports = protectedRoute