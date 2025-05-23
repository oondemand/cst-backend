const express = require("express");
const router = express.Router();
const assistenteController = require("../controllers/assistenteController");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.CONFIGURACAO_ASSISTENTE,
  }),
  assistenteController.criarAssistente
);
router.get("/", assistenteController.listarAssistentes);
router.get("/ativos", assistenteController.listarAssistentesAtivos);
router.get("/:id", assistenteController.obterAssistente);

router.put(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.CONFIGURACAO_ASSISTENTE,
  }),
  assistenteController.atualizarAssistente
);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.EXCLUIDO,
    entidade: ENTIDADES.CONFIGURACAO_ASSISTENTE,
  }),
  assistenteController.excluirAssistente
);

module.exports = router;
