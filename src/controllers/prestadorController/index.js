const Prestador = require("../../models/Prestador");
const Ticket = require("../../models/Ticket");
const {
  sincronizarPrestador,
} = require("../../services/omie/sincronizarPrestador");
const filtersUtils = require("../../utils/filter");
const Usuario = require("../../models/Usuario");
const { registrarAcao } = require("../../services/controleService");
const {
  ACOES,
  ENTIDADES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

const {
  sendPaginatedResponse,
  sendResponse,
  sendErrorResponse,
} = require("../../utils/helpers");

exports.obterPrestadorPorIdUsuario = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      usuario: req.params.idUsuario,
    });

    if (!prestador) {
      return sendErrorResponse({
        res,
        message: "Prestador não encontrado!",
        statusCode: 404,
      });
    }

    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      message: "Um erro inesperado aconteceu ao obter prestador!",
      statusCode: 400,
    });
  }
};

exports.criarPrestador = async (req, res) => {
  try {
    const { email, ...rest } = req.body;
    const data = email === "" ? rest : req.body;

    if (req.body?.documento) {
      const prestador = await Prestador.findOne({
        documento: req.body.documento,
      });

      if (prestador) {
        return sendErrorResponse({
          res,
          message: "Já existe um prestador com esse documento registrado!",
          statusCode: 409,
        });
      }
    }

    const prestador = new Prestador(data);
    await prestador.save();

    sendResponse({
      res,
      statusCode: 200,
      prestador,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      statusCode: 500,
      message: "Ouve um erro inesperado ao criar prestador!",
    });
  }
};

exports.listarPrestadores = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const schema = Prestador.schema;

    const camposBusca = [
      // "manager",
      "nome",
      "documento",
      "dadosBancariosSchema.agencia",
      "dadosBancariosSchema.conta",
      "email",
      "cep",
      "enderecoSchema.rua",
      "enderecoSchema.numero",
      "enderecoSchema.complemento",
      "enderecoSchema.cidade",
      "pessoaFisica.dataNascimento",
      "pessoaFisica.pis",
      "pessoaJuridica.nomeFantasia",
      "createdAt",
      "updatedAt",
    ];

    const queryResult = filtersUtils.buildQuery({
      filtros: rest,
      searchTerm,
      schema,
      camposBusca,
    });

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limit = parseInt(pageSize) || 10;

    const prestadores = await Prestador.find(queryResult)
      .sort(sorting)
      .skip(page * limit)
      .limit(limit);

    const totalDePrestadores = await Prestador.countDocuments(queryResult);

    const totalPages = Math.ceil(totalDePrestadores / limit);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      message: "OK",
      results: prestadores,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalDePrestadores,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      message: "Ouve um erro inesperado ao listar prestadores.",
      statusCode: 400,
    });
  }
};

exports.obterPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id);
    if (!prestador) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });
    }

    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      message: "Ouve um erro inesperado ao obter prestador",
      statusCode: 400,
    });
  }
};

exports.atualizarPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id);

    if (!prestador) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });
    }

    if (req.body.documento) {
      const prestadorDocumento = await Prestador.findOne({
        documento: req.body.documento,
      });

      if (
        prestadorDocumento &&
        prestador._id.toString() !== prestadorDocumento._id.toString()
      ) {
        return sendErrorResponse({
          res,
          statusCode: 409,
          message: "Já existe um prestador com esse documento registrado",
        });
      }
    }

    if (req?.body?.email) {
      const prestadorEmail = await Prestador.findOne({
        email: req.body.email,
      });

      if (
        prestadorEmail &&
        prestadorEmail?._id?.toString() !== prestador._id.toString()
      ) {
        return sendErrorResponse({
          res,
          statusCode: 409,
          message: "Já existe um prestador com esse email registrado",
        });
      }

      if (prestador?.usuario) {
        const usuario = await Usuario.findOne({ email: req.body.email });

        if (usuario) {
          if (usuario?._id?.toString() !== prestador.usuario.toString()) {
            return sendErrorResponse({
              res,
              statusCode: 409,
              message:
                "Já existe um usuário prestador com esse email registrado",
            });
          }

          usuario.email = req.body.email;
          await usuario.save();
        }
      }
    }

    const prestadorAtualizado = await Prestador.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    sincronizarPrestador({
      id: prestadorAtualizado._id,
      prestador: prestadorAtualizado,
    });

    sendResponse({
      res,
      statusCode: 200,
      prestador: prestadorAtualizado,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error: error.message,
      statusCode: 500,
      message: "Ouve um erro inesperado ao atualizar prestador!",
    });
  }
};

exports.excluirPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findByIdAndDelete(req.params.id);

    if (prestador?.usuario) {
      await Usuario.findByIdAndDelete(prestador?.usuario);
    }

    if (!prestador)
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });

    sendResponse({
      res,
      statusCode: 200,
      prestador,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 400,
      error: error.message,
      message: "Ouve um erro ao inesperado ao excluir prestador",
    });
  }
};

exports.obterPrestadorPorDocumento = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      documento: req.params.documento,
    });
    if (!prestador) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });
    }

    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      error: error.message,
      message: "Ouve um erro inesperado ao obter prestador",
    });
  }
};

exports.obterPrestadorPorEmail = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      email: req.params.email,
    });
    if (!prestador) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });
    }

    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao obter prestador por email",
      error: error.message,
    });
  }
};

exports.obterPrestadorPorPis = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      "pessoaFisica.pis": req.params.pis,
    });

    if (!prestador) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Prestador não encontrado",
      });
    }

    sendResponse({ res, statusCode: 200, prestador });
  } catch (error) {
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao obter prestador por pis",
      error: error.message,
    });
  }
};

exports.prestadorWebHook = async (req, res) => {
  try {
    const { event, ping, topic } = req.body;
    if (ping === "omie") {
      return sendResponse({
        res,
        statusCode: 200,
        message: "pong",
      });
    }

    if (topic === "ClienteFornecedor.Alterado") {
      console.log("🟩 Webhook recebido alterando prestador");

      const documento = event?.cnpj_cpf
        ? Number(event.cnpj_cpf.replaceAll(".", "").replaceAll("-", ""))
        : null;

      const prestadorOmie = {
        nome: event.razao_social,
        tipo:
          event?.pessoa_fisica === "S"
            ? "pf"
            : event?.pessoa_fisica === "pf"
              ? "pf"
              : "ext",
        documento,
        dadosBancarios: {
          banco: event?.dadosBancarios?.codigo_banco ?? "",
          agencia: event?.dadosBancarios?.agencia ?? "",
          conta: event?.dadosBancarios?.conta_corrente ?? "",
        },
        email: event?.email ?? "",
        endereco: {
          cep: event?.cep ?? "",
          rua: event?.endereco ?? "",
          numero: event?.endereco_numero ? Number(event?.endereco_numero) : "",
          complemento: event?.complemento ?? complemento,
          cidade: event?.cidade ?? "",
          estado: event?.estado ?? "",
        },
      };

      const prestador = await Prestador.findOne({
        $or: [{ documento }, { email: event?.email }],
      });

      if (documento) {
        const prestadorDocumento = await Prestador.findOne({
          documento: documento,
        });

        if (
          prestadorDocumento &&
          prestador._id.toString() !== prestadorDocumento._id.toString()
        ) {
          return sendErrorResponse({
            res,
            statusCode: 409,
            message: "Já existe um prestador com esse documento registrado",
          });
        }
      }

      if (prestadorOmie?.email) {
        const prestadorEmail = await Prestador.findOne({
          email: prestadorOmie?.email,
        });

        if (
          prestadorEmail &&
          prestadorEmail?._id?.toString() !== prestador._id.toString()
        ) {
          console.log("Já existe um prestador com esse email registrado");
          return sendErrorResponse({
            res,
            statusCode: 409,
            message: "Já existe um prestador com esse email registrado",
          });
        }

        if (prestador?.usuario) {
          const usuario = await Usuario.findOne({
            email: prestadorOmie?.email,
          });

          if (usuario) {
            if (usuario?._id?.toString() !== prestador.usuario.toString()) {
              return sendErrorResponse({
                res,
                statusCode: 409,
                message:
                  "Já existe um usuário prestador com esse email registrado",
              });
            }

            usuario.email = prestadorOmie?.email;
            await usuario.save();
          }
        }
      }

      const prestadorAlterado = await Prestador.findOneAndUpdate(
        {
          $or: [{ documento }, { email: event.email }],
        },
        { ...prestadorOmie }
      );

      registrarAcao({
        acao: ACOES.ALTERADO,
        entidade: ENTIDADES.PRESTADOR,
        origem: ORIGENS.OMIE,
        dadosAtualizados: prestadorAlterado,
        idRegistro: prestadorAlterado._id,
      });
    }

    sendResponse({
      res,
      statusCode: 200,
      message: "Webhook recebido. Dados sendo atualizados.",
    });
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    sendErrorResponse({
      res,
      statusCode: 500,
      message: "Ouve um erro inesperado ao processar o webhook.",
      error: error.message,
    });
  }
};
