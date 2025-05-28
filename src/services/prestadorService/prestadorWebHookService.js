const Prestador = require("../../models/Prestador");
const { registrarAcao } = require("../../services/controleService");
const { ACOES, ENTIDADES, ORIGENS } = require("../../constants/controleAlteracao");
const { mapOmieToPrestador } = require("./prestadorOmieImporter");

async function handleWebhook(event) {
	// Converte o evento do Omie para o formato de Prestador
	const prestadorOmie = mapOmieToPrestador(event);

	// ...existing duplication checks e validações, se necessário...
	const prestadorExistente = await Prestador.findOne({ $or: [{ documento: prestadorOmie.documento }, { email: prestadorOmie.email }] });
	if (!prestadorExistente) {
		throw new Error("Prestador não encontrado para atualização");
	}
	
	const prestadorAlterado = await Prestador.findOneAndUpdate(
		{ _id: prestadorExistente._id },
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
