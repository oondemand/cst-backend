const express = require("express");
const router = express.Router();
const { ListaOmieController } = require("../controllers/listaOmie/index");

router.post("/", ListaOmieController.create);
router.get("/", ListaOmieController.listAll);
router.get("/:codigo", ListaOmieController.getListaPorCodigo);
router.delete("/:id", ListaOmieController.deleteLista);
router.put("/:id", ListaOmieController.update);

module.exports = router;
