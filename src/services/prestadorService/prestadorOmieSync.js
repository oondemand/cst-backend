const clienteService = require("../../services/omie/clienteService");
const BaseOmie = require("../../models/BaseOmie");
const { mapPrestadorToOmie } = require("./prestadorOmieExporter");

exports.prestadorOmieSync = async (prestador) => {
  try {
    const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });
    let fornecedor = await clienteService.pesquisarPorCNPJ(
      appKey,
      appSecret,
      prestador.documento
    );
    if (!fornecedor) {
      fornecedor = await clienteService.pesquisarCodIntegracao(
        appKey,
        appSecret,
        prestador._id
      );
    }
    
    // Mapeia o objeto Prestador para o formato do Omie
    const cliente = clienteService.criarFornecedor(
      mapPrestadorToOmie(prestador)
    );
    
    if (fornecedor) {
      cliente.codigo_cliente_integracao = fornecedor.codigo_cliente_integracao;
      cliente.codigo_cliente_omie = fornecedor.codigo_cliente_omie;
      const fornecedorCadastrado = await clienteService.update(
        appKey,
        appSecret,
        cliente
      );
      fornecedor = fornecedorCadastrado;
    } else {
      cliente.codigo_cliente_integracao = prestador._id;
      const fornecedorCadastrado = await clienteService.incluir(
        appKey,
        appSecret,
        cliente
      );
      fornecedor = fornecedorCadastrado;
    }
    return prestador;
  } catch (error) {
    console.log("Erro ao sincronizar prestador com omie:", error);
    throw error;
  }
};