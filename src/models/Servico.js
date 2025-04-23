const mongoose = require("mongoose");

class CompetenciaType extends mongoose.SchemaType {
  constructor(path, options) {
    super(path, options, "CompetenciaType");
  }

  cast(val) {
    if (val.mes < 1 || val.mes > 12) {
      throw new Error("Mês inválido (1-12).");
    }
    if (val.ano < 2000) {
      throw new Error("Ano mínimo é 2000.");
    }
    return val;
  }
}

mongoose.Schema.Types.CompetenciaType = CompetenciaType;

const servicoSchema = new mongoose.Schema(
  {
    prestador: { type: mongoose.Schema.Types.ObjectId, ref: "Prestador" },
    descricao: { type: String },
    codigoCNAE: { type: String },
    dataRegistro: { type: Date },
    competencia: {
      type: CompetenciaType,
    },
    valor: { type: Number },
    tipoDocumentoFiscal: { type: String },
    status: {
      type: String,
      enum: ["aberto", "pendente", "processando", "pago", "pago-externo"],
      default: "aberto",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

servicoSchema.index(
  { prestador: 1, "competencia.mes": 1, "competencia.ano": 1 },
  { unique: true }
);

module.exports = mongoose.model("Servico", servicoSchema);
