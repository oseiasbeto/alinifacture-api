const Pedido = require('../models/Pedido'); // ajuste o caminho conforme a estrutura real do projeto

const gerarNumeroPedido = async () => {
  const anoAtual = new Date().getFullYear();
  const inicioAno = new Date(anoAtual, 0, 1);
  const fimAno = new Date(anoAtual + 1, 0, 1);

  const totalNoAno = await Pedido.countDocuments({
    createdAt: { $gte: inicioAno, $lt: fimAno },
  });

  const sequencial = String(totalNoAno + 1).padStart(4, '0');
  return `PED-${anoAtual}-${sequencial}`;
};

module.exports = gerarNumeroPedido;