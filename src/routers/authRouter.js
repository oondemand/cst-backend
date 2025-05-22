const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.post("/login", usuarioController.loginUsuario);
router.post("/seed-usuario", usuarioController.seedUsuario);
router.get("/validar-token", authMiddleware, usuarioController.validarToken);

router.post("/esqueci-minha-senha", usuarioController.esqueciMinhaSenha);

router.post("/alterar-senha", usuarioController.alterarSenha);
module.exports = router;
