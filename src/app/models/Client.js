import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do cliente é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  telefone: String,
  nif: {                      // NIF do cliente (obrigatório em muitos casos pela AGT)
    type: String,
    trim: true,
  },
  endereco: String,
  cidade: {
    type: String,
    default: 'Luanda',
  },
  provincia: {
    type: String,
    enum: [
      'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Cuando Cubango',
      'Cuanza Norte', 'Cuanza Sul', 'Lunda Norte', 'Lunda Sul', 'Malanje',
      'Moxico', 'Uíge', 'Zaire', 'Bengo', 'Bié', 'Namibe'
    ],
    default: 'Luanda',
  },
  tipo: {
    type: String,
    enum: ['singular', 'coletivo'],
    default: 'coletivo',
  },
  observacoes: String,
  ativo: {
    type: Boolean,
    default: true,
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

// Índice composto: NIF único por empresa
clienteSchema.index({ empresa: 1, nif: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Cliente', clienteSchema);