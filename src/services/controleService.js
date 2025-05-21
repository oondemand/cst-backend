const ControleAlteracao = require("../models/ControleAlteracao");

async function registrarAcao({
  entidade,
  acao,
  origem,
  usuario,
  idRegistroAlterado,
  dadosAtualizados,
}) {
  try {
    const controleAlteracao = new ControleAlteracao({
      entidade,
      acao,
      origem,
      usuario,
      idRegistroAlterado,
      dadosAtualizados,
    });

    await controleAlteracao.save();
  } catch (e) {
    // silent log
  }
}

module.exports = { registrarAcao };
