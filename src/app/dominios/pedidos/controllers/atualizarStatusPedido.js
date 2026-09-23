const Pedido = require('../../../models/Pedido');

// Define para onde cada status pode avançar (ou recuar, em caso de engano).
// 'entregue' e 'cancelado' são estados finais — não têm mais transições.
const TRANSICOES_PERMITIDAS = {
  pendente: ['em_execucao', 'cancelado'],
  em_execucao: ['pronto', 'pendente', 'cancelado'],
  pronto: ['entregue', 'em_execucao', 'cancelado'],
  entregue: [],
  cancelado: [],
};

const atualizarStatusPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacao } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'O novo status é obrigatório' });
    }

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    if (pedido.status === status) {
      return res.status(400).json({ success: false, message: 'O pedido já está nesse status' });
    }

    const permitido = TRANSICOES_PERMITIDAS[pedido.status] || [];
    if (!permitido.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Não é possível mudar o pedido de "${pedido.status}" para "${status}"`,
      });
    }

    // Campos transitórios lidos pelo hook pre('save') do model, para
    // registar corretamente quem fez a mudança e a observação no histórico.
    pedido._statusChangedBy = req.user?.id;
    pedido._statusObservacao = observacao;
    pedido.status = status;
    pedido._criadoPor = req.user?.id

    console.log('Atualizando status do pedido:', pedido._id, 'para', status, 'por', req.user?.id);
    await pedido.save();

    return res.status(200).json({
      success: true,
      pedido,
      message: 'Status do pedido atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao atualizar status do pedido' });
  }
};

module.exports = atualizarStatusPedido;