const Sistema = require("../../models/Sistema");
const BaseOmie = require("../../models/BaseOmie");

const { emailTeste } = require("../../utils/emailUtils");
const CategoriasService = require("../../services/omie/categoriasService");
const ContaCorrenteService = require("../../services/omie/contaCorrenteService");
const {
  sendErrorResponse,
  sendResponse,
} = require("../../utils/helpers");

exports.listarSistemaConfig = async (req, res) => {
  try {
    const sistema = await Sistema.findOne();

    if (!sistema) {
      return res
        .status(404)
        .json({ mensagem: "Nenhuma configuração encontrada." });
    }

    res.status(200).json(sistema);
  } catch (error) {
    res
      .status(500)
      .json({ mensagem: "Erro ao buscar configurações", erro: error.message });
  }
};

exports.atualizarSistemaConfig = async (req, res) => {
  const id = req.params.id;

  try {
    const sistemaAtualizado = await Sistema.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!sistemaAtualizado) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        mensagem: "Configuração não encontrada.",
      });
    }

    sendResponse({
      res,
      statusCode: 200,
      config: sistemaAtualizado,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      mensagem: "Ouve um erro ao atualizar configuração",
      error: error.message,
    });
  }
};

exports.testeEmail = async (req, res) => {
  try {
    await emailTeste({ email: req.body.email });
    sendResponse({
      res,
      statusCode: 200,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      mensagem: "Ouve um erro ao enviar email",
      error: error.message,
    });
  }
};

exports.listarCategoriasOmie = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne();
    const data = await CategoriasService.listarCategorias({ baseOmie });

    sendResponse({
      res,
      statusCode: 200,
      categorias: data?.categoria_cadastro.filter((e) => e.nao_exibir != "S"),
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      mensagem: "Ouve um erro ao listar categorias",
      error: error.message,
    });
  }
};

exports.listarContaCorrente = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne();
    const data = await ContaCorrenteService.obterContaAdiamentoCliente({
      baseOmie,
    });

    sendResponse({
      res,
      statusCode: 200,
      contas: data?.ListarContasCorrentes,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      mensagem: "Ouve um erro ao listar contas correntes",
      error: error.message,
    });
  }
};
