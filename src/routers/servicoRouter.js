const express = require("express");
const router = express.Router();
const { uploadExcel } = require("../config/multer");
const servicoController = require("../controllers/servicoController");
const {
  importarServico,
} = require("../controllers/servicoController/importacao");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

router.get("/", servicoController.listarServicos);

router.get(
  "/prestador/:prestadorId",
  servicoController.listarServicoPorPrestador
);

router.get("/:id", servicoController.getServicoById);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.EXCLUIDO,
    entidade: ENTIDADES.SERVICO,
  }),
  servicoController.excluirServico
);

router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.SERVICO,
  }),
  servicoController.createServico
);

router.patch(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.SERVICO,
  }),
  servicoController.updateServico
);

router.patch("/", servicoController.atualizarStatus);
router.post("/importar", uploadExcel.array("file"), importarServico);

module.exports = router;
