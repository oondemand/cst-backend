const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const Usuario = require("../../models/Usuario.js");
const Servico = require("../../models/Servico.js");

const {
  arrayToExcelBuffer,
  arredondarValor,
  excelToJson,
} = require("../../utils/excel.js");

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

const criarNovoPrestador = async ({ nome, tipo, documento }) => {
  const prestador = new Prestador({
    nome,
    tipo,
    documento,
    status: "ativo",
  });

  await prestador.save();
  return prestador;
};

const criarNovoServico = async (servico) => {
  const novoServico = new Servico({
    ...servico,
    status: "aberto",
  });

  await novoServico.save();
};

const processarJsonServicos = async ({ json }) => {
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
        prestador = await criarNovoPrestador({
          documento: servico?.prestador?.documento,
          nome: servico?.prestador?.nome,
          tipo: servico?.prestador?.tipo,
        });

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
        await criarNovoServico({ ...servico, prestador: prestador?._id });
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

    if (arquivo && importacao) res.status(200).json(importacao);

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonServicos({ json });

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
