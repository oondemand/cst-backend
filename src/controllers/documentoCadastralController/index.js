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
      message: "Documento cadastral criado com sucesso!",
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
      return res
        .status(400)
        .json({ message: "Arquivo é um campo obrigatório" });
    }

    const prestador = await Prestador.findOne({
      usuario: usuario._id,
    });

    if (!prestador) {
      return res.status(400).json({ message: "Prestador não encontrado" });
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

    return res.status(201).json({
      message: "Documento Cadastral criado com sucesso!",
      documentoCadastral: novoDocumentoCadastral,
    });
  } catch (e) {
    return res
      .status(400)
      .json({ message: "Erro ao criar documento cadastral" });
  }
};

exports.updateDocumentoCadastral = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const documentoCadastral = await DocumentoCadastral.findById(id);

    if (!documentoCadastral) {
      return res.status(404).json({
        message: "Documento Cadastral não encontrado",
      });
    }

    const documentoCadastralAtualizado =
      await DocumentoCadastral.findByIdAndUpdate(id, updateData, {
        new: true,
      });

    res.status(200).json({
      message: "Documento Cadastral atualizado com sucesso!",
      documentoCadastral: documentoCadastralAtualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar documento cadastral",
      detalhes: error.message,
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

    res.status(200).json({
      documentosCadastrais,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDedocumentosCadastrais / limite),
        totalItems: totalDedocumentosCadastrais,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar documentos fiscais" });
  }
};

exports.listarDocumentoCadastralPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;

    const documentosCadastrais = await DocumentoCadastral.find({
      prestador: prestadorId,
      statusValidacao: "aprovado",
    }).populate("arquivo");

    res.status(200).json(documentosCadastrais);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Falha ao buscar serviços", details: error.message });
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

    res.status(200).json(documentosCadastrais);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Falha ao buscar serviços", details: error.message });
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

    if (!documentoCadastral)
      return res
        .status(404)
        .json({ error: "Documento Cadastral não encontrado" });

    res.status(200).json({ data: documentoCadastral });
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir documento cadastral" });
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

    return res.status(200).json(novoArquivo);
  } catch (error) {
    res.status(400).json({ message: "Ouve um erro ao anexar o arquivo" });
  }
};

exports.excluirArquivo = async (req, res) => {
  try {
    const { id, documentoCadastralId } = req.params;

    const arquivo = await Arquivo.findByIdAndDelete(id);

    await DocumentoCadastral.findByIdAndUpdate(documentoCadastralId, {
      $unset: { arquivo: id },
    });

    res.status(200).json(arquivo);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar arquivo do ticket",
      error: error.message,
    });
  }
};

exports.aprovarDocumento = async (req, res) => {
  try {
    const { documentoCadastralId, servicos, prestadorId } = req.body;
    const documentoCadastral =
      await DocumentoCadastral.findById(documentoCadastralId);

    if (!documentoCadastral) {
      return res
        .status(404)
        .json({ error: "Documento Cadastral não encontrado" });
    }

    const prestador = await Prestador.findById(prestadorId);

    if (!prestador) {
      return res.status(404).json({ error: "Prestador não encontrado" });
    }

    const servicosEncontrados = await Servico.find({ _id: { $in: servicos } });

    const etapa = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });

    const ticket = new Ticket({
      servicos: servicosEncontrados.map((e) => e._id),
      titulo: `Comissão ${prestador?.nome} - ${prestador?.documento}`,
      status: "aguardando-inicio",
      documentosCadastrais: documentoCadastral?._id,
      prestador: prestador?._id,
      etapa: etapa?.[0]?.codigo,
    });

    await ticket.save();

    documentoCadastral.status = "processando";
    documentoCadastral.statusValidacao = "aprovado";
    await documentoCadastral.save();

    await Servico.updateMany(
      { _id: { $in: servicos } },
      { $set: { status: "processando" } }
    );

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(400).json({ error: "Erro ao aprovar documento" });
  }
};
