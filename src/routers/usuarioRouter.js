const express = require("express");
const usuarioController = require("../controllers/usuarioController");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");
const router = express.Router();

router.get("/", usuarioController.listarUsuarios);
router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.CONFIGURACAO_USUARIO,
  }),
  usuarioController.registrarUsuario
);
router.get("/:id", usuarioController.obterUsuario);

router.put(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.CONFIGURACAO_USUARIO,
  }),
  usuarioController.atualizarUsuario
);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.EXCLUIDO,
    entidade: ENTIDADES.CONFIGURACAO_USUARIO,
  }),
  usuarioController.excluirUsuario
);

router.post(
  "/esqueci-minha-senha",
  registrarAcaoMiddleware({
    acao: ACOES.CONVITE_ENVIADO,
    entidade: ENTIDADES.CONFIGURACAO_USUARIO,
  }),
  usuarioController.esqueciMinhaSenha
);

router.post(
  "/enviar-convite",
  registrarAcaoMiddleware({
    acao: ACOES.CONVITE_ENVIADO,
    entidade: ENTIDADES.PRESTADOR,
  }),
  usuarioController.enviarConvite
);

module.exports = router;
