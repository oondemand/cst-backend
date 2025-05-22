const express = require("express");
const documentoFiscalController = require("../controllers/documentoFiscalController");
const {
  importarDocumentoFiscal,
} = require("../controllers/documentoFiscalController/importacao");
const router = express.Router();

const multer = require("multer");
const { uploadExcel } = require("../config/multer");
const path = require("node:path");
const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

const storage = multer.memoryStorage({});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Tipo de arquivo não suportado"));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 },
});

router.get("/", documentoFiscalController.listarDocumentoFiscal);

router.get(
  "/prestador/:prestadorId",
  documentoFiscalController.listarDocumentoFiscalPorPrestador
);

router.get(
  "/prestador",
  documentoFiscalController.listarDocumentoFiscalPorUsuarioPrestador
);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.EXCLUIDO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
  }),
  documentoFiscalController.excluirDocumentoFiscal
);

router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
  }),
  documentoFiscalController.createDocumentoFiscal
);

router.post(
  "/usuario-prestador",
  upload.single("file"),
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
  }),
  documentoFiscalController.criarDocumentoFiscalPorUsuarioPrestador
);

router.post(
  "/anexar-arquivo/:documentoFiscalId",
  upload.single("file"),
  documentoFiscalController.anexarArquivo
);

router.delete(
  "/excluir-arquivo/:documentoFiscalId/:id",
  documentoFiscalController.excluirArquivo
);

router.patch(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
  }),
  documentoFiscalController.updateDocumentoFiscal
);

router.post(
  "/aprovar-documento",
  registrarAcaoMiddleware({
    acao: ACOES.APROVADO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
  }),
  documentoFiscalController.aprovarDocumento
);

router.post(
  "/reprovar-documento/:id",
  registrarAcaoMiddleware({
    acao: ACOES.REPROVADO,
    entidade: ENTIDADES.DOCUMENTO_FISCAL,
  }),
  documentoFiscalController.reprovarDocumento
);

router.post("/importar", uploadExcel.array("file"), importarDocumentoFiscal);

module.exports = router;
