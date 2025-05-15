const Log = require("../models/Log");

const listarTodosLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("usuario", "nome email")
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar logs", error: error.message });
  }
};

const listarLogsPorUsuario = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const logs = await Log.find({ usuario: usuarioId })
      .populate("usuario", "nome email")
      .sort({ createdAt: -1 });

    if (logs.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum log encontrado para este usuário" });
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar logs por usuário",
      error: error.message,
    });
  }
};

const filtrarLogs = async (req, res) => {
  const { endpoint, metodo } = req.query;

  try {
    const query = {};

    if (endpoint) {
      query.endpoint = { $regex: endpoint, $options: "i" };
    }

    if (metodo) {
      query.metodo = metodo.toUpperCase();
    }

    const logs = await Log.find(query)
      .populate("usuario", "nome email")
      .sort({ createdAt: -1 });

    if (logs.length === 0) {
      return res.status(404).json({
        message: "Nenhum log encontrado com os critérios especificados",
      });
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar logs com os filtros especificados",
      error: error.message,
    });
  }
};

const excluirTodosLogs = async (req, res) => {
  try {
    await Log.deleteMany();
    res
      .status(200)
      .json({ message: "Todos os logs foram excluídos com sucesso" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir todos os logs", error: error.message });
  }
};

module.exports = {
  listarTodosLogs,
  listarLogsPorUsuario,
  filtrarLogs,
  excluirTodosLogs,
};
