const Pedido = require('../../../models/Pedido');

const CARGOS_PERMITIDOS = ['caixa', 'administrador'];

// Caixa/administrador confirmam que o dinheiro da ordem de saque já refletiu na conta.
// A partir daqui o valor passa a contar nas receitas do dashboard.
const receberOrdemSaque = async (req, res) => {
  try {
    const cargo = req.user?.cargo?.toLowerCase(); // ajuste ao seu middleware de auth
    if (!CARGOS_PERMITIDOS.includes(cargo)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para confirmar recebimentos' });
    }

    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    if (pedido.tipoPagamento !== 'ordem_saque') {
      return res.status(400).json({ success: false, message: 'Este pedido não é por ordem de saque' });
    }
    if (pedido.ordemSaque?.estado === 'recebido') {
      return res.status(400).json({ success: false, message: 'O recebimento já foi confirmado' });
    }
    if (pedido.status === 'cancelado') {
      return res.status(400).json({ success: false, message: 'Pedido cancelado' });
    }

    const { dataRecebimento, observacao } = req.body;

    pedido.ordemSaque.estado = 'recebido';
    pedido.ordemSaque.dataRecebimento = dataRecebimento ? new Date(dataRecebimento) : new Date();
    pedido.ordemSaque.recebidoPor = req.user.id;
    pedido.ordemSaque.observacao = observacao?.trim() || undefined;
    await pedido.save();

    return res.json({ success: true, pedido, message: 'Recebimento confirmado' });
  } catch (error) {
    console.error('Erro ao confirmar ordem de saque:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao confirmar recebimento' });
  }
};

module.exports = receberOrdemSaque;

/* ------------------------------------------------------------------
 * ROTA (no seu ficheiro de rotas de pedidos, com o mesmo middleware de auth):
 *
 *   const receberOrdemSaque = require('../controllers/pedidos/receberOrdemSaque');
 *   router.patch('/:id/ordem-saque/receber', auth, receberOrdemSaque);
 *
 * ------------------------------------------------------------------
 * DASHBOARD: junte este filtro a TODAS as queries/aggregates de receita.
 * Ordens de saque ainda não recebidas não contam; pedidos antigos (sem o
 * campo) continuam a contar normalmente.
 *
 *   const filtroReceitaValida = {
 *     $nor: [{ tipoPagamento: 'ordem_saque', 'ordemSaque.estado': { $ne: 'recebido' } }],
 *   };
 *
 *   Pedido.aggregate([
 *     { $match: { status: { $ne: 'cancelado' }, ...filtroReceitaValida } },
 *     { $group: { _id: null, total: { $sum: '$valorTotal' } } },
 *   ]);
 *
 * Total "a receber" (cartão opcional no dashboard):
 *
 *   Pedido.aggregate([
 *     { $match: { status: { $ne: 'cancelado' }, tipoPagamento: 'ordem_saque', 'ordemSaque.estado': 'pendente' } },
 *     { $group: { _id: null, total: { $sum: '$valorTotal' } } },
 *   ]);
 *
 * ------------------------------------------------------------------
 * VUEX (nova action, adapte ao seu cliente HTTP):
 *
 *   async receberOrdemSaque(_, { id, ...payload }) {
 *     const { data } = await api.patch(`/pedidos/${id}/ordem-saque/receber`, payload)
 *     return data.pedido
 *   },
 * ------------------------------------------------------------------ */