const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("node:path");

const router = express.Router();

// Adiciona cabeçalho para requisições originadas da docs (bypass de autenticação)
router.use((req, res, next) => {
  req.headers["x-from-docs"] = "true";
  next();
});

const indexSwagger = YAML.load(
  path.join(__dirname, "..", "..", "docs", "swagger-index.yml")
);
const prestadorSwagger = YAML.load(
  path.join(__dirname, "..", "..", "docs", "prestador", "prestador-swagger.yml")
);

// Monta as rotas com o middleware para servir os ativos estáticos do Swagger
router.use(
  "/prestador",
  swaggerUi.serve,
  swaggerUi.setup(prestadorSwagger, { swaggerOptions: { spec: prestadorSwagger } })
);

router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(indexSwagger, { swaggerOptions: { spec: indexSwagger } })
);

module.exports = router;
