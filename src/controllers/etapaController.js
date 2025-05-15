const Etapa = require("../models/Etapa");
const filtersUtils = require("../utils/filter");

exports.criarEtapa = async (req, res) => {
  try {
    const etapa = new Etapa(req.body);
    await etapa.save();
    res.status(201).json(etapa);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar etapa" });
  }
};

exports.listarEtapas = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
      req.query;

    const schema = Etapa.schema;

    const camposBusca = ["codigo", "nome", "posicao", "status"];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
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

    const [etapas, totalDeEtapas] = await Promise.all([
      Etapa.find(queryResult).skip(skip).limit(limite),
      Etapa.countDocuments(queryResult),
    ]);

    res.status(200).json({
      etapas,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeEtapas / limite),
        totalItems: totalDeEtapas,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar etapas" });
  }
};

exports.listarEtapasAtivas = async (req, res) => {
  try {
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    res.status(200).json(etapas);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar etapas" });
  }
};

// Função para obter uma etapa por ID
exports.obterEtapa = async (req, res) => {
  try {
    const etapa = await Etapa.findById(req.params.id);
    if (!etapa) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }
    res.status(200).json(etapa);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter etapa" });
  }
};

// Função para atualizar uma etapa por ID
exports.atualizarEtapa = async (req, res) => {
  try {
    const etapa = await Etapa.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!etapa) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }
    res.status(200).json(etapa);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar etapa" });
  }
};

// Função para excluir uma etapa por ID
exports.excluirEtapa = async (req, res) => {
  try {
    const etapa = await Etapa.findByIdAndDelete(req.params.id);
    if (!etapa) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }
    res.status(200).json({ message: "Etapa excluída com sucesso" });
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir etapa" });
  }
};
