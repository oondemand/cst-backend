const express = require("express");
const router = express.Router();
const { ListaOmieController } = require("../controllers/listaOmie/index");

router.post("/", ListaOmieController.create);
router.get("/", ListaOmieController.listAll);
router.get("/:codigo", ListaOmieController.getListaPorCodigo);
router.delete("/:id", ListaOmieController.deleteLista);
router.put("/:id", ListaOmieController.update);
router.put("/sync-omie/:id", ListaOmieController.syncOmie);

module.exports = router;
