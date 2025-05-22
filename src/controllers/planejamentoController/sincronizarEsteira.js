const Servico = require("../../models/Servico");
const Ticket = require("../../models/Ticket");
const { startOfDay, endOfDay } = require("date-fns");
const { sendResponse, sendErrorResponse } = require("../../utils/helpers");
const { registrarAcao } = require("../../services/controleService");
const {
  ENTIDADES,
  ACOES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

exports.sincronizarEsteira = async (req, res) => {
  try {
    const servicos = await Servico.find({
      status: "pendente",
    }).populate("prestador", "nome documento");

    const etapasValidas = [
      "requisicao",
      "aprovacao-cadastro",
      "geracao-rpa",
      "aprovacao-fiscal",
    ];

    for (const servico of servicos) {
      if (!servico.dataRegistro) continue;
      const data = new Date(servico.dataRegistro);

      const inicioDia = startOfDay(data);
      const fimDia = endOfDay(data);

      let ticket = await Ticket.findOneAndUpdate(
        {
          prestador: servico.prestador._id,
          etapa: { $in: etapasValidas },
          dataRegistro: { $gte: inicioDia, $lte: fimDia },
          status: { $ne: "arquivado" },
        },
        { $push: { servicos: servico._id } },
        { new: true }
      );

      if (!ticket) {
        ticket = await Ticket.findOneAndUpdate(
          {
            prestador: servico.prestador._id,
            etapa: { $in: etapasValidas },
            dataRegistro: { $in: [null, ""] },
            status: { $ne: "arquivado" },
          },
          {
            $push: { servicos: servico._id },
            dataRegistro: servico?.dataRegistro,
          },
          { new: true }
        );
      }

      if (ticket) {
        registrarAcao({
          entidade: ENTIDADES.TICKET,
          acao: ACOES.ALTERADO,
          origem: ORIGENS.PLANEJAMENTO,
          dadosAtualizados: ticket,
          idRegistro: ticket._id,
          usuario: req.usuario,
        });
      }

      if (!ticket) {
        ticket = new Ticket({
          prestador: servico.prestador._id,
          titulo: `Comissão ${servico.prestador.nome} - ${servico.prestador?.documento}`,
          servicos: [servico._id],
          etapa: "requisicao",
          dataRegistro: servico?.dataRegistro,
        });

        registrarAcao({
          entidade: ENTIDADES.TICKET,
          acao: ACOES.ADICIONADO,
          origem: ORIGENS.PLANEJAMENTO,
          dadosAtualizados: ticket,
          idRegistro: ticket._id,
          usuario: req.usuario,
        });
      }

      await ticket.save();
      servico.status = "processando";
      await servico.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "Esteira sincronizada",
    });
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro ao sincronizar a esteira",
      error: error.message,
    });
  }
};
