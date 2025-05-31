const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");
const buildQuery = require("../../utils/filter").buildQuery;

exports.getByUserId = async (idUsuario) => {
  return await Prestador.findOne({ usuario: idUsuario });
};

exports.create = async (data) => {
  if (data?.documento) {
    const exists = await Prestador.findOne({ documento: data.documento });
    if (exists) throw new Error("Já existe um prestador com esse documento registrado!");
  }
  const prestador = new Prestador(data);
  return await prestador.save();
};

exports.list = async (queryParams) => {
  const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = queryParams;
  const schema = Prestador.schema;
  // Aqui foi mantida a lista manual de campos para buscar conforme regras originais
  const camposBusca = [
    "manager",
    "nome",
    "documento",
    "dadosBancariosSchema.agencia",
    "dadosBancariosSchema.conta",
    "email",
    "cep",
    "enderecoSchema.rua",
    "enderecoSchema.numero",
    "enderecoSchema.complemento",
    "enderecoSchema.cidade",
    "pessoaFisica.dataNascimento",
    "pessoaFisica.pis",
    "pessoaJuridica.nomeFantasia",
    "createdAt",
    "updatedAt",
  ];
  const queryResult = buildQuery({ filtros: rest, searchTerm, schema, camposBusca });
  let sorting = {};
  if (sortBy) {
    const [campo, direcao] = sortBy.split(".");
    const campoFormatado = campo.replaceAll("_", ".");
    sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
  }
  const page = parseInt(pageIndex) || 0;
  const limit = parseInt(pageSize) || 10;
  const prestadores = await Prestador.find(queryResult)
    .sort(sorting)
    .skip(page * limit)
    .limit(limit);
  const totalDePrestadores = await Prestador.countDocuments(queryResult);
  return {
    results: prestadores,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalDePrestadores / limit),
      totalItems: totalDePrestadores,
      itemsPerPage: limit,
    },
  };
};

exports.getById = async (id) => {
  return await Prestador.findById(id);
};

exports.update = async (id, dados) => {
  return await Prestador.findByIdAndUpdate(id, dados, { new: true });
};

exports.delete = async (id) => {
  const prestador = await Prestador.findByIdAndDelete(id);
  if (prestador?.usuario) await Usuario.findByIdAndDelete(prestador.usuario);
  return prestador;
};

exports.getByDocumento = async (documento) => {
  return await Prestador.findOne({ documento });
};

exports.getByEmail = async (email) => {
  return await Prestador.findOne({ email });
};

exports.getByPis = async (pis) => {
  return await Prestador.findOne({ "pessoaFisica.pis": pis });
};
