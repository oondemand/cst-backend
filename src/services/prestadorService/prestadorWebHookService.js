const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");
const { registrarAcao } = require("../../services/controleService");
const { ACOES, ENTIDADES, ORIGENS } = require("../../constants/controleAlteracao");

async function handleWebhook(event) {
	// Extract and format documento (if available)
	const documento = event?.cnpj_cpf
		? Number(event.cnpj_cpf.replaceAll(".", "").replaceAll("-", ""))
		: null;
  
	const prestadorOmie = {
		nome: event.razao_social,
		tipo:
			event?.pessoa_fisica === "S"
				? "pf"
				: event?.pessoa_fisica === "pf"
					? "pf"
					: "ext",
		documento,
		dadosBancarios: {
			banco: event?.dadosBancarios?.codigo_banco ?? "",
			agencia: event?.dadosBancarios?.agencia ?? "",
			conta: event?.dadosBancarios?.conta_corrente ?? "",
		},
		email: event?.email ?? "",
		endereco: {
			cep: event?.cep ?? "",
			rua: event?.endereco ?? "",
			numero: event?.endereco_numero ? Number(event?.endereco_numero) : "",
			complemento: event?.complemento, // adjust as needed
			cidade: event?.cidade ?? "",
			estado: event?.estado ?? "",
		},
	};

	// Find existing prestador by documento or email
	const prestador = await Prestador.findOne({ $or: [{ documento }, { email: event?.email }] });
  
	// Check duplication for documento
	if (documento) {
		const prestadorDocumento = await Prestador.findOne({ documento });
		if (prestadorDocumento && prestador._id.toString() !== prestadorDocumento._id.toString()) {
			throw new Error("Já existe um prestador com esse documento registrado");
		}
	}
	// Check duplication for email
	if (prestadorOmie?.email) {
		const prestadorEmail = await Prestador.findOne({ email: prestadorOmie?.email });
		if (prestadorEmail && prestadorEmail._id.toString() !== prestador._id.toString()) {
			throw new Error("Já existe um prestador com esse email registrado");
		}
		// If the prestador already is linked to a usuario, update it accordingly
		if (prestador?.usuario) {
			const usuario = await Usuario.findOne({ email: prestadorOmie?.email });
			if (usuario && usuario._id.toString() !== prestador.usuario.toString()) {
				throw new Error("Já existe um usuário prestador com esse email registrado");
			}
			if (usuario) {
				usuario.email = prestadorOmie?.email;
				await usuario.save();
			}
		}
	}
  
	// Update the prestador based on documento or email
	const prestadorAlterado = await Prestador.findOneAndUpdate(
		{ $or: [{ documento }, { email: event.email }] },
		{ ...prestadorOmie },
		{ new: true }
	);
  
	registrarAcao({
		acao: ACOES.ALTERADO,
		entidade: ENTIDADES.PRESTADOR,
		origem: ORIGENS.OMIE,
		dadosAtualizados: prestadorAlterado,
		idRegistro: prestadorAlterado._id,
	});
  
	return prestadorAlterado;
}

module.exports = { handleWebhook };
