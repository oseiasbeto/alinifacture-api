// Gera uma palavra-passe temporária: mistura obrigatoriamente maiúscula, minúscula, número e símbolo,
// evitando caracteres ambíguos (0/O, 1/l/I), para facilitar a leitura/transcrição quando entregue ao utilizador.
const gerarPalavraPasse = (tamanho = 10) => {
  const maiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghijkmnpqrstuvwxyz';
  const numeros = '23456789';
  const simbolos = '!@#$%&*';
  const todos = maiusculas + minusculas + numeros + simbolos;

  const escolher = (conjunto) => conjunto[Math.floor(Math.random() * conjunto.length)];

  let senha = [escolher(maiusculas), escolher(minusculas), escolher(numeros), escolher(simbolos)];
  while (senha.length < tamanho) senha.push(escolher(todos));

  // Embaralha para os caracteres obrigatórios não ficarem sempre nas mesmas posições.
  for (let i = senha.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [senha[i], senha[j]] = [senha[j], senha[i]];
  }

  return senha.join('');
};

module.exports = gerarPalavraPasse;