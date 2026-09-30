const Pedido = require('../../../models/Pedido');
const Produto = require('../../../models/Produto'); // ajuste o caminho
const gerarNumeroPedido = require('../../../utils/gerarNumeroPedido'); // ajuste o caminho conforme necessário

const METODOS_VALIDOS = ['Dinheiro', 'Transferência Bancária', 'Multicaixa Express', 'Cartão de Crédito/Débito', 'Outro'];

// Reduz a quantidade do produto de forma ATÓMICA (uma única operação na base de dados),
// por isso dois pedidos simultâneos não se atropelam, e o resultado nunca é menor que 0.
// Só mexe em produtos com controlaEstoque = true.
// Requer MongoDB 4.2+ (update com pipeline).
const descontarEstoque = async (produtoId, qtd) => {
  const antes = await Produto.findOneAndUpdate(
    { _id: produtoId, controlaEstoque: true },
    [
      {
        $set: {
          quantidade: {
            $max: [0, { $subtract: [{ $ifNull: ['$quantidade', 0] }, qtd] }],
          },
        },
      },
    ],
    { new: false } // devolve o documento ANTES da alteração
  ).select('nome quantidade');

  if (!antes) return null; // produto não existe ou não controla estoque

  const disponivel = antes.quantidade || 0;
  return {
    nome: antes.nome,
    descontado: Math.min(disponivel, qtd),
    faltou: Math.max(0, qtd - disponivel),
  };
};

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
      valorAdicionalServico,
      dataEntregaPrevista,
      responsavelProducao,
      observacoes,
      imagens,
      metodoPagamento,
      tipoPagamento = 'a_vista',
      ordemSaque,
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
    if (!['a_vista', 'ordem_saque'].includes(tipoPagamento)) {
      return res.status(400).json({ success: false, message: 'Modalidade de pagamento inválida' });
    }

    const qtd = Number(quantidade);
    if (!Number.isFinite(qtd) || qtd < 1) {
      return res.status(400).json({ success: false, message: 'Quantidade inválida' });
    }

    const ehOrdemSaque = tipoPagamento === 'ordem_saque';

    const numeroPedido = await gerarNumeroPedido();

    const pedido = new Pedido({
      numeroPedido,
      cliente,
      contactoCliente,
      produto: produto || undefined,
      tipoProduto: tipoProduto.trim(),
      especificacoes: especificacoes.trim(),
      quantidade: qtd,
      precoUnitario: precoUnitario !== undefined && precoUnitario !== '' ? Number(precoUnitario) : undefined,
      dataEntregaPrevista: dataEntregaPrevista || undefined,
      responsavelProducao: responsavelProducao || undefined,
      observacoes,
      valorAdicionalServico,
      imagens: imagens || [],
      atendente: atendenteId,

      // Modalidade de pagamento
      metodoPagamento: ehOrdemSaque
        ? 'Ordem de Saque'
        : (METODOS_VALIDOS.includes(metodoPagamento) ? metodoPagamento : 'Dinheiro'),
      tipoPagamento: ehOrdemSaque ? 'ordem_saque' : 'a_vista',
      ordemSaque: ehOrdemSaque
        ? {
            numero: ordemSaque?.numero?.trim() || undefined,
            entidade: ordemSaque?.entidade?.trim() || undefined,
            estado: 'pendente',
          }
        : undefined,
    });

    // O histórico de status deve registar quem realmente criou o pedido
    pedido._criadoPor = atendenteId;

    // 1) Desconta o estoque (só se o pedido veio de um produto do catálogo)
    let estoque = null;
    if (produto) {
      estoque = await descontarEstoque(produto, qtd);
    }

    // 2) Grava o pedido; se falhar, devolve ao estoque o que foi descontado
    try {
      await pedido.save();
    } catch (err) {
      if (estoque?.descontado) {
        await Produto.updateOne({ _id: produto }, { $inc: { quantidade: estoque.descontado } })
          .catch((e) => console.error('Falha ao repor estoque após erro ao criar pedido:', e));
      }
      throw err;
    }

    return res.status(201).json({
      success: true,
      pedido,
      message: 'Pedido criado com sucesso',
      avisoEstoque: estoque?.faltou > 0
        ? `Estoque de "${estoque.nome}" insuficiente: faltaram ${estoque.faltou} unidade(s). O estoque ficou a 0.`
        : undefined,
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao criar pedido' });
  }
};

module.exports = criarPedido;