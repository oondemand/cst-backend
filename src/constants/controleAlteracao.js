const ENTIDADES = {
  PRESTADOR: "prestador",
  SERVICO: "servico",
  DOCUMENTO_FISCAL: "documento-fiscal",
  TICKET: "ticket",
  CONFIGURACAO_USUARIO: "configuracao.usuario",
  CONFIGURACAO_LISTA_NOME_LISTA: "configuracao.lista.nome-lista",
  CONFIGURACAO_SISTEMA_EMAIL: "configuracao.sistema.email",
  CONFIGURACAO_SISTEMA_OMIE: "configuracao.sistema.omie",
  CONFIGURACAO_SISTEMA_APP_PRESTADOR: "configuracao.sistema.app-prestador",
  CONFIGURACAO_ASSISTENTE: "configuracao.assistente",
  CONFIGURACAO_ETAPA: "configuracao.etapa",
};

const ACOES = {
  ADICIONADO: "adicionado",
  ALTERADO: "alterado",
  EXCLUIDO: "excluido",
  CONVITE_ENVIADO: "convite-enviado",
  APROVADO: "aprovado",
  REPROVADO: "reprovado",
  ARQUIVADO: "arquivado",
  PAGO: "pago",
  PAGAMENTO_EXCLUIDO: "pagamento-excluido",
  RECUPERAR_SENHA: "recuperar-senha",
};

const ORIGENS = {
  FORM: "form",
  // DATAGRID: "datagrid",
  IMPORTACAO: "importacao",
  OMIE: "omie",
  APP_PRESTADOR: "app-prestador",
  APROVACAO_DOCUMENTO: "aprovacao-documento",
  APROVACAO_DOCUMENTO_FISCAL: "aprovacao-documento-fiscal",
  PLANEJAMENTO: "planejamento",
  ESTEIRA: "esteira",
};

module.exports = {
  ENTIDADES,
  ACOES,
  ORIGENS,
};
