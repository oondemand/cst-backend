const { parse, format } = require("date-fns");
const { LISTA_PAISES_OMIE } = require("../../utils/omie.js");
const Banco = require("../../models/Banco");

// Função para converter strings de data no formato dd/MM/yyyy em objeto Date
const parseDate = (dateStr) => {
  if (!dateStr || dateStr === "") return null;
  if (typeof dateStr === "string") {
    return parse(dateStr.replace(/[^\w\/]/g, ""), "dd/MM/yyyy", new Date());
  }
  return dateStr;
};

// Converte uma linha do Excel para o objeto Prestador, seguindo a ordem dos campos do modelo
const mapRowToPrestador = async (row) => {
  // Para país: usa a coluna 24 (nome do país) e faz lookup na LISTA_PAISES_OMIE
  const paisNome = row[24] || "";
  const paisObj = LISTA_PAISES_OMIE.find(p => p.cDescricao.toLowerCase() === paisNome.toLowerCase());

  // Para banco: usa a coluna 12; tenta primeiro pelo código, se não, busca por nome (case-insensitive)
  const bancoInput = row[12] || "";
  const bancos = await Banco.find({});
  let bancoValor = "";
  let bancoObj = bancos.find(b => b.cCodigo === bancoInput);
  if (bancoObj) {
    bancoValor = bancoObj.cDescricao;
  } else {
    bancoObj = bancos.find(b => b.cDescricao.toLowerCase() === bancoInput.toLowerCase());
    bancoValor = bancoObj ? bancoObj.cDescricao : bancoInput;
  }

  const prestador = {
    nome: row[0],
    email: row[1] === "" ? null : row[1],
    tipo: row[2],
    documento: row[3],
    pessoaFisica: {
      dataNascimento: parseDate(row[4]),
      pis: row[5],
      rg: {
        numero: row[6] || "",
        orgaoEmissor: row[7] || "",
      },
    },
    pessoaJuridica: {
      nomeFantasia: row[8] || "",
      codigoCNAE: row[9] || "",
      codigoServicoNacional: row[10] || "",
      regimeTributario: row[11] || "",
    },
    dadosBancarios: {
      banco: bancoValor,
      agencia: row[13],
      conta: row[14],
      tipoConta: row[15] ? row[15].toLowerCase() : "",
      tipoChavePix: row[16] || "",
      chavePix: row[17] || "",
    },
    endereco: {
      cep: row[18] ? row[18].replaceAll("-", "") : "",
      rua: row[19],
      numero: row[20],
      complemento: row[21],
      cidade: row[22],
      estado: row[23],
      pais: {
        nome: paisNome,
        cod: paisObj ? paisObj.cCodigo : "",
      },
    },
    comentariosRevisao: row[25] || "",
    status: row[26] || "ativo",
    dataExportacao: row[27] ? new Date(row[27]) : null,
  };

  return prestador;
};

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

module.exports = { mapRowToPrestador, mapPrestadorToRow };
