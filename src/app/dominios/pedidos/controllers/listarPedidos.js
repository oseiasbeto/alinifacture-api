const Pedido = require('../../../models/Pedido');

const listarPedidos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, busca } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (busca) {
      const regex = { $regex: busca.trim(), $options: 'i' };
      filter.$or = [
        { numeroPedido: regex },
        { nomeCliente: regex },
        { tipoProduto: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [pedidos, totalDocs] = await Promise.all([
      Pedido.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('cliente', 'nome telefone')
        .populate('atendente', 'nomeProprio')
        .populate('produto', 'nome')
        .lean(),
      Pedido.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pedidos,
      pagination: {
        page,
        limit,
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit) || 1,
        hasNextPage: page * limit < totalDocs,
        hasPrevPage: page > 1,
      },
      message: 'Pedidos listados com sucesso',
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao listar pedidos' });
  }
};

module.exports = listarPedidos;