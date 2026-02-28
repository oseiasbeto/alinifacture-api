const mongoose = require("mongoose");

const empresaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome da empresa é obrigatório'],
    trim: true,
  },
  nomeComercial: {
    type: String,
    trim: true,
  },
  nif: {                      // NIF da empresa (emitente)
    type: String,
    trim: true
  },
  endereco: String,
  cidade: {
    type: String,
    default: 'Luanda',
  },
  telefone: String,
  email: String,
  site: String,
  logo: String,               // URL ou caminho do logotipo
  taxaIvaPadrao: {
    type: Number,
    default: 14,              // IVA padrão em Angola (%)
  },
  moedaPadrao: {
    type: String,
    default: 'AOA',
    enum: ['AOA', 'USD', 'EUR'],
  },
  serieFacturaPrefixo: {
    type: String,
    default: 'AF',
  },
  proximoNumeroFactura: {
    type: Number,
    default: 1,
  },
  colaboradores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilizador',
  }],
  ativo: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Empresa', empresaSchema);