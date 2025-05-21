const ControleAlteracao = require("../models/ControleAlteracao");

async function registrarAcao({
  entidade,
  acao,
  origem,
  usuario,
  idRegistroAlterado,
  dadosAtualizados,
}) {
  console.log("[RASTREABILIDADE] Registrando controle alteração...");
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
    console.log("[RASTREABILIDADE] Erro ao registrar controle alteração:", e);
  }
}

module.exports = { registrarAcao };
