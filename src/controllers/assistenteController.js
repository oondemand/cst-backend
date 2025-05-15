const Assistente = require("../models/Assistente");
const filtersUtils = require("../utils/filter");

exports.criarAssistente = async (req, res) => {
  try {
    const assistente = new Assistente(req.body);
    await assistente.save();
    res.status(201).json(assistente);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar assistente" });
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

    res.status(200).json({
      assistentes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeAssistentes / limite),
        totalItems: totalDeAssistentes,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar assistentes" });
  }
};

exports.listarAssistentesAtivos = async (req, res) => {
  try {
    const assistentes = await Assistente.find({ status: "ativo" });
    res.status(200).json(assistentes);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar assistentes" });
  }
};

exports.obterAssistente = async (req, res) => {
  try {
    const assistente = await Assistente.findById(req.params.id);
    if (!assistente) {
      return res.status(404).json({ error: "Assistente não encontrada" });
    }
    res.status(200).json(assistente);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter assistente" });
  }
};

exports.atualizarAssistente = async (req, res) => {
  try {
    const assistente = await Assistente.findByIdAndUpdate(
      req.params.id,
      req.body
    );
    if (!assistente) {
      return res.status(404).json({ error: "Assistente não encontrado" });
    }
    res.status(200).json(assistente);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar assistente" });
  }
};

exports.excluirAssistente = async (req, res) => {
  try {
    const assistente = await Assistente.findByIdAndDelete(req.params.id);
    if (!assistente) {
      return res.status(404).json({ error: "Assistente não encontrada" });
    }
    res.status(200).json({ message: "Assistente excluída com sucesso" });
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir assistente" });
  }
};
