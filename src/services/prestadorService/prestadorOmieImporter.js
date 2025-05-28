function mapOmieToPrestador(event) {
  const documento = event?.cnpj_cpf ? String(event.cnpj_cpf).replace(/\D/g, "") : "";
  return {
    nome: event.razao_social,
    tipo: event?.pessoa_fisica === "S" || event?.pessoa_fisica === "pf" ? "pf" : "ext",
    documento,
    email: event?.email || "",
    dadosBancarios: {
      banco: event?.dadosBancarios?.codigo_banco || "",
      agencia: event?.dadosBancarios?.agencia || "",
      conta: event?.dadosBancarios?.conta_corrente || ""
    },
    endereco: {
      cep: event?.cep || "",
      rua: event?.endereco || "",
      numero: event?.endereco_numero || "",
      complemento: event?.complemento || "",
      cidade: event?.cidade || "",
      estado: event?.estado || "",
      pais: { nome: "", cod: "" } // caso não esteja disponível no evento
    }
    // ...adicione outros campos se necessário...
  };
}

module.exports = { mapOmieToPrestador };
