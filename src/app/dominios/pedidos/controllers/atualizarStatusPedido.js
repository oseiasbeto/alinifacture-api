const Pedido = require('../../../models/Pedido');

// Para onde cada status pode avançar (ou recuar, em caso de engano).
// 'entregue' e 'cancelado' são estados finais.
const TRANSICOES_PERMITIDAS = {
  pendente: ['em_execucao', 'cancelado'],
  em_execucao: ['pronto', 'pendente', 'cancelado'],
  pronto: ['entregue', 'em_execucao', 'cancelado'],
  pronto_entrega: ['entregue', 'em_execucao', 'cancelado'],
  entregue: [],
  cancelado: [],
};

// Que status cada cargo pode DEFINIR.
// - caixa (atendimento): só até "pendente"
// - designer: até "pronto"
// - producao: até "entregue"
// - gerente/administrador: tudo (incluindo cancelar)
const PERMISSOES_POR_CARGO = {
  caixa: ['pendente', 'entregue', 'cancelado'],
  designer: ['pendente', 'em_execucao', 'pronto'],
  producao: ['pendente', 'em_execucao', 'pronto', 'pronto_entrega',],
  gerente: ['pendente', 'em_execucao', 'pronto', 'pronto_entrega', 'entregue', 'cancelado'],
  administrador: ['pendente', 'em_execucao', 'pronto', 'pronto_entrega', 'entregue', 'cancelado'],
};

const atualizarStatusPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacao } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'O novo status é obrigatório' });
    }


    console.log(status)

    const cargo = req.user?.cargo;

    console.log(req.user);
    
    const quem = req.user?.id;

    if (!quem) {
      return res.status(401).json({ success: false, message: 'Utilizador não autenticado' });
    }

    // 1) Permissão do cargo
    const statusPermitidosCargo = PERMISSOES_POR_CARGO[cargo] || [];
    
    if (!statusPermitidosCargo.includes(status)) {
      return res.status(403).json({
        success: false,
        message: `O cargo "${cargo}" não tem permissão para definir o status "${status}"`,
      });
    }

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    if (pedido.status === status) {
      return res.status(400).json({ success: false, message: 'O pedido já está nesse status' });
    }

    // 2) Transição válida
    /* 
    const permitido = TRANSICOES_PERMITIDAS[pedido.status] || [];
    
    if (!permitido.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Não é possível mudar o pedido de "${pedido.status}" para "${status}"`,
      });
    }*/

    // 3) Regista quem fez a mudança (lido pelo hook pre('save'))
    pedido._statusChangedBy = quem;
    pedido._statusObservacao = observacao;

    // 4) Regista o responsável conforme o trabalho feito (usado no ranking)
    if (cargo === 'designer' && (status === 'em_execucao' || status === 'pronto')) {
      // Quem começa fica com o crédito, mas quem conclui ("pronto") passa a ser o responsável.
      if (status === 'pronto' || !pedido.responsavelDesign) {
        pedido.responsavelDesign = quem;
      }
    }

    if (status === 'entregue' && cargo === 'producao') {
      pedido.responsavelProducao = quem;
    }

    pedido.status = status;
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