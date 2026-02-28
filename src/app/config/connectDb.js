require("dotenv").config()
const mongoose = require('mongoose')

const connect = async () => {
    const appEnv = process.env.NODE_ENV
    const StringConnection = appEnv == 'prod' ? process.env.MONGO_ATLAS : process.env.MONGO_LOCAL
    const connection = await mongoose.connect(StringConnection, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
    console.log(`MongoDB conectado: ${connection.connection.host}`)
}

module.exports = connect