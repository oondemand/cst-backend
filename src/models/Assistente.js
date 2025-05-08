const mongoose = require("mongoose");

const AssistenteSchema = new mongoose.Schema(
  {
    modulo: {
      type: String,
      required: true,
      trim: true,
    },
    assistente: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ativo", "inativo"],
      default: "ativo",
    },
  },
  {
    timestamps: true,
  }
);

const Assistente = mongoose.model("Assistente", AssistenteSchema);
module.exports = Assistente;
