const Lista = require("../models/Lista");
const { sendResponse, sendErrorResponse } = require("../utils/helpers");
const { registrarAcao } = require("../services/controleService");
const { ENTIDADES, ACOES, ORIGENS } = require("../constants/controleAlteracao");

const createLista = async (req, res) => {
  const { codigo } = req.body;
  try {
    const novaLista = new Lista({ codigo, valores: [] });
    await novaLista.save();
    sendResponse({ res, statusCode: 201, lista: novaLista });
  } catch (err) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao criar lista",
      error: err.message,
    });
  }
};

const addItem = async (req, res) => {
  const { id } = req.params;
  const { valor } = req.body;
  try {
    const lista = await Lista.findById(id).populate("valores");

    if (!lista)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Lista não encontrada",
      });

    const entidade = Object.entries(ENTIDADES).find(([key, value]) =>
      value.includes(lista.codigo)
    )?.[1];

    registrarAcao({
      acao: ACOES.ADICIONADO,
      entidade: entidade ?? ENTIDADES.CONFIGURACAO_LISTA,
      usuario: req.usuario,
      idRegistro: lista._id,
      dadosAtualizados: lista,
      origem: req.headers["x-origem"] ?? ORIGENS.API,
    });

    lista.valores.push({ valor });
    await lista.save();
    sendResponse({ res, statusCode: 200, lista });
  } catch (err) {
    console.log("err", err);
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao adicionar item à lista",
      error: err.message,
    });
  }
};

const removeItem = async (req, res) => {
  const { id, itemId } = req.params;

  try {
    const lista = await Lista.findById(id).populate("valores");

    if (!lista)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Lista não encontrada",
      });

    lista.valores = lista.valores.filter((item) => item._id != itemId);
    await lista.save();

    const entidade = Object.entries(ENTIDADES).find(([key, value]) =>
      value.includes(lista.codigo)
    )?.[1];

    registrarAcao({
      acao: ACOES.EXCLUIDO,
      entidade: entidade ?? ENTIDADES.CONFIGURACAO_LISTA,
      usuario: req.usuario,
      idRegistro: lista._id,
      dadosAtualizados: lista,
      origem: req.headers["x-origem"] ?? ORIGENS.API,
    });

    sendResponse({ res, statusCode: 200, lista });
  } catch (err) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao remover item da lista",
      error: err.message,
    });
  }
};

const getListas = async (req, res) => {
  try {
    const listas = await Lista.aggregate([
      {
        $addFields: {
          valores: { $reverseArray: "$valores" },
        },
      },
    ]);
    sendResponse({ res, statusCode: 200, listas });
  } catch (err) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao listar listas",
      error: err.message,
    });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { itemId, valor } = req.body;

  try {
    const lista = await Lista.findById(id).populate("valores");

    if (!lista)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Lista não encontrada",
      });

    const index = lista.valores.findIndex((item) => item._id == itemId);

    if (index === -1)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Item não encontrado",
      });

    const trimmedValor = valor.trim();

    const valorExistente = lista.valores.some(
      (item) => item.valor === trimmedValor
    );

    if (valorExistente) {
      return sendErrorResponse({
        res,
        statusCode: 400,
        message: "Este valor já existe na lista",
      });
    }

    if (valor) lista.valores[index].valor = valor;
    await lista.save();

    const entidade = Object.entries(ENTIDADES).find(([key, value]) =>
      value.includes(lista.codigo)
    )?.[1];

    registrarAcao({
      acao: ACOES.ALTERADO,
      entidade: entidade ?? ENTIDADES.CONFIGURACAO_LISTA,
      usuario: req.usuario,
      idRegistro: lista._id,
      dadosAtualizados: lista,
      origem: req.headers["x-origem"] ?? ORIGENS.API,
    });

    sendResponse({ res, statusCode: 200, lista });
  } catch (err) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao atualizar item da lista",
      error: err.message,
    });
  }
};

const getListaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const lista = await Lista.findOne({ codigo });

    if (!lista) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Lista não encontrada",
      });
    }

    lista.valores = lista.valores.filter((item) => item.valor);
    sendResponse({ res, statusCode: 200, lista });
  } catch (err) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao buscar lista por código",
      error: err.message,
    });
  }
};

module.exports = {
  createLista,
  addItem,
  removeItem,
  getListas,
  updateItem,
  getListaPorCodigo,
};
