const express = require("express");
const router = express.Router();
const aprovacaoController = require("../controllers/aprovacaoController");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.post(
  "/:ticketId/aprovar",
  registrarAcaoMiddleware({
    acao: ACOES.APROVADO,
    entidade: ENTIDADES.TICKET,
  }),
  aprovacaoController.aprovar
);

router.post(
  "/:ticketId/recusar",
  registrarAcaoMiddleware({
    acao: ACOES.REPROVADO,
    entidade: ENTIDADES.TICKET,
  }),
  aprovacaoController.recusar
);

module.exports = router;
