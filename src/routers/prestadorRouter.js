const express = require("express");
const prestadorController = require("../controllers/prestadorController");
const {
  importarPrestador,
} = require("../controllers/prestadorController/importacao");
const { uploadExcel } = require("../config/multer");
const router = express.Router();

const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES, ORIGENS } = require("../constants/controleAlteracao");

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

router.patch(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.FORM,
  }),
  prestadorController.atualizarPrestador
);

router.delete("/:id", prestadorController.excluirPrestador);

router.post("/importar", uploadExcel.array("file"), importarPrestador);

module.exports = router;
