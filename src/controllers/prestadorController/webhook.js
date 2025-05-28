const asyncHandler = require("../../middlewares/asyncHandler");
const { sendResponse } = require("../../utils/helpers");
const { handleWebhook } = require("../../services/prestadorService/prestadorWebHookService");

exports.prestadorWebHook = asyncHandler(async (req, res) => {
	// Converte o evento do Omie para atualizar o Prestador
	const { event, ping, topic } = req.body;
	if (ping === "omie") {
		return sendResponse({ res, statusCode: 200, message: "pong" });
	}
	if (topic === "ClienteFornecedor.Alterado") {
		await handleWebhook(event);
	}
	sendResponse({ res, statusCode: 200, message: "Webhook recebido. Dados sendo atualizados." });
});
