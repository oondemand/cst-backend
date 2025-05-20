const { registrarAcao } = require("../services/controleService");

/**
 * Middleware para registrar ações (ex: após rota de update)
 */

function registrarAcaoMiddleware({ entidade, acao, origem }) {
  return async (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode < 400) {
        registrarAcao({
          entidade,
          acao,
          origem,
          usuario: req?.usuario?.id,
          idRegistroAlterado: req?.params?.id,
          dadosAtualizados: req?.body,
        });
      }
    });
    next();
  };
}

module.exports = { registrarAcaoMiddleware };
