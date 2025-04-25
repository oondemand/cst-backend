const BaseOmie = require("../../models/BaseOmie");
const ListaOmie = require("../../models/ListaOmie");
const { ListaOmieService } = require("../../services/omie/listasOmie");

const update = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne();
    const listaOmie = await ListaOmie.findByIdAndUpdate(req.params.id);

    if (!listaOmie) {
      return res.status(404).json({ message: "Lista não encontrada" });
    }

    const data = await ListaOmieService({
      call: listaOmie.call,
      url: listaOmie.url,
      baseOmie,
      select: listaOmie.select,
      fields: listaOmie.fields,
    });

    listaOmie.data = data;
    await listaOmie.save();

    res.send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listAll = async (req, res) => {
  try {
    const listas = await ListaOmie.find().select("-__v -data -fields -select");
    res.json(listas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getListaPorCodigo = async (req, res) => {
  try {
    const lista = await ListaOmie.findOne({
      codigo: req.params.codigo,
    }).select("data");

    res.json(lista.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const lista = new ListaOmie({
      ...req.body,
    });

    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLista = async (req, res) => {
  try {
    const lista = ListaOmie.findByIdAndDelete(req.params.id);
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.ListaOmieController = {
  update,
  listAll,
  getListaPorCodigo,
  create,
  deleteLista,
};
