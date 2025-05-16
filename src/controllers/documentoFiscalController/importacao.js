const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const DocumentoFiscal = require("../../models/DocumentoFiscal.js");
const Lista = require("../../models/Lista.js");

const {
  arrayToExcelBuffer,
  arredondarValor,
  excelToJson,
} = require("../../utils/excel.js");

const converterLinhaEmDocumentoFiscal = async ({ row }) => {
  const competencia = row[5];

  const documentoFiscal = {
    prestador: {
      nome: row[0],
      sid: row[1],
      documento: row[2],
    },
    tipoDocumentoFiscal: row[3],
    numero: row[4],
    competencia: {
      mes: competencia && competencia.getMonth() + 1,
      ano: competencia && competencia.getFullYear(),
    },

    valor: arredondarValor(row[6]),
    imposto: arredondarValor(row[7]),
    classificacaoFiscal: row[8],
    descricao: row[9],
    motivoRecusa: row[10],
    observacaoPrestador: row[11],
    observacao: row[12],
  };

  return documentoFiscal;
};

const buscarPrestadorPorSid = async ({ sid }) => {
  if (!sid) return null;
  return await Prestador.findOne({ sid });
};

const criarNovoPrestador = async ({ sid, nome, tipo, documento }) => {
  const prestador = new Prestador({
    sid,
    nome,
    tipo: tipo ? tipo : "",
    documento,
    status: "ativo",
  });

  await prestador.save();
  return prestador;
};

const criarNovoDocumentoFiscal = async (documentoFiscal) => {
  const novoDocumentoFiscal = new DocumentoFiscal({
    ...documentoFiscal,
    status: "aberto",
  });

  await novoDocumentoFiscal.save();
};

const criarNovoMotivoRecusa = async ({ motivoRecusa }) => {
  if (!motivoRecusa || motivoRecusa.trim() === "") return;

  const trimmedMotivoRecusa = motivoRecusa.trim();

  try {
    await Lista.findOneAndUpdate(
      {
        codigo: "motivo-recusa",
        "valores.valor": { $ne: trimmedMotivoRecusa },
      },
      {
        $push: { valores: { valor: trimmedMotivoRecusa } },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Erro ao adicionar nova motivo recusa:", error);
  }
};

const processarJsonDocumentosFiscais = async ({ json }) => {
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

      let prestador = await buscarPrestadorPorSid({
        sid: documentoFiscal?.prestador?.sid,
      });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          sid: documentoFiscal?.prestador?.sid,
          documento: documentoFiscal?.prestador?.documento,
          nome: documentoFiscal?.prestador?.nome,
          tipo: documentoFiscal?.prestador?.tipo,
        });

        detalhes.novosPrestadores += 1;
      }

      await criarNovoMotivoRecusa({
        motivoRecusa: documentoFiscal?.motivoRecusa,
      });

      await criarNovoDocumentoFiscal({
        ...documentoFiscal,
        prestador: prestador?._id,
      });
      detalhes.novosDocumentosFiscais += 1;
    } catch (error) {
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [SID: ${row[1]} - PRESTADOR: ${row[0]}] - \nDETALHES DO ERRO: ${error}\n\n`;
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

    if (arquivo && importacao) res.status(200).json(importacao);

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonDocumentosFiscais({
      json,
    });

    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;

    await importacao.save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ouve um erro ao importar arquivo" });
  }
};
