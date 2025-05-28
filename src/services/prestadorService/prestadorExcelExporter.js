const { format } = require("date-fns");
const Banco = require("../../models/Banco");

// NEW: export mapping function for Excel export.
const mapPrestadorToRow = async (prestador) => {
  const bankRecord = await Banco.findOne({ cDescricao: prestador.dadosBancarios.banco });
  const bancoCodigo = bankRecord ? bankRecord.cCodigo : "";
  const bancoNome = prestador.dadosBancarios.banco;
  const dataNascimento = prestador.pessoaFisica.dataNascimento
    ? format(prestador.pessoaFisica.dataNascimento, "dd/MM/yyyy")
    : "";
    
  return [
    prestador.nome,
    prestador.email || "",
    prestador.tipo,
    prestador.documento,
    dataNascimento,
    prestador.pessoaFisica.pis,
    prestador.pessoaFisica.rg.numero,
    prestador.pessoaFisica.rg.orgaoEmissor,
    prestador.pessoaJuridica.nomeFantasia,
    prestador.pessoaJuridica.codigoCNAE,
    prestador.pessoaJuridica.codigoServicoNacional,
    prestador.pessoaJuridica.regimeTributario,
    bancoCodigo,   // Banco: Código do banco
    bancoNome,     // Banco: Nome do banco
    prestador.dadosBancarios.agencia,
    prestador.dadosBancarios.conta,
    prestador.dadosBancarios.tipoConta,
    prestador.dadosBancarios.tipoChavePix,
    prestador.dadosBancarios.chavePix,
    prestador.endereco.cep,
    prestador.endereco.rua,
    prestador.endereco.numero,
    prestador.endereco.complemento,
    prestador.endereco.cidade,
    prestador.endereco.estado,
    prestador.endereco.pais.nome,  // Exporta o nome do país em vez do código
    prestador.comentariosRevisao || "",
    prestador.status,
    prestador.dataExportacao ? prestador.dataExportacao.toISOString() : ""
  ];
};

module.exports = { mapPrestadorToRow };