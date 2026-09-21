const Pedido = require('../../../models/Pedido');

const atualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipoProduto,
      especificacoes,
      quantidade,
      precoUnitario,
      dataEntregaPrevista,
      responsavelProducao,
      contactoCliente,
      observacoes,
      imagens
    } = req.body;

    console.log(req.body)
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    if (['entregue', 'cancelado'].includes(pedido.status)) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar um pedido já entregue ou cancelado',
      });
    }

    if (tipoProduto !== undefined) pedido.tipoProduto = tipoProduto.trim();
    if (especificacoes !== undefined) pedido.especificacoes = especificacoes.trim();
    if (quantidade !== undefined) pedido.quantidade = quantidade;
    if (precoUnitario !== undefined) pedido.precoUnitario = precoUnitario === '' ? undefined : Number(precoUnitario);
    if (dataEntregaPrevista !== undefined) pedido.dataEntregaPrevista = dataEntregaPrevista || undefined;
    if (responsavelProducao !== undefined) pedido.responsavelProducao = responsavelProducao || undefined;
    if (contactoCliente !== undefined) pedido.contactoCliente = contactoCliente;
    if (observacoes !== undefined) pedido.observacoes = observacoes;
    if (imagens !== undefined) pedido.imagens = imagens;

    await pedido.save();

    return res.status(200).json({
      success: true,
      pedido,
      message: 'Pedido atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao atualizar pedido' });
  }
};

module.exports = atualizarPedido;