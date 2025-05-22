const Ticket = require("../models/Ticket");
const Servico = require("../models/Servico");
const DocumentoFiscal = require("../models/DocumentoFiscal");
const ContaPagar = require("../models/ContaPagar");
const { registrarAcao } = require("../services/controleService");
const { ACOES, ORIGENS } = require("../constants/controleAlteracao");

const contaPagarWebHook = async (req, res) => {
  try {
    const { event, ping, topic } = req.body;
    if (ping === "omie") return res.status(200).json({ message: "pong" });

    if (topic === "Financas.ContaPagar.Alterado") {
      console.log("🟩 Conta a pagar alterada");

      await ContaPagar.findOneAndUpdate(
        {
          codigo_lancamento_omie: event?.codigo_lancamento_omie,
        },
        {
          status_titulo: event?.situacao,
        },
        { new: true }
      );
    }

    if (topic === "Financas.ContaPagar.BaixaRealizada") {
      console.log("🟨 Baixa realizada no omie");

      const contaPagar = await ContaPagar.findOneAndUpdate(
        {
          codigo_lancamento_omie:
            event?.[0]?.conta_a_pagar[0].codigo_lancamento_omie,
        },
        { ...event?.[0]?.conta_a_pagar[0], status_titulo: "pago" },
        { new: true }
      );

      const ticket = await Ticket.findOneAndUpdate(
        {
          contaPagarOmie: contaPagar?._id,
        },
        {
          status: "concluido",
          etapa: "concluido",
        },
        { new: true }
      );

      if (ticket?.servicos.length > 0) {
        await Servico.updateMany(
          { _id: { $in: ticket?.servicos } },
          { status: "pago" }
        );
      }

      if (ticket?.documentosFiscais.length > 0) {
        await DocumentoFiscal.updateMany(
          { _id: { $in: ticket?.documentosFiscais } },
          { status: "pago" }
        );
      }

      registrarAcao({
        acao: ACOES.PAGO,
        entidade: ENTIDADES.TICKET,
        origem: ORIGENS.OMIE,
        idRegistro: ticket?._id,
        dadosAtualizados: ticket,
      });
    }

    if (topic === "Financas.ContaPagar.BaixaCancelada") {
      console.log("🟧 Baixa cancelada no omie");

      const contaPagar = await ContaPagar.findOneAndUpdate(
        {
          codigo_lancamento_omie:
            event?.[0]?.conta_a_pagar[0].codigo_lancamento_omie,
        },
        { ...event?.[0]?.conta_a_pagar[0], status_titulo: "A vencer" },
        { new: true }
      );

      const ticket = await Ticket.findOneAndUpdate(
        {
          contaPagarOmie: contaPagar?._id,
        },
        {
          status: "trabalhando",
          etapa: "integracao-omie",
        },
        { new: true }
      );

      if (ticket?.servicos.length > 0) {
        await Servico.updateMany(
          { _id: { $in: ticket?.servicos } },
          { status: "processando" }
        );
      }

      if (ticket?.documentosFiscais.length > 0) {
        await DocumentoFiscal.updateMany(
          { _id: { $in: ticket?.documentosFiscais } },
          { status: "processando" }
        );
      }

      registrarAcao({
        acao: ACOES.PAGAMENTO_EXCLUIDO,
        entidade: ENTIDADES.TICKET,
        origem: ORIGENS.OMIE,
        idRegistro: ticket?._id,
        dadosAtualizados: ticket,
      });
    }

    if (topic === "Financas.ContaPagar.Excluido") {
      console.log("🟥 Conta pagar excluída no omie");

      const contaPagar = await ContaPagar.findOneAndDelete({
        codigo_lancamento_omie: event?.codigo_lancamento_omie,
      });

      const ticket = await Ticket.findOneAndUpdate(
        {
          contaPagarOmie: contaPagar?._id,
        },
        {
          status: "revisao",
          etapa: "aprovacao-fiscal",
          contaPagarOmie: null,
          observacao: "[CONTA A PAGAR REMOVIDA DO OMIE]",
        },
        { new: true }
      );

      if (ticket?.servicos.length > 0) {
        await Servico.updateMany(
          { _id: { $in: ticket?.servicos } },
          { status: "processando" }
        );
      }

      if (ticket?.documentosFiscais.length > 0) {
        await DocumentoFiscal.updateMany(
          { _id: { $in: ticket?.documentosFiscais } },
          { status: "processando" }
        );
      }

      registrarAcao({
        acao: ACOES.ALTERADO,
        entidade: ENTIDADES.TICKET,
        origem: ORIGENS.OMIE,
        idRegistro: ticket?._id,
        dadosAtualizados: ticket,
      });
    }

    sendResponse({
      res,
      statusCode: 200,
      message: "Webhook recebido. Fatura sendo gerada.",
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Erro ao processar o webhook.",
      error: error.message,
    });
  }
};

module.exports = { contaPagarWebHook };
