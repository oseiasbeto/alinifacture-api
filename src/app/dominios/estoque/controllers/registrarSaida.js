// controllers/.../registrarSaida.js
const Produto = require('../../../models/Produto');
const Estoque = require('../../../models/Estoque');
const Despesa = require('../../../models/Despesa');

async function registrarMovimento({
    produtoId, tipo, quantidade, motivo, observacao, usuarioId,
    custoUnitario, formaPagamento, registrarDespesa = true,
}) {
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

    // Regista a despesa (custo da mercadoria que saiu do estoque)
    let despesa = null;
    if (tipo === 'saida' && registrarDespesa) {
        const custo = Number(custoUnitario ?? produto.precoCompra ?? produto.custo ?? 0);
        const valorTotal = custo * Number(quantidade);

        if (valorTotal > 0) {
            despesa = await Despesa.create({
                descricao: `Saída de estoque - ${produto.nome}${motivo ? ` (${motivo})` : ''}`,
                categoria: 'saida_estoque',
                valor: valorTotal,
                produto: produtoId,
                movimentoEstoque: movimento._id,
                quantidade: Number(quantidade),
                custoUnitario: custo,
                formaPagamento,
                observacao: observacao || motivo,
                usuario: usuarioId,
            });
        }
    }

    return { produto, movimento, despesa };
}

const registrarSaida = async (req, res) => {
    try {
        const {
            produtoId, quantidade, motivo, observacao,
            custoUnitario, formaPagamento, registrarDespesa,
        } = req.body;

        if (!quantidade || quantidade <= 0) {
            return res.status(400).json({ success: false, message: 'Quantidade inválida' });
        }
        if (custoUnitario !== undefined && Number(custoUnitario) < 0) {
            return res.status(400).json({ success: false, message: 'Custo unitário inválido' });
        }

        const { produto, movimento, despesa } = await registrarMovimento({
            produtoId,
            tipo: 'saida',
            quantidade,
            motivo,
            observacao,
            usuarioId: req.user?.id,
            custoUnitario,
            formaPagamento,
            registrarDespesa: registrarDespesa !== false,
        });

        return res.status(201).json({
            success: true,
            produto,
            movimento,
            despesa,
            message: 'Saída registada com sucesso',
        });
    } catch (error) {
        console.error('Erro ao registrar saída de estoque:', error);
        if (error?.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Erro interno ao registrar saída de estoque' });
    }
};

module.exports = registrarSaida;