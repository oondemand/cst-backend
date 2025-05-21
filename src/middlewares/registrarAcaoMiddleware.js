const { registrarAcao } = require("../services/controleService");

/**
 * Middleware para registrar ações (ex: após rota de update)
 */
function registrarAcaoMiddleware({ entidade, acao, origem }) {
  return async (req, res, next) => {
    const originalJson = res.json;
    let responseBody;

    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body); // Continua o fluxo normal
    };

    res.on("finish", () => {
      console.log("🟨 Response body ->", responseBody, originalJson);

      // if (res.statusCode < 400) {
      //   registrarAcao({
      //     entidade,
      //     acao,
      //     origem,
      //     usuario: req?.usuario?.id,
      //     idRegistroAlterado: req?.params?.id,
      //     dadosAtualizados: req?.body, // body da requisição
      //     resposta: responseBody, // body da resposta
      //   });
      // }
    });

    next();
  };
}

module.exports = { registrarAcaoMiddleware };
