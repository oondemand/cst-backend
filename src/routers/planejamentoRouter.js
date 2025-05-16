const express = require("express");
const {
  sincronizarEsteira,
} = require("../controllers/planejamentoController/sincronizarEsteira");
const {
  listarServicos,
} = require("../controllers/planejamentoController/listarServicos");
const {
  estatisticas,
} = require("../controllers/planejamentoController/estatisticas");

const router = express.Router();

router.get("/listar-servicos", listarServicos);
router.get("/estatisticas", estatisticas);
router.post("/sincronizar-esteira", sincronizarEsteira);

module.exports = router;
