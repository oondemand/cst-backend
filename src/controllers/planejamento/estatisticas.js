const Servico = require("../../models/Servico");

exports.estatisticas = async (req, res) => {
  try {
    const aggregationPipeline = [
      {
        $group: {
          _id: "$status",
          total: {
            $sum: {
              $ifNull: ["$valor", 0],
            },
          },
          count: { $sum: 1 }, // Conta documentos por grupo
          prestadoresUnicos: { $addToSet: "$prestador" }, // Coleta ObjectIds únicos
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          total: 1,
          count: 1,
          prestadoresCount: { $size: "$prestadoresUnicos" }, // Conta os prestadores únicos
        },
      },
    ];

    const response = await Servico.aggregate(aggregationPipeline);
    return res.status(200).json(response);
  } catch (error) {
    // console.log("Error", error);
    res.status(500).json({ message: "Ouve um erro inesperado" });
  }
};
