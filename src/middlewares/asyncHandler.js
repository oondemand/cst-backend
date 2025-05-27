const { sendErrorResponse } = require("../utils/helpers");
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    sendErrorResponse({
      res,
      error: error.message,
      message: error.message || "Erro inesperado",
      statusCode: error.statusCode || 500,
    });
  });
