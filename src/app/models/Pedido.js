const mongoose = require('mongoose');

// Cada mudança de status fica registada aqui, com quem fez e quando —
// dá para reconstruir o percurso completo do pedido (pendente -> em produção -> entregue).
const historicoStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pendente', 'em_execucao', 'pronto', 'pronto_entrega', 'entregue', 'cancelado'],
    required: true,
  },
  data: { type: Date, default: Date.now },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilizador' },
  observacao: String,
}, { _id: false });

// Dados da modalidade "Ordem de saque" (ex: clientes do Estado que pagam depois).
// Só é preenchido quando tipoPagamento === 'ordem_saque'.
const ordemSaqueSchema = new mongoose.Schema({
  numero: { type: String, trim: true },      // nº da ordem de saque (opcional)
  entidade: { type: String, trim: true },    // entidade pagadora (opcional)
  estado: {
    type: String,
    enum: ['pendente', 'recebido'],
    default: 'pendente',
  },
  dataRecebimento: Date,                      // quando o dinheiro refletiu na conta
  recebidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilizador' },
  observacao: String,
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
  numeroPedido: {
    type: String,
    required: true,
    unique: true,
  },

  // Cliente e contacto
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  nomeCliente: String,      // snapshot no momento da criação (protege contra edição/remoção posterior do cliente)
  contactoCliente: String,

  // O que o cliente pediu — pode existir no catálogo (produto) ou ser algo avulso
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
  },

  tipoProduto: {
    type: String,
    required: [true, 'Informe o tipo de produto/serviço pedido'],
    trim: true,
  }, // Ex: "Cartões de visita", "Banner", "T-shirt estampada", "Convites de casamento"

  metodoPagamento: {
    type: String,
    enum: ['Dinheiro', 'Transferência Bancária', 'Multicaixa Express', 'Cartão de Crédito/Débito', 'Ordem de Saque', 'Outro'],
    default: 'Dinheiro'
  },

  // Modalidade de pagamento:
  // a_vista      -> pago no acto (comportamento original, valor conta no dashboard)
  // ordem_saque  -> pagamento diferido; só conta no dashboard depois de ordemSaque.estado === 'recebido'
  tipoPagamento: {
    type: String,
    enum: ['a_vista', 'ordem_saque'],
    default: 'a_vista',
  },
  ordemSaque: { type: ordemSaqueSchema, default: undefined },

  especificacoes: {
    type: String,
    required: [true, 'As especificações do pedido são obrigatórias'],
    trim: true,
  }, // tamanho, cor, material, texto a imprimir, referências, prazo pedido pelo cliente, etc.

  quantidade: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  precoUnitario: { type: Number, min: 0 },
  valorTotal: { type: Number, min: 0 },
  valorAdicionalServico: { type: Number, min: 0 }, // ex: entrega, montagem, etc. 

  dataEntregaPrevista: Date,
  dataEntregaReal: Date,

  // Fluxo de trabalho pedido pelo gerente:
  // pendente        -> pedido acabado de chegar, ainda não foi para produção/design
  // em_execucao     -> design/área técnica já está a trabalhar nele
  // pronto          -> produção terminada, à espera que o cliente venha buscar
  // entregue        -> atendente confirmou entrega ao cliente
  // cancelado       -> pedido cancelado (cliente desistiu, erro, etc.)
  status: {
    type: String,
    enum: ['pendente', 'em_execucao', 'pronto', 'pronto_entrega', 'entregue', 'cancelado'],
    default: 'pendente',
  },

  imagens: { type: [String], default: [] },

  historicoStatus: [historicoStatusSchema],

  // Quem faz o quê
  atendente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilizador',
    required: true,
  }, // quem recebeu o pedido do cliente
  responsavelProducao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilizador',
  }, // quem está a fazer o design/produção
  entreguePor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilizador',
  }, // quem confirmou a entrega ao cliente

  // Ligação opcional à factura emitida para este pedido
  factura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factura',
  },

  observacoes: String,
}, {
  timestamps: true,
});

pedidoSchema.index({ status: 1, createdAt: -1 });
pedidoSchema.index({ cliente: 1 });
pedidoSchema.index({ tipoPagamento: 1, 'ordemSaque.estado': 1 });

// Mantém o histórico de status atualizado e recalcula o valor total.
// IMPORTANTE: como pode haver mais de um atendente, o histórico deve registar sempre quem
// efetivamente executou a ação (o utilizador autenticado), não assumir automaticamente o
// `atendente` atribuído ao pedido — os dois podem ser pessoas diferentes (ex: um administrador
// ou outro atendente a criar/gerir o pedido em nome de outro).
//
// Por isso, o controller DEVE definir, ANTES de dar save():
//   - na criação:        pedido._criadoPor       = req.user?._id
//   - na mudança de status: pedido._statusChangedBy = req.user?._id
// Se `_criadoPor` (ou `_statusChangedBy`) não for definido, cai-se de volta para `this.atendente`
// como comportamento de segurança, mas o ideal é vir sempre preenchido pelo controller.
pedidoSchema.pre('save', async function (next) {
  if (this.isNew) {

    console.log('Criando novo pedido:', this._id, 'por', this._criadoPor || this.atendente);
    this.historicoStatus.push({
      status: this.status,
      usuario: this._criadoPor || this.atendente,
    });

    const Cliente = mongoose.model('Cliente');
    const cliente = await Cliente.findById(this.cliente);
    if (cliente) {
      this.nomeCliente = cliente.nome;
      this.contactoCliente = this.contactoCliente || cliente.telefone;
    }
  } else if (this.isModified('status')) {
    const quem = this._statusChangedBy || this.atendente;

    this.historicoStatus.push({
      status: this.status,
      usuario: this._statusChangedBy || this.atendente,
      observacao: this._statusObservacao,
    });

    if (this.status === 'em_execucao' || this.status === 'pronto') {
      if (!this.responsavelDesign) this.responsavelDesign = quem;
    }
    
    if (this.status === 'entregue') {
      if (!this.responsavelProducao) this.responsavelProducao = quem;
      if (!this.dataEntregaReal) this.dataEntregaReal = new Date();
      this.entreguePor = quem;
    }
  }

  if (this.precoUnitario != null && (this.isModified('quantidade') || this.isModified('precoUnitario'))) {
    this.valorTotal = this.quantidade * this.precoUnitario;
  }

  next();
});

module.exports = mongoose.model('Pedido', pedidoSchema);