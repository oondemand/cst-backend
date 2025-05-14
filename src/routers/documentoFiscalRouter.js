const express = require("express");
const documentoFiscalController = require("../controllers/documentoFiscal/index");
const router = express.Router();

const multer = require("multer");
const path = require("node:path");

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

router.delete("/:id", documentoFiscalController.excluirDocumentoFiscal);

router.post("/", documentoFiscalController.createDocumentoFiscal);

router.post(
  "/usuario-prestador",
  upload.single("file"),
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

router.patch("/:id", documentoFiscalController.updateDocumentoFiscal);
router.post("/aprovar-documento", documentoFiscalController.aprovarDocumento);

module.exports = router;
