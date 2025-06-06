const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const DocumentoFiscal = require("../../models/DocumentoFiscal.js");
const Lista = require("../../models/Lista.js");

const {
  arrayToExcelBuffer,
  arredondarValor,
  excelToJson,
} = require("../../utils/excel.js");

const { registrarAcao } = require("../../services/controleService");
const {
  ACOES,
  ENTIDADES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

const { sendErrorResponse, sendResponse } = require("../../utils/helpers");

const converterLinhaEmDocumentoFiscal = async ({ row }) => {
  const competencia = row[4];

  console.log(row[0]);

  const documentoFiscal = {
    prestador: {
      nome: row[0],
      documento: row[1],
    },
    tipoDocumentoFiscal: row[2],
    numero: row[3],
    competencia: {
      mes: competencia && competencia.getMonth() + 1,
      ano: competencia && competencia.getFullYear(),
    },

    valor: arredondarValor(row[5]),
    imposto: arredondarValor(row[6]),
    classificacaoFiscal: row[7],
    descricao: row[8],
    motivoRecusa: row[9],
    observacaoPrestador: row[10],
    observacao: row[11],
  };

  return documentoFiscal;
};

const buscarPrestadorPorDocumento = async ({ documento }) => {
  if (!documento) return null;
  return await Prestador.findOne({ documento });
};

const criarNovoPrestador = async ({ nome, tipo, documento, usuario }) => {
  const prestador = new Prestador({
    nome,
    tipo: tipo ? tipo : "",
    documento,
    status: "ativo",
  });

  await prestador.save();

  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: prestador,
    idRegistro: prestador?._id,
    usuario,
  });

  return prestador;
};

const criarNovoDocumentoFiscal = async (documentoFiscal, usuario) => {
  const novoDocumentoFiscal = new DocumentoFiscal({
    ...documentoFiscal,
    status: "aberto",
  });

  await novoDocumentoFiscal.save();

  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: novoDocumentoFiscal,
    idRegistro: novoDocumentoFiscal?._id,
    usuario,
  });
};

const criarNovoMotivoRecusa = async ({ motivoRecusa, usuario }) => {
  if (!motivoRecusa || motivoRecusa.trim() === "") return;

  const trimmedMotivoRecusa = motivoRecusa.trim();

  try {
    const updatedMotivoRecusa = await Lista.findOneAndUpdate(
      {
        codigo: "motivo-recusa",
        "valores.valor": { $ne: trimmedMotivoRecusa },
      },
      {
        $push: { valores: { valor: trimmedMotivoRecusa } },
      },
      { upsert: true, new: true }
    );

    registrarAcao({
      acao: ACOES.ADICIONADO,
      entidade: ENTIDADES.CONFIGURACAO_LISTA_MOTIVO_RECUSA,
      origem: ORIGENS.IMPORTACAO,
      dadosAtualizados: updatedMotivoRecusa,
      idRegistro: updatedMotivoRecusa?._id,
      usuario,
    });
  } catch (error) {
    console.error("Erro ao adicionar nova motivo recusa:", error);
  }
};

const processarJsonDocumentosFiscais = async ({ json, usuario }) => {
  const detalhes = {
    totalDeLinhasLidas: json.length - 1,
    linhasLidasComErro: 0,
    novosPrestadores: 0,
    novosDocumentosFiscais: 0,
    errors: "",
  };

  const arquivoDeErro = [];

  for (const [i, row] of json.entries()) {
    try {
      if (i === 0) {
        arquivoDeErro.push(row);
        continue;
      }

      const documentoFiscal = await converterLinhaEmDocumentoFiscal({ row });

      let prestador = await buscarPrestadorPorDocumento({
        documento: documentoFiscal?.prestador?.documento,
      });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          documento: documentoFiscal?.prestador?.documento,
          nome: documentoFiscal?.prestador?.nome,
          tipo: documentoFiscal?.prestador?.tipo,
          usuario,
        });

        detalhes.novosPrestadores += 1;
      }

      await criarNovoMotivoRecusa({
        motivoRecusa: documentoFiscal?.motivoRecusa,
        usuario,
      });

      await criarNovoDocumentoFiscal(
        {
          ...documentoFiscal,
          prestador: prestador?._id,
        },
        usuario
      );

      detalhes.novosDocumentosFiscais += 1;
    } catch (error) {
      console.log("ERROR", error);
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [PRESTADOR: ${row[0]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarDocumentoFiscal = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "documento-fiscal",
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

    const { detalhes, arquivoDeErro } = await processarJsonDocumentosFiscais({
      json,
      usuario: req.usuario,
    });

    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;

    await importacao.save();
  } catch (error) {
    console.log("Error", error);

    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro ao importar arquivo",
      error: error.message,
    });
  }
};
