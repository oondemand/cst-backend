const mongoose = require("mongoose");

const ArquivoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    nomeOriginal: { type: String, required: true },
    tipo: { type: String, enum: ["generico", "rpa"], default: "generico" },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    buffer: { type: Buffer },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Arquivo", ArquivoSchema);
