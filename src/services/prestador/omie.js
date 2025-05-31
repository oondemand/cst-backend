const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");
const { sincronizarPrestador } = require("../../services/omie/sincronizarPrestador");
const { registrarAcao } = require("../../services/controleService");
const { ACOES, ENTIDADES, ORIGENS } = require("../../constants/controleAlteracao");
const { sendResponse, sendErrorResponse } = require("../../utils/helpers");

exports.handleWebhook = async (body, res) => {
  try {
    const { event, ping, topic } = body;
    if (ping === "omie") {
      return sendResponse({ res, statusCode: 200, message: "pong" });
    }
    if (topic === "ClienteFornecedor.Alterado") {
      console.log("🟩 Webhook recebido alterando prestador");
      const documento = event?.cnpj_cpf
        ? Number(event.cnpj_cpf.replaceAll(".", "").replaceAll("-", ""))
        : null;
      const prestadorOmie = {
        nome: event.razao_social,
        tipo: event?.pessoa_fisica === "S" ? "pf" : event?.pessoa_fisica === "pf" ? "pf" : "ext",
        documento,
        dadosBancarios: {
          banco: event?.dadosBancarios?.codigo_banco ?? "",
          agencia: event?.dadosBancarios?.agencia ?? "",
          conta: event?.dadosBancarios?.conta_corrente ?? "",
        },
        email: event?.email ?? "",
        endereco: {
          cep: event?.cep ?? "",
          rua: event?.endereco ?? "",
          numero: event?.endereco_numero ? Number(event?.endereco_numero) : "",
          complemento: event?.complemento, // mantido o campo conforme regra original
          cidade: event?.cidade ?? "",
          estado: event?.estado ?? "",
        },
      };

      const prestador = await Prestador.findOne({ $or: [{ documento }, { email: event?.email }] });
      if (documento) {
        const prestadorDocumento = await Prestador.findOne({ documento });
        if (prestadorDocumento && prestador._id.toString() !== prestadorDocumento._id.toString()) {
          return sendErrorResponse({ res, statusCode: 409, message: "Já existe um prestador com esse documento registrado" });
        }
      }
      if (prestadorOmie?.email) {
        const prestadorEmail = await Prestador.findOne({ email: prestadorOmie?.email });
        if (prestadorEmail && prestadorEmail?._id?.toString() !== prestador._id.toString()) {
          console.log("Já existe um prestador com esse email registrado");
          return sendErrorResponse({ res, statusCode: 409, message: "Já existe um prestador com esse email registrado" });
        }
        if (prestador?.usuario) {
          const usuario = await Usuario.findOne({ email: prestadorOmie?.email });
          if (usuario && usuario?._id?.toString() !== prestador.usuario.toString()) {
            return sendErrorResponse({ res, statusCode: 409, message: "Já existe um usuário prestador com esse email registrado" });
          }
          if (usuario) {
            usuario.email = prestadorOmie?.email;
            await usuario.save();
          }
        }
      }
      const prestadorAlterado = await Prestador.findOneAndUpdate(
        { $or: [{ documento }, { email: event.email }] },
        { ...prestadorOmie },
        { new: true }
      );
      registrarAcao({
        acao: ACOES.ALTERADO,
        entidade: ENTIDADES.PRESTADOR,
        origem: ORIGENS.OMIE,
        dadosAtualizados: prestadorAlterado,
        idRegistro: prestadorAlterado._id,
      });
    }
    sendResponse({ res, statusCode: 200, message: "Webhook recebido. Dados sendo atualizados." });
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    sendErrorResponse({ res, statusCode: 500, message: "Ouve um erro inesperado ao processar o webhook.", error: error.message });
  }
};
