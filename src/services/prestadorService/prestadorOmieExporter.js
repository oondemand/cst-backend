function mapPrestadorToOmie(prestador) {
  return {
    cnpj_cpf: prestador.documento,
    razao_social: prestador.nome,
    pessoa_fisica: prestador.tipo === "pf" ? "S" : "N",
    email: prestador.email || "",
    dadosBancarios: {
      codigo_banco: prestador?.dadosBancarios?.banco || "",
      agencia: prestador?.dadosBancarios?.agencia || "",
      conta_corrente: prestador?.dadosBancarios?.conta || ""
    },
    cep: prestador?.endereco?.cep || "",
    endereco: prestador?.endereco?.rua || "",
    endereco_numero: prestador?.endereco?.numero || "",
    complemento: prestador?.endereco?.complemento || "",
    cidade: prestador?.endereco?.cidade || "",
    estado: prestador?.endereco?.estado || ""
    // ...adicione outros campos se necessário...
  };
}

module.exports = { mapPrestadorToOmie };
