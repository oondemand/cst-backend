const prestadorCrud = require("../../services/prestador/crud");
const prestadorOmie = require("../../services/prestador/omie");
const { sendPaginatedResponse, sendResponse, sendErrorResponse } = require("../../utils/helpers");

exports.obterPrestadorPorIdUsuario = async (req, res) => {
  try {
    const prestador = await prestadorCrud.getByUserId(req.params.idUsuario);
    if (!prestador) {
      return sendErrorResponse({ res, message: "Prestador não encontrado!", statusCode: 404 });
    }
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, error: error.message, message: "Um erro inesperado aconteceu ao obter prestador!", statusCode: 400 });
  }
};

exports.criarPrestador = async (req, res) => {
  try {
    const prestador = await prestadorCrud.create(req.body);
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, error: error.message, message: "Ouve um erro inesperado ao criar prestador!", statusCode: 500 });
  }
};

exports.listarPrestadores = async (req, res) => {
  try {
    const result = await prestadorCrud.list(req.query);
    sendPaginatedResponse({ res, statusCode: 200, message: "OK", ...result });
  } catch (error) {
    sendErrorResponse({ res, error: error.message, message: "Ouve um erro inesperado ao listar prestadores.", statusCode: 400 });
  }
};

exports.obterPrestador = async (req, res) => {
  try {
    const prestador = await prestadorCrud.getById(req.params.id);
    if (!prestador) return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, error: error.message, message: "Ouve um erro inesperado ao obter prestador", statusCode: 400 });
  }
};

exports.atualizarPrestador = async (req, res) => {
  try {
    const prestadorAtualizado = await prestadorCrud.update(req.params.id, req.body);
    sendResponse({ res, statusCode: 200, prestador: prestadorAtualizado });
  } catch (error) {
    sendErrorResponse({ res, error: error.message, message: "Ouve um erro inesperado ao atualizar prestador!", statusCode: 500 });
  }
};

exports.excluirPrestador = async (req, res) => {
  try {
    const prestador = await prestadorCrud.delete(req.params.id);
    if (!prestador) return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, statusCode: 400, error: error.message, message: "Ouve um erro ao inesperado ao excluir prestador" });
  }
};

exports.obterPrestadorPorDocumento = async (req, res) => {
  try {
    const prestador = await prestadorCrud.getByDocumento(req.params.documento);
    if (!prestador) return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, statusCode: 500, error: error.message, message: "Ouve um erro inesperado ao obter prestador" });
  }
};

exports.obterPrestadorPorEmail = async (req, res) => {
  try {
    const prestador = await prestadorCrud.getByEmail(req.params.email);
    if (!prestador) return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, statusCode: 500, error: error.message, message: "Ouve um erro inesperado ao obter prestador por email" });
  }
};

exports.obterPrestadorPorPis = async (req, res) => {
  try {
    const prestador = await prestadorCrud.getByPis(req.params.pis);
    if (!prestador) return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({ res, statusCode: 500, error: error.message, message: "Ouve um erro inesperado ao obter prestador por pis" });
  }
};

exports.prestadorWebHook = async (req, res) => {
  try {
    await prestadorOmie.handleWebhook(req.body, res);
  } catch (error) {
    sendErrorResponse({ res, statusCode: 500, error: error.message, message: "Ouve um erro inesperado no webhook." });
  }
};
