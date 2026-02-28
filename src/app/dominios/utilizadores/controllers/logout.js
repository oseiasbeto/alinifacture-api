const Session = require('../../../models/Session');

const logout = async (req, res) => {
    try {
        const { session_id } = req.body

        if (session_id == '' || session_id == undefined) {
            res.status(400).send({
                message: "Informe o id da sessao."
            })
        }
        else {
            const session = await Session.findOne({
                id: session_id,
                status: 'a'
            })

            if (!session) return res.status(401).send({
                message: "Ups! nao achamos nenhuma sessao com este id."
            })
            else {
                await session.deleteOne()
                res.status(200).send({
                    message: "Sessao encerrada com sucesso!."
                })
            }
        }
    } catch (err) {
        console.log(err.message)
        // caso haja um erro interno retorne status 500.
        res.status(401).send({
            message: err.message
        })
    }
}

module.exports = logout
