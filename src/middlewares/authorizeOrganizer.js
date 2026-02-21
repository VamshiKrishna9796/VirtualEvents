const logger = require("../config/logger");

module.exports = (req, res, next) => {
  if (req.user.role !== "organizer") {
    logger.warn("Authorization failed: organizer role required", {
      userId: req.user.id,
      role: req.user.role,
      path: req.originalUrl,
    });
    return res
      .status(403)
      .json({ message: "Only organizers can perform this action" });
  }
  return next();
};
