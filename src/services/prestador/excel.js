const { excelToJson, arrayToExcelBuffer } = require("../../utils/excel");
const prestadorBusiness = require("./business");
const { LISTA_PAISES_OMIE } = require("../../utils/omie");

exports.processJsonPrestadores = async ({ json, usuario }) => {
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
      if (i === 0) { arquivoDeErro.push(row); continue; }
      const prestadorObj = await prestadorBusiness.converterLinhaEmPrestador({ row, LISTA_PAISES_OMIE });
      // Tenta atualizar se existir ou cria se não existir
      let prestador = await prestadorBusiness.buscarPrestadorPorDocumentoEAtualizar({
        documento: prestadorObj?.documento,
        prestador: prestadorObj,
        usuario,
        PrestadorModel: require("../../models/Prestador"),
        UsuarioModel: require("../../models/Usuario")
      });
      await prestadorBusiness.criarNovoManager({ manager: prestadorObj?.manager, usuario });
      if (!prestador) {
        prestador = await prestadorBusiness.criarNovoPrestador({
          prestador: prestadorObj,
          usuario,
          PrestadorModel: require("../../models/Prestador")
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

exports.getBufferFromArray = (array) => arrayToExcelBuffer({ array });
