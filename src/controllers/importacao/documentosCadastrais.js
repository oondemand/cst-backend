const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const DocumentoCadastral = require("../../models/DocumentoCadastral.js");
const Lista = require("../../models/Lista.js");
const { arrayToExcelBuffer, excelToJson } = require("../../utils/excel.js");

const converterLinhaEmDocumentoCadastral = async ({ row }) => {
  const documentoCadastral = {
    prestador: {
      nome: row[0],
      sid: row[1],
      documento: row[2],
    },
    tipoDocumento: row[3],
    numero: row[4],
    descricao: row[5],
    motivoRecusa: row[6],
    observacaoPrestador: row[7],
    observacao: row[8],
  };

  return documentoCadastral;
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

const criarNovoDocumentoCadastral = async (documentoCadastral) => {
  const novoDocumentoCadastral = new DocumentoCadastral({
    ...documentoCadastral,
    status: "aberto",
  });

  await novoDocumentoCadastral.save();
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

const processarJsonDocumentosCadastrais = async ({ json }) => {
  const detalhes = {
    totalDeLinhasLidas: json.length - 1,
    linhasLidasComErro: 0,
    novosPrestadores: 0,
    novosDocumentosCadastrais: 0,
    errors: "",
  };

  const arquivoDeErro = [];

  for (const [i, row] of json.entries()) {
    try {
      if (i === 0) {
        arquivoDeErro.push(row);
        continue;
      }

      const documentoCadastral = await converterLinhaEmDocumentoCadastral({
        row,
      });

      let prestador = await buscarPrestadorPorSid({
        sid: documentoCadastral?.prestador?.sid,
      });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          sid: documentoCadastral?.prestador?.sid,
          documento: documentoCadastral?.prestador?.documento,
          nome: documentoCadastral?.prestador?.nome,
          tipo: documentoCadastral?.prestador?.tipo,
        });

        detalhes.novosPrestadores += 1;
      }

      await criarNovoMotivoRecusa({
        motivoRecusa: documentoCadastral?.motivoRecusa,
      });

      await criarNovoDocumentoCadastral({
        ...documentoCadastral,
        prestador: prestador?._id,
      });
      detalhes.novosDocumentosCadastrais += 1;
    } catch (error) {
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [SID: ${row[1]} - PRESTADOR: ${row[0]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarDocumentoCadastral = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "documento-cadastral",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });

    await importacao.save();

    if (arquivo && importacao) res.status(200).json(importacao);

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonDocumentosCadastrais(
      { json }
    );

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
