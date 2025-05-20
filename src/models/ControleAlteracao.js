const mongoose = require("mongoose");

const ENTIDADES = [
  "prestador",
  "servico",
  "documento-fiscal",
  "ticket",
  "configuracao.usuario",
  "configuracao.lista.nome-lista",
  "configuracao.sistema.email",
  "configuracao.sistema.omie",
  "configuracao.sistema.app-prestador",
  "configuracao.assistente",
  "configuracao.etapa",
];

const ACOES = [
  "adicionado",
  "alterado",
  "excluido",
  "convite-enviado",
  "aprovado",
  "reprovado",
  "arquivado",
  "pago",
  "pagamento-excluido",
  "adicionar",
  "alterar",
  "excluir",
  "envio-convite",
  "recuperar-senha",
];

const ORIGENS = [
  "form",
  "datagrid",
  "importacao",
  "omie",
  "app-prestador",
  "aprovacao-documento",
  "aprovacao-documento-fiscal",
  "planejamento",
  "esteira",
];

const controleAlteracaoSchema = new mongoose.Schema({
  dataHora: {
    type: Date,
    default: Date.now,
    required: true,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  entidade: {
    type: String,
    enum: ENTIDADES,
    required: true,
  },
  idRegistroAlterado: {
    type: String,
    required: true,
  },
  acao: {
    type: String,
    enum: ACOES,
    required: true,
  },
  origem: {
    type: String,
    enum: ORIGENS,
    required: true,
  },
  dadosAtualizados: {
    type: Object,
  },
});

module.exports = mongoose.model("ControleAlteracao", controleAlteracaoSchema);
