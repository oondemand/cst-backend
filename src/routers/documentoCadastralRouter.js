const express = require("express");
const documentoCadastralController = require("../controllers/documentoCadastral/index");
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

router.get("/", documentoCadastralController.listarDocumentoCadastral);

router.get(
  "/prestador/:prestadorId",
  documentoCadastralController.listarDocumentoCadastralPorPrestador
);

router.get(
  "/prestador",
  documentoCadastralController.listarDocumentoCadastralPorUsuarioPrestador
);

// router.get("/:id", documentoCadastralController.getServicoById);
router.delete("/:id", documentoCadastralController.excluirDocumentoCadastral);

router.post("/", documentoCadastralController.createDocumentoCadastral);

router.post(
  "/usuario-prestador",
  upload.single("file"),
  documentoCadastralController.criarDocumentoCadastralPorUsuarioPrestador
);

router.post(
  "/anexar-arquivo/:documentoCadastralId",
  upload.single("file"),
  documentoCadastralController.anexarArquivo
);

router.delete(
  "/excluir-arquivo/:documentoCadastralId/:id",
  documentoCadastralController.excluirArquivo
);

// router.post(
//   "/adicionar-e-criar-ticket",
//   documentoCadastralController.createServicoETicket
// );

router.patch("/:id", documentoCadastralController.updateDocumentoCadastral);
// router.patch("/", documentoCadastralController.atualizarStatus);

router.post(
  "/aprovar-documento",
  documentoCadastralController.aprovarDocumento
);

module.exports = router;
