const express = require("express");
const router = express.Router();
const { ListaOmieController } = require("../controllers/listaOmieController");

const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.post("/", ListaOmieController.create);
router.get("/", ListaOmieController.listAll);
router.get("/:codigo", ListaOmieController.getListaPorCodigo);
router.delete("/:id", ListaOmieController.deleteLista);
router.put("/:id", ListaOmieController.update);

router.put(
  "/sync-omie/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.CONFIGURACAO_LISTA_OMIE,
  }),
  ListaOmieController.syncOmie
);

module.exports = router;
