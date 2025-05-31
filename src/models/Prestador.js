const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const enderecoSchema = new mongoose.Schema({
  cep: { type: String, match: /^\d{8}$/ },
  rua: String,
  numero: String,
  complemento: String,
  cidade: String,
  estado: String,
  pais: {
    type: { nome: String, cod: Number },
    default: { nome: "Brasil", cod: 1058 },
  },
});

const dadosBancariosSchema = new mongoose.Schema({
  banco: String,
  agencia: String,
  conta: String,
  tipoConta: { type: String, enum: ["", "corrente", "poupanca"] },
});

const prestadorSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    manager: { type: String },
    nome: { type: String, required: true },
    tipo: { type: String, enum: ["pj", "pf", "ext", ""] },
    documento: { type: String, unique: true },
    dadosBancarios: dadosBancariosSchema,
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (v) {
          return v === null ? true : /\S+@\S+\.\S+/.test(v);
        },
        message: (props) => `${props.value} não é um e-mail válido!`,
      },
      required: false,
    },
    endereco: enderecoSchema,
    pessoaFisica: {
      dataNascimento: Date,
      pis: String,
      rg: {
        numero: String,
        orgaoEmissor: String,
      },
    },
    pessoaJuridica: {
      razaoSocial: String,
      nomeFantasia: String,
      codigoCNAE: String,
      codigoServicoNacional: String,
      regimeTributario: {
        type: String,
        enum: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"],
      },
    },
    comentariosRevisao: String,
    status: {
      type: String,
      enum: ["ativo", "pendente-de-revisao", "inativo", "arquivado"],
      default: "ativo",
    },
    dataExportacao: { type: Date, default: null },
  },
  { timestamps: true }
);

prestadorSchema.methods.gerarToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  }); // Token expira em 24 horas
};

/*
Regras do Modelo:
- O endereço possui validação para CEP (8 dígitos) e valores padrão para país.
- Dados bancários: tipoConta somente aceita "corrente" ou "poupanca".
- E-mail é convertido para lowercase e validado por regex.
- Campos para pessoa física e jurídica estão estruturados conforme necessidades operacionais.
- Método gerarToken utiliza process.env.JWT_SECRET e expira em 24h.
Este arquivo foi estruturado para facilitar futuras modificações sem quebrar a compatibilidade.
*/

module.exports = mongoose.model("Prestador", prestadorSchema);
