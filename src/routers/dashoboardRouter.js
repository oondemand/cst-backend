const { Router } = require("express");
const {
  valoresPorStatus,
} = require("../controllers/dashboardController/servicos");
const {
  ticketsPorStatus,
  ticketsPorEtapa,
} = require("../controllers/dashboardController/tickets");

const router = Router();

router.get("/servicos/valores", valoresPorStatus);
router.get("/tickets/status", ticketsPorStatus);
router.get("/tickets/etapa", ticketsPorEtapa);

module.exports = router;
