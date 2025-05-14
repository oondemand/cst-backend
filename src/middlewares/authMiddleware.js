const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado. Token ausente." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = await Usuario.findById(decoded.id).select("-senha");
    if (!req.usuario) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido." });
  }
};

module.exports = authMiddleware;
