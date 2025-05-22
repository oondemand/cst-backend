const express = require("express");
const documentoCadastralController = require("../controllers/documentoCadastralController");
const {
  importarDocumentoCadastral,
} = require("../controllers/documentoCadastralController/importacao");

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

router.get("/", documentoCadastralController.listarDocumentoCadastral);

router.get(
  "/prestador/:prestadorId",
  documentoCadastralController.listarDocumentoCadastralPorPrestador
);

router.get(
  "/prestador",
  documentoCadastralController.listarDocumentoCadastralPorUsuarioPrestador
);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.EXCLUIDO,
    entidade: ENTIDADES.DOCUMENTO_CADASTRAL,
  }),
  documentoCadastralController.excluirDocumentoCadastral
);

router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.DOCUMENTO_CADASTRAL,
  }),
  documentoCadastralController.createDocumentoCadastral
);

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

router.patch(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.DOCUMENTO_CADASTRAL,
  }),
  documentoCadastralController.updateDocumentoCadastral
);

router.post(
  "/aprovar-documento/:id",
  registrarAcaoMiddleware({
    acao: ACOES.APROVADO,
    entidade: ENTIDADES.DOCUMENTO_CADASTRAL,
  }),
  documentoCadastralController.aprovarDocumento
);

router.post(
  "/reprovar-documento/:id",
  registrarAcaoMiddleware({
    acao: ACOES.REPROVADO,
    entidade: ENTIDADES.DOCUMENTO_CADASTRAL,
  }),
  documentoCadastralController.reprovarDocumento
);

router.post("/importar", uploadExcel.array("file"), importarDocumentoCadastral);
module.exports = router;
