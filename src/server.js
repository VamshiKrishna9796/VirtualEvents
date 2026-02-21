const http = require("http");
const dotenv = require("dotenv");
const app = require("./app");
const { connectDB } = require("./config/mongoDbConfig");
const logger = require("./config/logger");

dotenv.config();

const port = process.env.PORT || 3000;
connectDB()
  .then(() => {
    http.createServer(app).listen(port, () => {
      logger.info("Application started", { port: Number(port) });
    });
  })
  .catch((error) => {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  });
