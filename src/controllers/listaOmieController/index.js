const BaseOmie = require("../../models/BaseOmie");
const ListaOmie = require("../../models/ListaOmie");
const { ListaOmieService } = require("../../services/omie/listasOmie");

const { sendResponse, sendErrorResponse } = require("../../utils/helpers");

const syncOmie = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne();
    const listaOmie = await ListaOmie.findByIdAndUpdate(req.params.id);

    if (!listaOmie) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Lista não encontrada",
      });
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

    return sendResponse({
      res,
      statusCode: 200,
      message: "Lista sincronizada com sucesso",
      lista: listaOmie,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ocorreu um erro ao sincronizar a lista",
    });
  }
};

const update = async (req, res) => {
  try {
    const lista = await ListaOmie.findByIdAndUpdate(req.params.id, {
      ...req.body,
    }).select("-__v -data");

    return sendResponse({
      res,
      statusCode: 200,
      message: "Lista atualizada com sucesso",
      lista,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ocorreu um erro ao atualizar a lista",
    });
  }
};

const listAll = async (req, res) => {
  try {
    const listas = await ListaOmie.find().select("-__v -data -fields -select");
    return sendResponse({
      res,
      statusCode: 200,
      message: "Listas encontradas com sucesso",
      lista: listas,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ocorreu um erro ao listar as listas",
    });
  }
};

const getListaPorCodigo = async (req, res) => {
  try {
    const lista = await ListaOmie.findOne({
      codigo: req.params.codigo,
    }).select("data");

    return sendResponse({
      res,
      statusCode: 200,
      message: "Lista encontrada com sucesso",
      lista: lista.data,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ocorreu um erro ao buscar a lista",
    });
  }
};

const create = async (req, res) => {
  try {
    const lista = new ListaOmie({
      ...req.body,
    });

    await lista.save();

    return sendResponse({
      res,
      statusCode: 200,
      message: "Lista criada com sucesso",
      lista,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ocorreu um erro ao criar a lista",
    });
  }
};

const deleteLista = async (req, res) => {
  try {
    const lista = ListaOmie.findByIdAndDelete(req.params.id);
    return sendResponse({
      res,
      statusCode: 200,
      message: "Lista deletada com sucesso",
      lista,
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ocorreu um erro ao deletar a lista",
    });
  }
};

exports.ListaOmieController = {
  update,
  listAll,
  getListaPorCodigo,
  create,
  deleteLista,
  syncOmie,
};
