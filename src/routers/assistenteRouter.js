const express = require("express");
const router = express.Router();
const assistenteController = require("../controllers/assistenteController");

router.post("/", assistenteController.criarAssistente);
router.get("/", assistenteController.listarAssistentes);
router.get("/ativos", assistenteController.listarAssistentesAtivos);
router.get("/:id", assistenteController.obterAssistente);
router.put("/:id", assistenteController.atualizarAssistente);
router.delete("/:id", assistenteController.excluirAssistente);

module.exports = router;
