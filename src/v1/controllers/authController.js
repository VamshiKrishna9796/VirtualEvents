const authService = require("../services/authService");
const logger = require("../../config/logger");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Auth controller register failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Auth controller login failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
};
