const express = require("express");
const router = express.Router();
const etapaController = require("../controllers/etapaController");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.CONFIGURACAO_ETAPA,
  }),
  etapaController.criarEtapa
);
router.get("/ativas", etapaController.listarEtapasAtivas);
router.get("/", etapaController.listarEtapas);
router.get("/:id", etapaController.obterEtapa);

router.put(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.CONFIGURACAO_ETAPA,
  }),
  etapaController.atualizarEtapa
);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.EXCLUIDO,
    entidade: ENTIDADES.CONFIGURACAO_ETAPA,
  }),
  etapaController.excluirEtapa
);

module.exports = router;
