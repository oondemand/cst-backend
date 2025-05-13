const mongoose = require("mongoose");

const documentoCadastralSchema = new mongoose.Schema(
  {
    prestador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prestador",
      required: [true, "Prestador é obrigatório"],
    },
    tipoDocumento: {
      type: String,
      required: [true, "Tipo Documento é obrigatório"],
    },
    numero: {
      type: String,
      required: [true, "Número é obrigatório"],
    },
    descricao: { type: String },
    motivoRecusa: { type: String },
    observacaoPrestador: { type: String },
    observacaoInterna: { type: String },
    arquivo: { type: mongoose.Schema.Types.ObjectId, ref: "Arquivo" },
    statusValidacao: {
      type: String,
      enum: ["pendente", "recusado", "aprovado"],
      default: "pendente",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DocumentoCadastral", documentoCadastralSchema);
