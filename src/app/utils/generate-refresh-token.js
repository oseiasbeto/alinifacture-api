const { sign } = require("jsonwebtoken") ;

const generateRefreshToken = (user, expiresIn) => {
    const secreet_key = process.env.JWT_REFRESH_TOKEN_SECRET

    const refresh_token = sign({
        id: user._id,
        email: user.email,
        name: user.nomeProprio,
        cargo: user.cargo
    }, secreet_key, {
        expiresIn: expiresIn
    })

    return refresh_token
}

module.exports = generateRefreshToken