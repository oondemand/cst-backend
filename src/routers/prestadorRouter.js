const express = require("express");
const prestadorController = require("../controllers/prestadorController");
const {
  importarPrestador,
} = require("../controllers/prestadorController/importacao");
const { uploadExcel } = require("../config/multer");
const router = express.Router();

router.post("/", prestadorController.criarPrestador);

router.get(
  "/usuario/:idUsuario",
  prestadorController.obterPrestadorPorIdUsuario
);

router.get(
  "/documento/:documento",
  prestadorController.obterPrestadorPorDocumento
);

router.get("/email/:email", prestadorController.obterPrestadorPorEmail);
router.get("/pis/:pis", prestadorController.obterPrestadorPorPis);

router.get("/", prestadorController.listarPrestadores);
router.get("/:id", prestadorController.obterPrestador);

router.patch("/:id", prestadorController.atualizarPrestador);

router.delete("/:id", prestadorController.excluirPrestador);
router.post("/importar", uploadExcel.array("file"), importarPrestador);

module.exports = router;
