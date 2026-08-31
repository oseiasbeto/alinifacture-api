const Produto = require('../../../models/Produto');
const Estoque = require('../../../models/Estoque');

async function registrarMovimento({ produtoId, tipo, quantidade, motivo, observacao, usuarioId }) {
    const produto = await Produto.findById(produtoId);
    if (!produto) throw { status: 404, message: 'Produto não encontrado' };
    if (!produto.controlaEstoque) throw { status: 400, message: 'Este produto não tem controlo de estoque ativado' };

    const quantidadeAnterior = produto.quantidade;
    let quantidadeAtual;

    if (tipo === 'entrada') {
        quantidadeAtual = quantidadeAnterior + Number(quantidade);
    } else if (tipo === 'saida') {
        if (Number(quantidade) > quantidadeAnterior) {
            throw { status: 400, message: 'Quantidade insuficiente em estoque' };
        }
        quantidadeAtual = quantidadeAnterior - Number(quantidade);
    } else if (tipo === 'ajuste') {
        // Aqui "quantidade" é o novo valor absoluto do estoque
        quantidadeAtual = Number(quantidade);
    }

    produto.quantidade = quantidadeAtual;
    await produto.save();

    const movimento = await Estoque.create({
        produto: produtoId,
        tipo,
        quantidade: tipo === 'ajuste' ? Math.abs(quantidadeAtual - quantidadeAnterior) : Number(quantidade),
        quantidadeAnterior,
        quantidadeAtual,
        motivo,
        observacao,
        usuario: usuarioId,
    });

    return { produto, movimento };
}

const registrarSaida = async (req, res) => {
    try {
        const { produtoId, quantidade, motivo, observacao } = req.body;
        if (!quantidade || quantidade <= 0) {
            return res.status(400).json({ success: false, message: 'Quantidade inválida' });
        }

        const { produto, movimento } = await registrarMovimento({
            produtoId, tipo: 'saida', quantidade, motivo, observacao, usuarioId: req.user?.id,
        });

        return res.status(201).json({ success: true, produto, movimento, message: 'Saída registada com sucesso' });
    } catch (error) {
        console.error('Erro ao registrar saída de estoque:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao registrar saída de estoque' });
    }
};

module.exports = registrarSaida;