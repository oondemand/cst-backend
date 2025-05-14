const mongoose = require("mongoose");

const etapaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    posicao: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["ativo", "inativo", "arquivado"],
      default: "ativo",
    },
  },
  {
    timestamps: true,
  }
);

const Etapa = mongoose.model("Etapa", etapaSchema);
module.exports = Etapa;
