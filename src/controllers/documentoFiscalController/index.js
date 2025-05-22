const Prestador = require("../../models/Prestador");
const Ticket = require("../../models/Ticket");
const Arquivo = require("../../models/Arquivo");
const Servico = require("../../models/Servico");
const Etapa = require("../../models/Etapa");

const DocumentoFiscal = require("../../models/DocumentoFiscal");

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

exports.createDocumentoFiscal = async (req, res) => {
  try {
    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    const novoDocumentoFiscal = new DocumentoFiscal({
      ...filteredBody,
      status: "aberto",
    });

    await novoDocumentoFiscal.save();

    sendResponse({
      res,
      statusCode: 201,
      documentoFiscal: novoDocumentoFiscal,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao criar o documento fiscal",
      error: error.message,
    });
  }
};

exports.criarDocumentoFiscalPorUsuarioPrestador = async (req, res) => {
  try {
    const usuario = req.usuario;
    const arquivo = req.file;

    if (!arquivo) {
      sendErrorResponse({
        res,
        statusCode: 400,
        message: "Arquivo é um campo obrigatório",
      });
    }

    const prestador = await Prestador.findOne({
      usuario: usuario._id,
    });

    if (!prestador) {
      sendErrorResponse({
        res,
        statusCode: 400,
        message: "Prestador não encontrado",
      });
    }

    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    if (filteredBody?.mes && filteredBody?.ano) {
      filteredBody.competencia = {
        mes: Number(filteredBody.mes),
        ano: Number(filteredBody.ano),
      };
    }

    const novoArquivo = new Arquivo({
      nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
      nomeOriginal: arquivo.originalname,
      mimetype: arquivo.mimetype,
      size: arquivo.size,
      buffer: arquivo.buffer,
      tipo: "documento-fiscal",
    });

    await novoArquivo.save();

    const novoDocumentoFiscal = new DocumentoFiscal({
      ...filteredBody,
      prestador: prestador._id,
      status: "aberto",
      arquivo: novoArquivo._id,
    });

    await novoDocumentoFiscal.save();

    sendResponse({
      res,
      statusCode: 201,
      documentoFiscal: novoDocumentoFiscal,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao criar o documento fiscal",
      error: error.message,
    });
  }
};

exports.updateDocumentoFiscal = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const documentoFiscal = await DocumentoFiscal.findById(id);

    if (!documentoFiscal) {
      sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento fiscal não encontrado",
      });
    }

    if (["pago", "processando"].includes(documentoFiscal.status)) {
      sendErrorResponse({
        res,
        statusCode: 400,
        message:
          "Não é possível atualizar um documento fiscal com status pago ou processando.",
      });
    }

    const documentoFiscalAtualizado = await DocumentoFiscal.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      }
    );

    sendResponse({
      res,
      statusCode: 200,
      documentoFiscal: documentoFiscalAtualizado,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      statusCode: 500,
      message: "Ouve um erro inesperado ao atualizar o documento fiscal",
    });
  }
};

exports.listarDocumentoFiscal = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const prestadoresQuery = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Prestador.schema,
      camposBusca: ["sid", "documento", "nome"],
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
      schema: DocumentoFiscal.schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema: DocumentoFiscal.schema,
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

    const [documentosFiscais, totalDedocumentosFiscais] = await Promise.all([
      DocumentoFiscal.find(queryResult)
        .populate("prestador", "sid nome documento tipo")
        .populate("arquivo", "nomeOriginal mimetype size")
        .skip(skip)
        .limit(limite)
        .sort(sorting),
      DocumentoFiscal.countDocuments(queryResult),
    ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: documentosFiscais,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDedocumentosFiscais / limite),
        totalItems: totalDedocumentosFiscais,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro inesperado ao listar os documentos fiscais",
      error: error.message,
    });
  }
};

exports.listarDocumentoFiscalPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;

    const documentosFiscais = await DocumentoFiscal.find({
      prestador: prestadorId,
      statusValidacao: "aprovado",
      status: { $nin: ["processando", "pago"] },
    }).populate("prestador", "sid nome documento");

    sendResponse({
      res,
      statusCode: 200,
      documentosFiscais,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro inesperado ao listar os documentos fiscais",
      error: error.message,
    });
  }
};

exports.listarDocumentoFiscalPorUsuarioPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      usuario: req.usuario,
    });

    const documentosFiscais = await DocumentoFiscal.find({
      prestador: prestador,
    }).populate("prestador", "sid nome documento");

    sendResponse({
      res,
      statusCode: 200,
      documentosFiscais,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro inesperado ao listar os documentos fiscais",
      error: error.message,
    });
  }
};

exports.excluirDocumentoFiscal = async (req, res) => {
  try {
    const documentoFiscalId = req.params.id;

    await Ticket.updateMany(
      { documentosFiscais: documentoFiscalId },
      { $pull: { documentosFiscais: documentoFiscalId } }
    );

    const documentoFiscal =
      await DocumentoFiscal.findByIdAndDelete(documentoFiscalId);

    if (!documentoFiscal)
      sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento fiscal não encontrado",
      });

    sendResponse({
      res,
      statusCode: 200,
      data: documentoFiscal,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro inesperado ao excluir o documento fiscal",
      error: error.message,
    });
  }
};

exports.anexarArquivo = async (req, res) => {
  try {
    const arquivo = req.file;
    const documentoFiscalId = req.params.documentoFiscalId;

    const documentoFiscal = await DocumentoFiscal.findById(documentoFiscalId);

    const novoArquivo = new Arquivo({
      nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
      nomeOriginal: arquivo.originalname,
      mimetype: arquivo.mimetype,
      size: arquivo.size,
      buffer: arquivo.buffer,
      tipo: "documento-fiscal",
    });

    await novoArquivo?.save();

    documentoFiscal.arquivo = novoArquivo._id;
    await documentoFiscal.save();

    sendResponse({
      res,
      statusCode: 200,
      arquivo: novoArquivo,
    });
  } catch (error) {
    console.log(error);
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro ao anexar o arquivo",
      error: error?.message,
    });
  }
};

exports.excluirArquivo = async (req, res) => {
  try {
    const { id, documentoFiscalId } = req.params;

    const arquivo = await Arquivo.findByIdAndDelete(id);

    const documentoFiscal = await DocumentoFiscal.findByIdAndUpdate(
      documentoFiscalId,
      { $unset: { arquivo: id } }
    );

    sendResponse({
      res,
      statusCode: 200,
      arquivo,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Erro ao deletar arquivo do ticket",
      error,
    });
  }
};

exports.aprovarDocumento = async (req, res) => {
  try {
    const { documentoFiscalId, servicos, prestadorId } = req.body;
    const documentoFiscal = await DocumentoFiscal.findById(documentoFiscalId);

    if (!documentoFiscal) {
      sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento fiscal não encontrado",
      });
    }

    const prestador = await Prestador.findById(prestadorId);

    if (!prestador) {
      sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });
    }

    const servicosEncontrados = await Servico.find({ _id: { $in: servicos } });

    const etapa = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });

    const ticket = new Ticket({
      servicos: servicosEncontrados.map((e) => e._id),
      titulo: `Comissão ${prestador?.nome} - ${prestador?.documento}`,
      status: "aguardando-inicio",
      documentosFiscais: documentoFiscal?._id,
      prestador: prestador?._id,
      etapa: etapa?.[0]?.codigo,
    });

    await ticket.save();

    documentoFiscal.status = "processando";
    documentoFiscal.statusValidacao = "aprovado";
    await documentoFiscal.save();

    await Servico.updateMany(
      { _id: { $in: servicos } },
      { $set: { status: "processando" } }
    );

    sendResponse({
      res,
      statusCode: 200,
      ticket,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro ao aprovar o documento fiscal",
      error: error.message,
    });
  }
};

exports.reprovarDocumento = async (req, res) => {
  try {
    console.log(req.params.id);

    const { motivoRecusa, observacaoInterna, observacaoPrestador } = req.body;
    const documentoFiscal = await DocumentoFiscal.findById(req.params.id);

    if (!documentoFiscal) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Documento fiscal não encontrado",
      });
    }

    documentoFiscal.statusValidacao = "recusado";
    documentoFiscal.motivoRecusa = motivoRecusa;
    documentoFiscal.observacaoInterna = observacaoInterna;
    documentoFiscal.observacaoPrestador = observacaoPrestador;
    await documentoFiscal.save();

    sendResponse({
      res,
      statusCode: 200,
      documentoFiscal,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ouve um erro ao reprovar o documento fiscal",
      error: error.message,
    });
  }
};
