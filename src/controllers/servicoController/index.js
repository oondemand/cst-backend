const Servico = require("../../models/Servico");
const Prestador = require("../../models/Prestador");
const Ticket = require("../../models/Ticket");
const filtersUtils = require("../../utils/filter");
const {
  sendErrorResponse,
  sendResponse,
  sendPaginatedResponse,
} = require("../../utils/helpers");

exports.getServicoById = async (req, res) => {
  const { id } = req.params;

  try {
    const servico = await Servico.findById(id);

    if (!servico) {
      return sendErrorResponse({
        res,
        message: "Serviço não encontrado",
        statusCode: 404,
      });
    }

    sendResponse({ res, statusCode: 200, servico });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao obter o serviço",
      detalhes: error.message,
    });
  }
};

exports.createServico = async (req, res) => {
  try {
    const servicoExistente = await Servico.findOne({
      prestador: req.body.prestador,
      "competencia.mes": req.body.competencia?.mes,
      "competencia.ano": req.body.competencia?.ano,
    });

    if (servicoExistente) {
      return sendErrorResponse({
        res,
        message:
          "Já existe um serviço com essa competência para este prestador",
        statusCode: 400,
      });
    }

    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    const novoServico = new Servico({ ...filteredBody, status: "aberto" });
    await novoServico.save();

    sendResponse({
      res,
      statusCode: 201,
      servico: novoServico,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao criar o serviço",
      statusCode: 500,
    });
  }
};

exports.updateServico = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const servico = await Servico.findById(id);

    if (!servico) {
      return sendErrorResponse({
        res,
        message: "Serviço não encontrado",
        statusCode: 404,
      });
    }

    if (["pago", "pago-externo", "processando"].includes(servico.status)) {
      return sendErrorResponse({
        res,
        message:
          "Não é possível atualizar um serviço pago ou em processamento.",
        statusCode: 400,
      });
    }

    const servicoAtualizado = await Servico.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    sendResponse({
      res,
      statusCode: 200,
      servico: servicoAtualizado,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao atualizar o serviço",
      statusCode: 500,
    });
  }
};

exports.listarServicos = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const prestadoresQuery = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Prestador.schema,
      camposBusca: ["documento", "nome"],
    });

    // Busca ids de prestadores com base nas condições criadas de acordo ao search term
    const prestadoresIds = await Prestador.find(prestadoresQuery).select("_id");

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema: Servico.schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Servico.schema,
      camposBusca: ["tipo", "dataRegistro", "competencia", "valor"],
    });

    const queryResult = {
      $and: [
        filterFromFiltros,
        { $or: [searchTermCondition, ...prestadorConditions] },
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

    const [servicos, totalDeServicos] = await Promise.all([
      Servico.find(queryResult)
        .populate("prestador", "nome documento tipo")
        .skip(skip)
        .limit(limite)
        .sort(sorting),
      Servico.countDocuments(queryResult),
    ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: servicos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeServicos / limite),
        totalItems: totalDeServicos,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao listar os serviços",
      statusCode: 500,
    });
  }
};

exports.listarServicoPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;
    const { dataRegistro } = req.query;

    const servicos = await Servico.find({
      prestador: prestadorId,
      status: "aberto",
      ...(dataRegistro ? { dataRegistro: dataRegistro } : {}),
    }).populate("prestador", "nome documento");

    sendResponse({
      res,
      statusCode: 200,
      servicos,
    });
  } catch (error) {
    console.error("Erro na listagem:", error);
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao listar os serviços",
      statusCode: 500,
    });
  }
};

exports.excluirServico = async (req, res) => {
  try {
    const servicoId = req.params.id;

    await Ticket.updateMany(
      { servicos: servicoId },
      { $pull: { servicos: servicoId } }
    );

    const servico = await Servico.findByIdAndDelete(servicoId);

    if (!servico)
      return sendErrorResponse({
        res,
        message: "Serviço não encontrado",
        statusCode: 404,
      });

    sendResponse({
      res,
      statusCode: 200,
      servico,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao excluir o serviço",
      statusCode: 500,
    });
  }
};

exports.atualizarStatus = async (req, res) => {
  const { ids, status } = req.body;

  try {
    const result = await Servico.updateMany(
      { _id: { $in: ids } },
      { $set: { status: status } }
    );

    sendResponse({
      res,
      statusCode: 200,
      servicos: result,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao atualizar o serviço",
      statusCode: 500,
    });
  }
};
