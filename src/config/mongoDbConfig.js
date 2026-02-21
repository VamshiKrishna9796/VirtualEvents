const mongoose = require("mongoose");
const logger = require("./logger");
const User = require("../models/userModel");
const Event = require("../models/eventModel");

const connectDB = async (uri = process.env.MONGO_URI) => {
  if (!uri) {
    logger.error("Database connection failed: MONGO_URI is missing");
    throw new Error("MONGO_URI is required");
  }

  if (mongoose.connection.readyState === 1) {
    logger.debug("Reusing existing MongoDB connection");
    return mongoose.connection;
  }

  logger.info("Connecting to MongoDB");
  await mongoose.connect(uri);
  logger.info("MongoDB connected");

  try {
    await Promise.all([User.syncIndexes(), Event.syncIndexes()]);
    logger.info("MongoDB indexes synchronized");
  } catch (error) {
    logger.warn("MongoDB index synchronization failed", { error: error.message });
  }

  return mongoose.connection;
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    logger.info("Disconnecting MongoDB");
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
