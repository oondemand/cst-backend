const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const multer = require("multer");

const {
  registrarAcaoMiddleware,
} = require("../middlewares/registrarAcaoMiddleware");
const { ACOES, ENTIDADES } = require("../constants/controleAlteracao");

const storage = multer.memoryStorage({});

const fileFilter = (req, file, cb) => {
  return cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limite de 1MB por arquivo
});

router.post(
  "/:id/upload",
  upload.array("arquivos", 10),
  ticketController.uploadFiles
);

router.get("/:id/arquivos", ticketController.listFilesFromTicket);
router.delete("/arquivo/:ticketId/:id", ticketController.deleteFileFromTicket);
router.get("/arquivo/:id", ticketController.getArquivoPorId);

router.post(
  "/",
  registrarAcaoMiddleware({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.TICKET,
  }),
  ticketController.createTicket
);

router.get("/", ticketController.getAllTickets);
router.get("/arquivados", ticketController.getArchivedTickets);
router.get("/pagos", ticketController.getTicketsPago);

router.get(
  "/usuario-prestador/:usuarioId",
  ticketController.getTicketsByUsuarioPrestador
);
router.get("/:id", ticketController.getTicketById);

router.post(
  "/arquivar/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ARQUIVADO,
    entidade: ENTIDADES.TICKET,
  }),
  ticketController.arquivarTicket
);

router.patch(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.TICKET,
  }),
  ticketController.updateTicket
);

router.delete(
  "/:id",
  registrarAcaoMiddleware({
    acao: ACOES.DELETADO,
    entidade: ENTIDADES.TICKET,
  }),
  ticketController.deleteTicket
);

router.post(
  "/adicionar-servico/:ticketId/:servicoId/",
  ticketController.addServico
);

router.post("/remover-servico/:servicoId", ticketController.removeServico);

router.post(
  "/adicionar-documento-fiscal/:ticketId/:documentoFiscalId/",
  ticketController.addDocumentoFiscal
);

router.post(
  "/remover-documento-fiscal/:documentoFiscalId",
  ticketController.removeDocumentoFiscal
);

module.exports = router;
