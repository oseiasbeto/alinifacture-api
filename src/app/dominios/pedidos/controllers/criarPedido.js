const Pedido = require('../../../models/Pedido');
const gerarNumeroPedido = require('../../../utils/gerarNumeroPedido'); // ajuste o caminho conforme necessário

const criarPedido = async (req, res) => {
  try {
    const atendenteId = req.user?.id;

    if (!atendenteId) {
      return res.status(401).json({ success: false, message: 'Utilizador não identificado' });
    }

    const {
      cliente,
      contactoCliente,
      produto,
      tipoProduto,
      especificacoes,
      quantidade = 1,
      precoUnitario,
      dataEntregaPrevista,
      responsavelProducao,
      observacoes,
    } = req.body;

    if (!cliente) {
      return res.status(400).json({ success: false, message: 'Cliente é obrigatório' });
    }
    if (!tipoProduto?.trim()) {
      return res.status(400).json({ success: false, message: 'Informe o tipo de produto/serviço pedido' });
    }
    if (!especificacoes?.trim()) {
      return res.status(400).json({ success: false, message: 'As especificações do pedido são obrigatórias' });
    }

    const numeroPedido = await gerarNumeroPedido();

    const pedido = new Pedido({
      numeroPedido,
      cliente,
      contactoCliente,
      produto: produto || undefined,
      tipoProduto: tipoProduto.trim(),
      especificacoes: especificacoes.trim(),
      quantidade,
      precoUnitario: precoUnitario !== undefined && precoUnitario !== '' ? Number(precoUnitario) : undefined,
      dataEntregaPrevista: dataEntregaPrevista || undefined,
      responsavelProducao: responsavelProducao || undefined,
      observacoes,
      atendente: atendenteId,
    });

    await pedido.save();

    return res.status(201).json({
      success: true,
      pedido,
      message: 'Pedido criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao criar pedido' });
  }
};

module.exports = criarPedido;