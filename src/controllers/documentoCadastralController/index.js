const Prestador = require("../../models/Prestador");
const Ticket = require("../../models/Ticket");
const Arquivo = require("../../models/Arquivo");
const Servico = require("../../models/Servico");
const Etapa = require("../../models/Etapa");

const DocumentoCadastral = require("../../models/DocumentoCadastral");

const filtersUtils = require("../../utils/filter");
const { criarNomePersonalizado } = require("../../utils/formatters");

const { registrarAcao } = require("../../services/controleService");
const {
  ACOES,
  ENTIDADES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

const {
  sendPaginatedResponse,
  sendResponse,
  sendErrorResponse,
} = require("../../utils/helpers");

exports.createDocumentoCadastral = async (req, res) => {
  try {
    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    const novoDocumentoCadastral = new DocumentoCadastral({
      ...filteredBody,
    });

    await novoDocumentoCadastral.save();

    sendResponse({
      res,
      statusCode: 201,
      documentoCadastral: novoDocumentoCadastral,
    });
  } catch (error) {
    console.error("Erro ao criar documento cadastral:", error);
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Erro ao criar documento cadastral",
      error: error?.message,
    });
  }
};

exports.criarDocumentoCadastralPorUsuarioPrestador = async (req, res) => {
  try {
    const usuario = req.usuario;
    const arquivo = req.file;

    if (!arquivo) {
      return sendErrorResponse({
        res,
        statusCode: 400,
        message: "Arquivo é um campo obrigatório",
      });
    }

    const prestador = await Prestador.findOne({
      usuario: usuario._id,
    });

    if (!prestador) {
      return sendErrorResponse({
        res,
        statusCode: 400,
        message: "Prestador não encontrado",
      });
    }

    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    const novoArquivo = new Arquivo({
      nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
      nomeOriginal: arquivo.originalname,
      mimetype: arquivo.mimetype,
      size: arquivo.size,
      buffer: arquivo.buffer,
      tipo: "documento-cadastral",
    });

    await novoArquivo.save();

    const novoDocumentoCadastral = new DocumentoCadastral({
      ...filteredBody,
      prestador: prestador._id,
      arquivo: novoArquivo._id,
    });

    await novoDocumentoCadastral.save();

    return sendResponse({
      res,
      statusCode: 201,
      documentoCadastral: novoDocumentoCadastral,
    });
  } catch (e) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao criar documento cadastral",
      error: error.message,
    });
  }
};

exports.updateDocumentoCadastral = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const documentoCadastral = await DocumentoCadastral.findById(id);

    if (!documentoCadastral) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento Cadastral não encontrado",
      });
    }

    const documentoCadastralAtualizado =
      await DocumentoCadastral.findByIdAndUpdate(id, updateData, {
        new: true,
      });

    return sendResponse({
      res,
      statusCode: 200,
      documentoCadastral: documentoCadastralAtualizado,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Erro ao atualizar documento cadastral",
      error: error.message,
    });
  }
};

exports.listarDocumentoCadastral = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const prestadoresQuery = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Prestador.schema,
      camposBusca: ["sid", "documento", "nome"],
    });

    const prestadoresIds = await Prestador.find(prestadoresQuery).select("_id");

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema: DocumentoCadastral.schema,
    });

    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema: DocumentoCadastral.schema,
      camposBusca: [],
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

    const [documentosCadastrais, totalDedocumentosCadastrais] =
      await Promise.all([
        DocumentoCadastral.find(queryResult)
          .populate("prestador", "sid nome documento tipo")
          .populate("arquivo", "nomeOriginal mimetype size")
          .skip(skip)
          .limit(limite)
          .sort(sorting),
        DocumentoCadastral.countDocuments(queryResult),
      ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: documentosCadastrais,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDedocumentosCadastrais / limite),
        totalItems: totalDedocumentosCadastrais,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao listar documentos cadastrais",
      error: error.message,
    });
  }
};

exports.listarDocumentoCadastralPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;

    const documentosCadastrais = await DocumentoCadastral.find({
      prestador: prestadorId,
      statusValidacao: "aprovado",
    }).populate("arquivo");

    return sendResponse({
      res,
      statusCode: 200,
      documentosCadastrais,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao buscar documentos cadastrais",
      error: error.message,
    });
  }
};

exports.listarDocumentoCadastralPorUsuarioPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      usuario: req.usuario,
    });

    const documentosCadastrais = await DocumentoCadastral.find({
      prestador: prestador,
    }).populate("prestador", "sid nome documento");

    return sendResponse({
      res,
      statusCode: 200,
      documentosCadastrais,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao buscar documentos cadastrais",
      error: error.message,
    });
  }
};

exports.excluirDocumentoCadastral = async (req, res) => {
  try {
    const documentoCadastralId = req.params.id;

    await Ticket.updateMany(
      { documentosCadastrais: documentoCadastralId },
      { $pull: { documentosCadastrais: documentoCadastralId } }
    );

    const documentoCadastral =
      await DocumentoCadastral.findByIdAndDelete(documentoCadastralId);

    if (!documentoCadastral) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento Cadastral não encontrado",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      data: documentoCadastral,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao excluir documento cadastral",
      error: error.message,
    });
  }
};

exports.anexarArquivo = async (req, res) => {
  try {
    const arquivo = req.file;
    const documentoCadastralId = req.params.documentoCadastralId;

    const documentoCadastral =
      await DocumentoCadastral.findById(documentoCadastralId);

    const novoArquivo = new Arquivo({
      nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
      nomeOriginal: arquivo.originalname,
      mimetype: arquivo.mimetype,
      size: arquivo.size,
      buffer: arquivo.buffer,
      tipo: "documento-cadastral",
    });

    await novoArquivo?.save();

    documentoCadastral.arquivo = novoArquivo._id;
    await documentoCadastral.save();

    return sendResponse({
      res,
      statusCode: 200,
      arquivo: novoArquivo,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro ao anexar o arquivo",
      error: error.message,
    });
  }
};

exports.excluirArquivo = async (req, res) => {
  try {
    const { id, documentoCadastralId } = req.params;

    const arquivo = await Arquivo.findByIdAndDelete(id);

    await DocumentoCadastral.findByIdAndUpdate(documentoCadastralId, {
      $unset: { arquivo: id },
    });

    return sendResponse({
      res,
      statusCode: 200,
      arquivo,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Erro ao deletar arquivo do ticket",
      error: error.message,
    });
  }
};

exports.aprovarDocumento = async (req, res) => {
  try {
    const documentoCadastral = await DocumentoCadastral.findById(req.params.id);

    if (!documentoCadastral) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento Cadastral não encontrado",
      });
    }

    documentoCadastral.statusValidacao = "aprovado";
    await documentoCadastral.save();

    return sendResponse({
      res,
      statusCode: 200,
      data: documentoCadastral,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao aprovar documento",
      error: error.message,
    });
  }
};

exports.reprovarDocumento = async (req, res) => {
  try {
    const { motivoRecusa, observacaoInterna, observacaoPrestador } = req.body;
    const documentoCadastral = await DocumentoCadastral.findById(req.params.id);

    if (!documentoCadastral) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento Cadastral não encontrado",
      });
    }

    documentoCadastral.statusValidacao = "recusado";
    documentoCadastral.motivoRecusa = motivoRecusa;
    documentoCadastral.observacaoInterna = observacaoInterna;
    documentoCadastral.observacaoPrestador = observacaoPrestador;
    await documentoCadastral.save();

    return sendResponse({
      res,
      statusCode: 200,
      data: documentoCadastral,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao reprovar documento",
      error: error.message,
    });
  }
};
