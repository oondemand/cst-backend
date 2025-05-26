const express = require("express");
const router = express.Router();

const BaseOmie = require("../models/BaseOmie");
const Usuario = require("../models/Usuario");
const Lista = require("../models/Lista");
const Banco = require("../models/Banco");
const Estado = require("../models/Estado");
const Etapa = require("../models/Etapa");
const Sistema = require("../models/Sistema");
const ListaOmie = require("../models/ListaOmie");

const bancos = require("../seeds/bancos.json");
const estados = require("../seeds/estados.json");
const listas = require("../seeds/listas.json");
const listaomies = require("../seeds/listaomies.json");
const sistemas = require("../seeds/sistemas.json");
const etapas = require("../seeds/etapas.json");

const { sendErrorResponse, sendResponse } = require("../utils/helpers");

const seed = async (req, res) => {
  const { baseOmie, usuario } = req.body;

  const usuarioExistente = await Usuario.findOne();
  const baseOmieExistente = await BaseOmie.findOne();

  if (usuarioExistente || baseOmieExistente) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Ativação já realizada",
    });
  }

  if (!baseOmie || !usuario) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Dados incompletos",
    });
  }

  const novaBaseOmie = new BaseOmie(baseOmie);
  await novaBaseOmie.save();

  const novoUsuario = new Usuario(usuario);
  await novoUsuario.save();

  for (const lista of listas) {
    const novaLista = new Lista(lista);
    await novaLista.save();
  }

  for (const banco of bancos) {
    const novoBanco = new Banco(banco);
    await novoBanco.save();
  }

  for (const estado of estados) {
    const novoEstado = new Estado(estado);
    await novoEstado.save();
  }

  for (const etapa of etapas) {
    const novaEtapa = new Etapa(etapa);
    await novaEtapa.save();
  }

  for (const sistema of sistemas) {
    const novoSistema = new Sistema(sistema);
    await novoSistema.save();
  }

  for (const listaomie of listaomies) {
    const novaListaOmie = new ListaOmie(listaomie);
    await novaListaOmie.save();
  }

  return sendResponse({
    res,
    statusCode: 200,
    message: "Ativação realizada com sucesso!",
  });
};

router.post("/", seed);
module.exports = router;
