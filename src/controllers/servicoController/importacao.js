const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const Usuario = require("../../models/Usuario.js");
const Servico = require("../../models/Servico.js");

const { registrarAcao } = require("../../services/controleService");
const {
  ACOES,
  ENTIDADES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

const {
  arrayToExcelBuffer,
  arredondarValor,
  excelToJson,
} = require("../../utils/excel.js");

const { sendErrorResponse } = require("../../utils/helpers");

const converterLinhaEmServico = async ({ row }) => {
  const tipoPessoa =
    row[2] === "RPA" ? "pf" : row[3] === "invoice" ? "ext" : "pj";

  const competencia = row[6];

  const servico = {
    prestador: {
      nome: row[0],
      documento: row[1],
      tipo: tipoPessoa,
    },
    tipoDocumentoFiscal: row[2],
    descricao: row[3],
    codigoCNAE: row[4],
    dataRegistro: row[5],
    competencia: {
      mes: competencia && competencia.getMonth() + 1,
      ano: competencia && competencia.getFullYear(),
    },
    valor: arredondarValor(row[7]),
  };

  return servico;
};

const buscarServicoExistente = async ({ prestadorId, competencia }) => {
  if (!prestadorId || !competencia) return null;
  const servico = await Servico.findOne({
    prestador: prestadorId,
    "competencia.mes": competencia?.mes,
    "competencia.ano": competencia?.ano,
  });

  return servico;
};

const buscarPrestadorPorDocumento = async ({ documento }) => {
  if (!documento) return null;
  return await Prestador.findOne({ documento });
};

const criarNovoPrestador = async ({ nome, tipo, documento, usuario }) => {
  const prestador = new Prestador({
    nome,
    tipo,
    documento,
    status: "ativo",
  });

  await prestador.save();

  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: prestador,
    idRegistro: prestador._id,
    usuario,
  });

  return prestador;
};

const criarNovoServico = async (servico, usuario) => {
  const novoServico = new Servico({
    ...servico,
    status: "aberto",
  });

  await novoServico.save();

  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.SERVICO,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: novoServico,
    idRegistro: novoServico._id,
    usuario,
  });
};

const processarJsonServicos = async ({ json, usuario }) => {
  const detalhes = {
    totalDeLinhasLidas: json.length - 1,
    linhasLidasComErro: 0,
    novosPrestadores: 0,
    novosServicos: 0,
    errors: "",
  };

  const arquivoDeErro = [];

  for (const [i, row] of json.entries()) {
    try {
      if (i === 0) {
        arquivoDeErro.push(row);
        continue;
      }

      const servico = await converterLinhaEmServico({ row });
      let prestador = await buscarPrestadorPorDocumento({
        documento: servico?.prestador?.documento,
      });

      if (!prestador) {
        prestador = await criarNovoPrestador(
          {
            documento: servico?.prestador?.documento,
            nome: servico?.prestador?.nome,
            tipo: servico?.prestador?.tipo,
          },
          usuario
        );

        detalhes.novosPrestadores += 1;
        await prestador.save();
      }

      const servicoExistente = await buscarServicoExistente({
        competencia: servico?.competencia,
        prestadorId: prestador?._id,
      });

      if (servicoExistente) {
        throw new Error(
          "Serviço para esse prestador com competência já cadastrada!"
        );
      }

      if (!servicoExistente) {
        await criarNovoServico(
          {
            ...servico,
            prestador: prestador?._id,
          },
          usuario
        );
        detalhes.novosServicos += 1;
      }
    } catch (error) {
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [PRESTADOR: ${row[0]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarServico = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "servico",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });

    await importacao.save();

    if (arquivo && importacao) {
      sendResponse({
        res,
        statusCode: 200,
        importacao,
      });
    }

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonServicos({
      json,
      usuario: req.usuario,
    });

    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;

    await importacao.save();
  } catch (error) {
    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro ao importar arquivo",
      error,
    });
  }
};
