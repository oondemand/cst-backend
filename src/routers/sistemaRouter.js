const express = require("express");
const {
  listarSistemaConfig,
  atualizarSistemaConfig,
  testeEmail,
  listarCategoriasOmie,
  listarContaCorrente,
} = require("../controllers/sistemaController");
const router = express.Router();
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.get("/", listarSistemaConfig);
router.put(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.CONFIGURACAO_SISTEMA,
  }),
  atualizarSistemaConfig
);
router.post("/teste-email", testeEmail);
router.get("/listar-categorias", listarCategoriasOmie);
router.get("/listar-conta-corrente", listarContaCorrente);

module.exports = router;
