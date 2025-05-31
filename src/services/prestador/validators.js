// Centraliza as validações das regras de negócio do Prestador para criação e atualização.
const validarPrestadorEmailAoCriar = async ({ email, PrestadorModel }) => {
  if (email) {
    const exists = await PrestadorModel.findOne({ email });
    if (exists) throw new Error(`Prestador com o mesmo email já cadastrado: ${email}`);
  }
};

const validarPrestadorEmailAoAtualizar = async ({ email, currentPrestador, PrestadorModel, UsuarioModel }) => {
  if (email) {
    const prestadorPorEmail = await PrestadorModel.findOne({ email });
    if (
      prestadorPorEmail &&
      prestadorPorEmail._id.toString() !== currentPrestador._id.toString()
    )
      throw new Error(`Prestador com o mesmo email já cadastrado: ${email}`);
    if (currentPrestador.usuario) {
      const usuarioExistente = await UsuarioModel.findOne({ email });
      if (
        usuarioExistente &&
        usuarioExistente._id.toString() !== currentPrestador.usuario.toString()
      )
        throw new Error(`Usuário prestador com o mesmo email já cadastrado: ${email}`);
    }
  }
};

module.exports = { validarPrestadorEmailAoCriar, validarPrestadorEmailAoAtualizar };
