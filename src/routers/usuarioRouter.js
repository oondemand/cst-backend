const express = require("express");
const usuarioController = require("../controllers/usuarioController");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");
const router = express.Router();

router.get("/", usuarioController.listarUsuarios);
router.post("/", usuarioController.registrarUsuario);
router.get("/:id", usuarioController.obterUsuario);
router.put("/:id", usuarioController.atualizarUsuario);
router.delete("/:id", usuarioController.excluirUsuario);
router.post(
  "/enviar-convite",
  registrarAcaoMiddleware({
    acao: ACOES.CONVITE_ENVIADO,
    entidade: ENTIDADES.PRESTADOR,
  }),
  usuarioController.enviarConvite
);

module.exports = router;
