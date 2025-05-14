const express = require("express");
const servicoController = require("../controllers/servicoController");
const router = express.Router();

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

module.exports = router;
