const Prestador = require("../../models/Prestador");

async function validateCreatePrestador(data) {
  if (data.documento) {
    const exists = await Prestador.findOne({ documento: data.documento });
    if (exists) {
      throw new Error("Já existe um prestador com esse documento registrado!");
    }
  }
  if (data.email) {
    const existsEmail = await Prestador.findOne({ email: data.email });
    if (existsEmail) {
      throw new Error("Já existe um prestador com esse email registrado!");
    }
  }
  return;
}

async function validateUpdatePrestador(id, data) {
  const prestador = await Prestador.findById(id);
  if (!prestador) {
    throw new Error("Prestador não encontrado");
  }
  if (data.documento) {
    const prestadorDocumento = await Prestador.findOne({ documento: data.documento });
    if (prestadorDocumento && prestadorDocumento._id.toString() !== id) {
      throw new Error("Já existe um prestador com esse documento registrado");
    }
  }
  if (data.email) {
    const prestadorEmail = await Prestador.findOne({ email: data.email });
    if (prestadorEmail && prestadorEmail._id.toString() !== id) {
      throw new Error("Já existe um prestador com esse email registrado");
    }
  }
  return;
}

module.exports = { validateCreatePrestador, validateUpdatePrestador };
 