const Prestador = require("../../models/Prestador");
const { prestadorOmieSync } = require("../../services/prestadorService/prestadorOmieSync");
const filtersUtils = require("../../utils/filter");
const { parsePagination, parseSorting } = require("../../utils/pagination");
const { createPrestador, updatePrestador, deletePrestador } = require("../../services/prestadorService/prestadorCrudService");
const { validateCreatePrestador, validateUpdatePrestador } = require("../../services/prestadorService/prestadorBusinessService");
const { sendPaginatedResponse, sendResponse, sendErrorResponse } = require("../../utils/helpers");
const asyncHandler = require("../../middlewares/asyncHandler");

exports.obterPrestadorPorIdUsuario = asyncHandler(async (req, res) => {
  const prestador = await Prestador.findOne({ usuario: req.params.idUsuario });
  if (!prestador) {
    return sendErrorResponse({
      res,
      message: "Prestador não encontrado!",
      statusCode: 404,
    });
  }
  sendResponse({ res, statusCode: 200, prestador });
});

exports.criarPrestador = asyncHandler(async (req, res) => {
  const { email, ...rest } = req.body;
  const data = email === "" ? rest : req.body;

  // Validations moved to business service
  await validateCreatePrestador(data);

  const prestador = await createPrestador(data);

  sendResponse({
    res,
    statusCode: 200,
    prestador,
  });
});

exports.listarPrestadores = asyncHandler(async (req, res) => {
  const { sortBy, searchTerm, ...rest } = req.query;
  const schema = Prestador.schema;
  const camposBusca = Object.keys(schema.paths);

  const queryResult = filtersUtils.buildQuery({
    filtros: rest,
    searchTerm,
    schema,
    camposBusca,
  });

  const sorting = parseSorting(sortBy);
  const { page, limit } = parsePagination(req.query);

  const prestadores = await Prestador.find(queryResult)
    .sort(sorting)
    .skip(page * limit)
    .limit(limit);

  const totalDePrestadores = await Prestador.countDocuments(queryResult);
  const totalPages = Math.ceil(totalDePrestadores / limit);

  sendPaginatedResponse({
    res,
    statusCode: 200,
    message: "OK",
    results: prestadores,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalDePrestadores,
      itemsPerPage: limit,
    },
  });
});

exports.obterPrestador = asyncHandler(async (req, res) => {
  const prestador = await Prestador.findById(req.params.id);
  if (!prestador) {
    return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
  }
  sendResponse({ res, statusCode: 200, prestador });
});

exports.atualizarPrestador = asyncHandler(async (req, res) => {
  // Validate update data
  await validateUpdatePrestador(req.params.id, req.body);

  const prestadorAtualizado = await updatePrestador(req.params.id, req.body);

  // Sincronização permanece na controller ou pode ser extraída se necessário
  prestadorOmieSync(prestadorAtualizado);  // Atualização usando a nova função

  sendResponse({ res, statusCode: 200, prestador: prestadorAtualizado });
});

exports.excluirPrestador = asyncHandler(async (req, res) => {
  const prestador = await deletePrestador(req.params.id);
  if (!prestador)
    return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
  sendResponse({ res, statusCode: 200, prestador });
});

exports.obterPrestadorPorDocumento = asyncHandler(async (req, res) => {
  const prestador = await Prestador.findOne({ documento: req.params.documento });
  if (!prestador) {
    return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
  }
  sendResponse({ res, statusCode: 200, prestador });
});

exports.obterPrestadorPorEmail = asyncHandler(async (req, res) => {
  const prestador = await Prestador.findOne({ email: req.params.email });
  if (!prestador) {
    return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
  }
  sendResponse({ res, statusCode: 200, prestador });
});

exports.obterPrestadorPorPis = asyncHandler(async (req, res) => {
  const prestador = await Prestador.findOne({ "pessoaFisica.pis": req.params.pis });
  if (!prestador) {
    return sendErrorResponse({ res, statusCode: 404, message: "Prestador não encontrado" });
  }
  sendResponse({ res, statusCode: 200, prestador });
});
