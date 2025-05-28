const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const { parse } = require("date-fns");
const { arrayToExcelBuffer, excelToJson } = require("../../utils/excel.js");
const { mapRowToPrestador } = require("../../services/prestadorService/prestadorExcelMapper.js");
const { registrarAcao } = require("../../services/controleService");
const {
  ACOES,
  ENTIDADES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

const { sendErrorResponse, sendResponse } = require("../../utils/helpers");
const {
  createPrestador,
  updatePrestador,
} = require("../../services/prestadorService/prestadorCrudService");
const {
  validateCreatePrestador,
  validateUpdatePrestador,
} = require("../../services/prestadorService/prestadorBusinessService");

const criarNovoPrestador = async ({ prestador, usuario }) => {
  // Use business service to validate
  await validateCreatePrestador(prestador);
  // Create and persist using CRUD service, adding status ativo
  const novoPrestador = await createPrestador({ ...prestador, status: "ativo" });
  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: novoPrestador,
    idRegistro: novoPrestador._id,
    usuario: usuario,
  });
  return novoPrestador;
};

const buscarPrestadorPorDocumentoEAtualizar = async ({
  documento,
  prestador,
  usuario,
}) => {
  if (!documento || !prestador) return null;

  const prestadorExistente = await Prestador.findOne({ documento });
  if (!prestadorExistente) return null;

  // Use business service to validate update: pass the existing id with new data
  await validateUpdatePrestador(prestadorExistente._id, prestador);

  // Update via CRUD service
  const prestadorAtualizado = await updatePrestador(prestadorExistente._id, prestador);
  registrarAcao({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: prestadorAtualizado,
    idRegistro: prestadorAtualizado._id,
    usuario: usuario,
  });
  return prestadorAtualizado;
};

const processarJsonPrestadores = async ({ json, usuario }) => {
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
      // Utiliza o prestadorExcelMapper para mapear a linha
      const prestadorObj = await mapRowToPrestador(row);

      let prestador = await buscarPrestadorPorDocumentoEAtualizar({
        documento: prestadorObj?.documento,
        prestador: prestadorObj,
        usuario,
      });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          prestador: prestadorObj,
          usuario,
        });
        detalhes.novosPrestadores += 1;
      }
    } catch (error) {
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [PRESTADOR: ${row[2]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarPrestador = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "prestador",
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

    const { detalhes, arquivoDeErro } = await processarJsonPrestadores({
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
