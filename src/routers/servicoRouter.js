const express = require("express");
const router = express.Router();
const { uploadExcel } = require("../config/multer");
const servicoController = require("../controllers/servicoController");
const {
  importarServico,
} = require("../controllers/servicoController/importacao");

router.get("/", servicoController.listarServicos);

router.get(
  "/prestador/:prestadorId",
  servicoController.listarServicoPorPrestador
);

router.get("/:id", servicoController.getServicoById);
router.delete("/:id", servicoController.excluirServico);

router.post("/", servicoController.createServico);

router.patch("/:id", servicoController.updateServico);
router.patch("/", servicoController.atualizarStatus);

router.post("/importar", uploadExcel.array("file"), importarServico);

module.exports = router;
