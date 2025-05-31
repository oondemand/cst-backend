const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");

const path = require("node:path");
const multer = require("multer");

// Carregar variáveis de ambiente
dotenv.config();

const authMiddleware = require("./middlewares/authMiddleware");
const logMiddleware = require("./middlewares/logMiddleware");

const app = express();

// Middlewares globais
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// **Rotas públicas** - Não requerem autenticação
app.use("/docs", require("./routers/docsRouter"));
app.use("/webhooks/", require("./routers/webhookRouter"));
app.use("/ativacao", require("./routers/seedRouter"));
app.use("/auth", require("./routers/authRouter"));
app.use("/", require("./routers/statusRouter"));

app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "assets/images", filename);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send("Imagem não encontrada");
  }
});

// **Middleware de autenticação** - Aplica-se apenas às rotas que necessitam de proteção
app.use(authMiddleware);

// **Middleware de rastreabilidade** - Pode ser aplicado depois do de autenticação, se necessário
app.use(logMiddleware);

// **Rotas protegidas** - Necessitam de autenticação
app.use("/usuarios", require("./routers/usuarioRouter"));
app.use("/baseomies", require("./routers/baseOmieRouter"));
app.use("/tickets", require("./routers/ticketRouter"));
app.use("/aprovacoes", require("./routers/aprovacaoRouter"));
app.use("/etapas", require("./routers/etapaRouter"));
app.use("/logs", require("./routers/logRouter"));
app.use("/prestadores", require("./routers/prestadorRouter"));
app.use("/servicos", require("./routers/servicoRouter"));
app.use("/documentos-fiscais", require("./routers/documentoFiscalRouter"));
app.use("/documentos-cadastrais", require("./routers/documentoCadastralRouter"));
app.use("/registros", require("./routers/controleAlteracao"));
app.use("/listas", require("./routers/listaRouter"));
app.use("/estados", require("./routers/estadoRouter"));
app.use("/bancos", require("./routers/bancoRouter"));
app.use("/planejamento", require("./routers/planejamentoRouter"));
app.use("/importacoes", require("./routers/importacaoRouter"));
app.use("/dashboard", require("./routers/dashoboardRouter"));
app.use("/sistema", require("./routers/sistemaRouter"));
app.use("/lista-omie", require("./routers/listasOmieRouter"));
app.use("/assistentes", require("./routers/assistenteRouter"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Middleware de erro
app.use((err, req, res, next) => {
  console.log("Middleware de Erro Invocado");
  console.log("Erro:", err);

  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      console.log("Erro de Limite de Tamanho de Arquivo");
      return res.status(413).json({
        message: err.message,
      });
    }

    console.log("Erro de Multer:", err.message);
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.log("Erro Interno do Servidor:", err.message);
    return res.status(500).json({ message: err.message });
  }
  next();
});

module.exports = app;
