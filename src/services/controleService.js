const ControleAlteracao = require("../models/ControleAlteracao");

async function registrarAcao({
  entidade,
  acao,
  origem,
  usuario,
  idRegistroAlterado,
  dadosAtualizados,
}) {
  await ControleAlteracao.create({
    entidade,
    acao,
    origem,
    usuario,
    idRegistroAlterado,
    dadosAtualizados,
  });
}

module.exports = { registrarAcao };
