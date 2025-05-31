const Importacao = require("../../models/Importacao");
const { sendErrorResponse, sendResponse } = require("../../utils/helpers");
const { excelToJson, arrayToExcelBuffer } = require("../../utils/excel");
const prestadorExcel = require("../../services/prestador/excel");

exports.importarPrestador = async (req, res) => {
  try {
    const arquivo = req.files[0];
    const importacao = new Importacao({
      tipo: "prestador",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });
    await importacao.save();

    sendResponse({ res, statusCode: 200, importacao });

    const json = excelToJson({ arquivo });
    const { detalhes, arquivoDeErro } = await prestadorExcel.processJsonPrestadores(
      { json, usuario: req.usuario }
    );
    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;
    await importacao.save();
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro ao importar arquivo",
      error,
    });
  }
};
