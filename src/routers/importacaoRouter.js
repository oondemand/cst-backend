const express = require("express");
const { listarImportacoes } = require("../controllers/importacaoController");

const router = express.Router();
router.get("/", listarImportacoes);

module.exports = router;
