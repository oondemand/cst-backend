const Usuario = require("../models/Usuario");
const Prestador = require("../models/Prestador");

const bcrypt = require("bcryptjs");
const emailUtils = require("../utils/emailUtils");
const jwt = require("jsonwebtoken");

const filtersUtils = require("../utils/filter");
const {
  sendErrorResponse,
  sendResponse,
  sendPaginatedResponse,
} = require("../utils/helpers");
const { registrarAcao } = require("../services/controleService");
const { ACOES, ENTIDADES, ORIGENS } = require("../constants/controleAlteracao");

exports.seedUsuario = async (req, res) => {
  const { nome, email, senha, status, permissoes } = req.body;
  try {
    const usuarioAtivo = await Usuario.findOne({ status: "ativo" });

    if (usuarioAtivo) {
      return sendErrorResponse({
        res,
        statusCode: 400,
        message: "Já existe um usuário ativo no sistema",
      });
    }

    const usuario = new Usuario({ nome, email, senha, status, permissoes });
    await usuario.save();

    sendResponse({ res, statusCode: 201, usuario });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao registrar usuário",
      error: error.message,
    });
  }
};

exports.registrarUsuario = async (req, res) => {
  const { nome, email, senha, status, permissoes, tipo, prestadorId } =
    req.body;
  try {
    const novoUsuario = new Usuario({
      nome,
      email,
      senha,
      status,
      permissoes,
      tipo,
    });

    if (tipo && tipo === "prestador") {
      const prestador = await Prestador.findOne({ _id: prestadorId });
      prestador.email = email;
      prestador.usuario = novoUsuario._id;
      await prestador.save();
    }

    await novoUsuario.save();
    sendResponse({ res, statusCode: 201, usuario: novoUsuario });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao registrar usuário",
      error: error.message,
    });
  }
};

exports.loginUsuario = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    if (usuario.status === "arquivado")
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    if (!(await bcrypt.compare(senha, usuario.senha)))
      return sendErrorResponse({
        res,
        statusCode: 401,
        message: "Credenciais inválidas",
      });

    if (usuario.status === "ativo") {
      const token = usuario.gerarToken();
      sendResponse({
        res,
        statusCode: 200,
        token,
        usuario: {
          _id: usuario._id,
          nome: usuario.nome,
          tipo: usuario.tipo,
          idioma: usuario?.configuracoes?.idioma,
        },
      });
    } else if (usuario.status === "email-nao-confirmado") {
      sendErrorResponse({
        res,
        statusCode: 401,
        message: "E-mail não confirmado",
        status: usuario.status,
      });
    } else {
      const msg = {
        mensagem: "O usuário não está ativo",
        status: usuario.status,
      };
      sendErrorResponse({
        res,
        statusCode: 401,
        message: msg,
      });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao fazer login",
      error: error.message,
    });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
      req.query;

    const schema = Usuario.schema;

    const camposBusca = ["status", "nome", "email", "tipo"];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema,
      camposBusca,
    });

    const queryResult = {
      $and: [
        filterFromFiltros, // Filtros principais
        { tipo: tipo ? tipo : { $ne: "prestador" } },
        {
          $or: [
            searchTermCondition, // Busca textual
          ],
        },
      ],
    };

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    const [usuarios, totalDeUsuarios] = await Promise.all([
      Usuario.find(queryResult).skip(skip).limit(limite),
      Usuario.countDocuments(queryResult),
    ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: usuarios,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeUsuarios / limite),
        totalItems: totalDeUsuarios,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao listar usuários",
      error: error.message,
    });
  }
};

exports.obterUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    sendResponse({ res, statusCode: 200, usuario });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao obter usuário",
      error: error.message,
    });
  }
};

exports.atualizarUsuario = async (req, res) => {
  const { nome, email, status, permissoes, configuracoes, tipo } = req.body;
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nome, email, status, permissoes, configuracoes, tipo },
      { new: true }
    );
    if (!usuario)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    sendResponse({ res, statusCode: 200, usuario });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao atualizar usuário",
      error: error.message,
    });
  }
};

exports.excluirUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    sendResponse({ res, statusCode: 204, usuario });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      message: "Erro ao excluir usuário",
      error: error.message,
    });
  }
};

exports.validarToken = async (req, res) => {
  try {
    // Se passou pelo middleware, `req.usuario` já está preenchido
    sendResponse({ res, statusCode: 200, usuario: req.usuario });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 401,
      message: "Token inválido ou expirado",
      error: error.message,
    });
  }
};

exports.esqueciMinhaSenha = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendErrorResponse({
      res,
      statusCode: 404,
      message: "Não foi encontrado um usuário com esse email",
    });
  }

  try {
    const usuario = await Usuario.findOne({ email });

    if (!usuario)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    if (usuario.status === "arquivado")
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Usuário não encontrado",
      });

    if (usuario.status === "ativo") {
      const token = usuario.gerarToken();

      let url = "";

      if (usuario.tipo === "prestador") {
        url = new URL("/recover-password", process.env.BASE_URL_APP_PUBLISHER);
      }

      if (usuario.tipo !== "prestador") {
        url = new URL("/alterar-senha", process.env.BASE_URL_CST);
      }

      url.searchParams.append("code", token);

      await emailUtils.emailEsqueciMinhaSenha({
        usuario,
        url: url.toString(),
      });

      sendResponse({ res, statusCode: 200, usuario, message: "Email enviado" });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 404,
      message: "Usuário não encontrado",
      error: error.message,
    });
  }
};

exports.alterarSenha = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { senhaAtual, novaSenha, confirmacao, code } = req.body;

  if (!token && !code) {
    return sendErrorResponse({
      res,
      statusCode: 401,
      message: "Token inválido ou expirado",
    });
  }

  if (!novaSenha) {
    return sendErrorResponse({
      res,
      statusCode: 404,
      message: "Nova senha é um campo obrigatório",
    });
  }

  if (!confirmacao) {
    return sendErrorResponse({
      res,
      statusCode: 404,
      message: "Confirmação é um compo obrigatório",
    });
  }

  if (novaSenha !== confirmacao) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "A confirmação precisa ser igual a senha.",
    });
  }

  if (code) {
    try {
      const decoded = jwt.verify(code, process.env.JWT_SECRET);
      const usuario = await Usuario.findById(decoded.id);
      usuario.senha = novaSenha;
      await usuario.save();
      return sendResponse({
        res,
        statusCode: 200,
        token: code,
        usuario: {
          _id: usuario._id,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
      });
    } catch (error) {
      return sendErrorResponse({
        res,
        statusCode: 401,
        message: "Token inválido.",
      });
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findById(decoded.id);

      if (!(await bcrypt.compare(senhaAtual, usuario.senha)))
        return sendErrorResponse({
          res,
          statusCode: 401,
          message: "Credenciais inválidas",
        });

      usuario.senha = novaSenha;
      await usuario.save();
      return sendResponse({
        res,
        statusCode: 200,
        token,
        usuario: {
          _id: usuario._id,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
      });
    } catch (error) {
      return sendErrorResponse({
        res,
        statusCode: 401,
        message: "Token inválido.",
      });
    }
  }

  return sendErrorResponse({
    res,
    statusCode: 404,
    message: "Token inválido.",
  });
};

exports.enviarConvite = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.body.prestador);

    if (!prestador) {
      return sendErrorResponse({
        res,
        message: "Prestador não encontrado!",
        statusCode: 409,
      });
    }

    let usuario;

    if (!prestador?.usuario) {
      usuario = new Usuario({
        nome: prestador?.nome,
        email: prestador?.email,
        status: "ativo",
        tipo: "prestador",
        senha: "123456",
      });

      await usuario.save();

      prestador.usuario = usuario?._id;
      await prestador.save();
    }

    usuario = await Usuario.findById(prestador?.usuario);
    const token = usuario.gerarToken();

    const url = new URL("/first-login", process.env.BASE_URL_APP_PUBLISHER);
    url.searchParams.append("code", token);

    //mostra url para não ter que verificar no email
    console.log("🟨 [CONVITE ENVIADO] URL: ", url.toString());

    if (usuario.tipo && usuario.tipo === "prestador") {
      await emailUtils.emailLinkCadastroUsuarioPrestador({
        email: usuario?.email,
        nome: usuario?.nome,
        url,
      });
    }

    sendResponse({ res, statusCode: 200, _id: prestador._id });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      message: "Ouve um erro inesperado ao enviar convite!",
      statusCode: "400",
    });
  }
};
