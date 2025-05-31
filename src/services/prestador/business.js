const Lista = require("../../models/Lista");
const { registrarAcao } = require("../../services/controleService");
const { ACOES, ENTIDADES, ORIGENS } = require("../../constants/controleAlteracao");
const { validarPrestadorEmailAoCriar, validarPrestadorEmailAoAtualizar } = require("./validators");
const { converterLinhaEmPrestadorExcel, mapOmieEventToPrestador } = require("./transformers");

exports.criarNovoManager = async ({ manager, usuario }) => {
  const managers = await Lista.findOne({ codigo: "manager" });
  const managerExistente = managers.valores.some(e => e?.valor?.trim() === manager?.trim());
  if (!managerExistente) {
    managers.valores.push({ valor: manager?.trim() });
    await managers.save();
    registrarAcao({
      acao: ACOES.ADICIONADO,
      entidade: ENTIDADES.CONFIGURACAO_LISTA_MANAGER,
      origem: ORIGENS.IMPORTACAO,
      dadosAtualizados: managers,
      idRegistro: managers._id,
      usuario,
    });
  }
};

exports.converterLinhaEmPrestador = async (params) => {
  return converterLinhaEmPrestadorExcel(params);
};

exports.criarNovoPrestador = async ({ prestador, usuario, PrestadorModel }) => {
  await validarPrestadorEmailAoCriar({ email: prestador?.email, PrestadorModel });
  const novoPrestador = new PrestadorModel({ ...prestador, status: "ativo" });
  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: novoPrestador,
    idRegistro: novoPrestador._id,
    usuario,
  });
  return await novoPrestador.save();
};

exports.buscarPrestadorPorDocumentoEAtualizar = async ({
  documento,
  prestador,
  usuario,
  PrestadorModel,
  UsuarioModel,
}) => {
  if (!documento || !prestador) return null;
  const prestadorExistente = await PrestadorModel.findOne({ documento });
  if (!prestadorExistente) return null;
  await validarPrestadorEmailAoAtualizar({
    email: prestador?.email,
    currentPrestador: prestadorExistente,
    PrestadorModel,
    UsuarioModel,
  });
  const prestadorAtualizado = await PrestadorModel.findOneAndUpdate({ documento }, prestador, { new: true });
  registrarAcao({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: prestadorAtualizado,
    idRegistro: prestadorAtualizado._id,
    usuario,
  });
  return prestadorAtualizado;
};

exports.mapOmieToPrestador = (event) => {
  return mapOmieEventToPrestador(event);
};
