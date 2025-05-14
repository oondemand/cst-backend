const express = require("express");
const router = express.Router();
const multer = require("multer");
const { importarServico } = require("../controllers/importacao/servico");
const { importarPrestador } = require("../controllers/importacao/prestador");
const {
  importarDocumentoFiscal,
} = require("../controllers/importacao/documentosFiscais");
const {
  importarDocumentoCadastral,
} = require("../controllers/importacao/documentosCadastrais");

const inMemoryStorage = multer.memoryStorage({});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.binary.macroenabled.12",
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado"), false);
  }
};

const upload = multer({
  storage: inMemoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limite de 10MB
});

router.post("/importar-servicos", upload.array("file"), importarServico);
router.post("/importar-prestadores", upload.array("file"), importarPrestador);

router.post(
  "/importar-documentos-fiscais",
  upload.array("file"),
  importarDocumentoFiscal
);

router.post(
  "/importar-documentos-cadastrais",
  upload.array("file"),
  importarDocumentoCadastral
);

module.exports = router;
