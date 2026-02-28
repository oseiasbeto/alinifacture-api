import mongoose from 'mongoose';

const linhaFacturaSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
  },
  descricao: {
    type: String,
    required: [true, 'Descrição do item é obrigatória'],
    trim: true,
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0.001,
  },
  precoUnitario: {
    type: Number,
    required: true,
    min: 0,
  },
  percentagemDesconto: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxaIva: {
    type: Number,
    default: 14,
    min: 0,
  },
  motivoIsencao: {            // Ex: "Isento Art. 12º Código IVA"
    type: String,
  },
}, {
  _id: false,
  toJSON: { virtuals: true },
});

// Virtuals por linha
linhaFacturaSchema.virtual('subtotal').get(function() {
  return this.quantidade * this.precoUnitario;
});
linhaFacturaSchema.virtual('valorDesconto').get(function() {
  return this.subtotal * (this.percentagemDesconto / 100);
});
linhaFacturaSchema.virtual('montanteTributavel').get(function() {
  return this.subtotal - this.valorDesconto;
});
linhaFacturaSchema.virtual('valorIva').get(function() {
  return this.montanteTributavel * (this.taxaIva / 100);
});
linhaFacturaSchema.virtual('totalLinha').get(function() {
  return this.montanteTributavel + this.valorIva;
});

const facturaSchema = new mongoose.Schema({
  numeroFactura: {
    type: String,
    required: true,
    unique: true,
  },
  serie: {
    type: String,
    default: 'AF',
  },
  dataEmissao: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dataVencimento: {
    type: Date,
    required: true,
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  linhas: [linhaFacturaSchema],

  subtotal: Number,
  totalDesconto: Number,
  totalIva: Number,
  totalFactura: Number,

  moeda: {
    type: String,
    default: 'AOA',
    enum: ['AOA', 'USD', 'EUR'],
  },

  nifEmitente: { type: String, required: true },
  nomeEmitente: { type: String, required: true },
  nifCliente: String,
  nomeCliente: { type: String, required: true },

  observacoes: String,
  notasInternas: String,

  estado: {
    type: String,
    enum: ['rascunho', 'emitida', 'enviada', 'paga_parcial', 'paga', 'cancelada', 'anulada'],
    default: 'rascunho',
  },

  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilizador',
    required: true,
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Hook para calcular totais e copiar dados fiscais
facturaSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('linhas')) {
    let subtotal = 0;
    let totalDesconto = 0;
    let totalIva = 0;

    this.linhas.forEach(linha => {
      subtotal += linha.subtotal;
      totalDesconto += linha.valorDesconto;
      totalIva += linha.valorIva;
    });

    this.subtotal = subtotal;
    this.totalDesconto = totalDesconto;
    this.totalIva = totalIva;
    this.totalFactura = subtotal - totalDesconto + totalIva;
  }

  if (this.isNew) {
    const Empresa = mongoose.model('Empresa');
    const Cliente = mongoose.model('Cliente');

    const empresa = await Empresa.findById(this.empresa);
    const cliente = await Cliente.findById(this.cliente);

    if (empresa) {
      this.nifEmitente = empresa.nif;
      this.nomeEmitente = empresa.nome;
      this.serie = empresa.serieFacturaPrefixo || 'AF';
    }
    if (cliente) {
      this.nomeCliente = cliente.nome;
      this.nifCliente = cliente.nif;
    }
  }

  next();
});

module.exports = mongoose.model('Factura', facturaSchema);