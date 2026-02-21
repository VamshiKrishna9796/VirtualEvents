const jwt = require("jsonwebtoken");
const userModelHelper = require("../modelHelpers/userModelHelper");
const logger = require("../config/logger");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    logger.warn("Authentication failed: missing bearer token", {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await userModelHelper.getUserById(payload.id);
    if (!user) {
      logger.warn("Authentication failed: user not found for token", {
        method: req.method,
        path: req.originalUrl,
      });
      return res.status(401).json({ message: "Invalid token user" });
    }

    req.user = userModelHelper.sanitizeUser(user);
    logger.debug("Authentication success", {
      userId: req.user.id,
      path: req.originalUrl,
    });
    return next();
  } catch (error) {
    logger.warn("Authentication failed: token verification error", {
      method: req.method,
      path: req.originalUrl,
      error: error.message,
    });
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
