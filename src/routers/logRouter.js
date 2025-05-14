const express = require("express");
const router = express.Router();
const {
  listarTodosLogs,
  listarLogsPorUsuario,
  filtrarLogs,
  excluirTodosLogs,
} = require("../controllers/logController");

router.get("/", listarTodosLogs);
router.get("/usuario/:usuarioId", listarLogsPorUsuario);
router.get("/filtrar", filtrarLogs);
router.post("/excluir-todos", excluirTodosLogs);

module.exports = router;
