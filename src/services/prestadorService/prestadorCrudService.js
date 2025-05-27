const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");

// ...other necessary imports...

async function createPrestador(data) {
  const prestador = new Prestador(data);
  await prestador.save();
  return prestador;
}

async function updatePrestador(id, data) {
  const prestador = await Prestador.findByIdAndUpdate(id, data, { new: true });
  return prestador;
}

async function deletePrestador(id) {
  const prestador = await Prestador.findByIdAndDelete(id);
  if (prestador?.usuario) {
    await Usuario.findByIdAndDelete(prestador.usuario);
  }
  return prestador;
}

module.exports = { createPrestador, updatePrestador, deletePrestador };
