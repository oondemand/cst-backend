const Assistente = require("../models/Assistente");
const filtersUtils = require("../utils/filter");
const {
  sendErrorResponse,
  sendResponse,
  sendPaginatedResponse,
} = require("../utils/helpers");

exports.criarAssistente = async (req, res) => {
  try {
    const assistente = new Assistente(req.body);
    await assistente.save();
    sendResponse({
      res,
      statusCode: 201,
      assistente,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      message: "Ouve um erro inesperado ao criar assistente",
      statusCode: 400,
    });
  }
};

exports.listarAssistentes = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
      req.query;

    const schema = Assistente.schema;

    const camposBusca = ["modulo", "assistente"];

    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema,
    });

    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema,
      camposBusca,
    });

    const queryResult = {
      $and: [
        filterFromFiltros, // Filtros principais
        searchTermCondition, // Filtros de busca
      ],
    };

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    const [assistentes, totalDeAssistentes] = await Promise.all([
      Assistente.find(queryResult).skip(skip).limit(limite),
      Assistente.countDocuments(queryResult),
    ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: assistentes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeAssistentes / limite),
        totalItems: totalDeAssistentes,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      message: "Ouve um erro inesperado ao listar assistentes",
      statusCode: 400,
    });
  }
};

exports.listarAssistentesAtivos = async (req, res) => {
  try {
    const assistentes = await Assistente.find({ status: "ativo" });
    sendResponse({
      res,
      statusCode: 200,
      assistentes,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      message: "Ouve um erro inesperado ao listar assistentes ativos",
      statusCode: 400,
    });
  }
};

exports.obterAssistente = async (req, res) => {
  try {
    const assistente = await Assistente.findById(req.params.id);
    if (!assistente) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Assistente não encontrada",
      });
    }
    sendResponse({
      res,
      statusCode: 200,
      assistente,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao obter assistente",
      error: error.message,
    });
  }
};

exports.atualizarAssistente = async (req, res) => {
  try {
    const assistente = await Assistente.findByIdAndUpdate(
      req.params.id,
      req.body
    );
    if (!assistente) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Assistente não encontrado",
      });
    }
    sendResponse({
      res,
      statusCode: 200,
      assistente,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao atualizar assistente",
      error: error.message,
    });
  }
};

exports.excluirAssistente = async (req, res) => {
  try {
    const assistente = await Assistente.findByIdAndDelete(req.params.id);
    if (!assistente) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Assistente não encontrada",
      });
    }
    sendResponse({
      res,
      statusCode: 200,
      assistente,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao excluir assistente",
      error: error.message,
    });
  }
};
