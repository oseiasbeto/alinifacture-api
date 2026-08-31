const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');  // ← importa aqui

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
  nif: String,
  endereco: String,
  cidade: {
    type: String,
    default: 'Luanda',
  },
  provincia: {
    type: String,
    enum: [
      'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Cuando Cubango',
      'Cuanza Norte', 'Cuanza Sul', 'Lunda Norte', 'Lunda-sul', 'Malanje',
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
  }
}, {
  timestamps: true,
});

clienteSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Cliente', clienteSchema);