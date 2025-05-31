// Contém funções de transformação dos dados vindos do Excel e do Omie para o formato do Prestador.
const { parse } = require("date-fns");

const converterLinhaEmPrestadorExcel = ({ row, LISTA_PAISES_OMIE }) => {
  const pais = LISTA_PAISES_OMIE.find(e => e.cDescricao.toLowerCase() === row[15]?.toLowerCase());
  const formatDataNascimento = () => {
    const data = row[16];
    if (data === "") return null;
    if (typeof data === "string") {
      // Remover caracteres especiais e converter para o formato dd/MM/yyyy
      return parse(data.replace(/[^\w\/]/g, ""), "dd/MM/yyyy", new Date());
    }
    return data;
  };
  return {
    manager: row[0],
    nome: row[1],
    tipo: row[2],
    documento: row[3],
    dadosBancarios: {
      banco: row[4],
      agencia: row[5],
      conta: row[6],
      tipoConta: row[7]?.toLowerCase(),
    },
    email: row[8] === "" ? null : row[8],
    endereco: {
      cep: row[9]?.replaceAll("-", ""),
      rua: row[10],
      numero: row[11],
      complemento: row[12],
      cidade: row[13],
      estado: row[14],
      pais: { nome: pais?.cDescricao, cod: pais?.cCodigo },
    },
    pessoaFisica: {
      dataNascimento: formatDataNascimento(),
      pis: row[17],
    },
    pessoaJuridica: { nomeFantasia: row[18] },
  };
};

const mapOmieEventToPrestador = (event) => {
  const documento = event?.cnpj_cpf
    ? Number(event.cnpj_cpf.replaceAll(".", "").replaceAll("-", ""))
    : null;
  return {
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
      complemento: event?.complemento,
      cidade: event?.cidade ?? "",
      estado: event?.estado ?? "",
    },
  };
};

module.exports = { converterLinhaEmPrestadorExcel, mapOmieEventToPrestador };
