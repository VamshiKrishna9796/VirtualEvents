const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const activeLevelValue = LEVELS[configuredLevel] || LEVELS.info;

const writeLog = (level, message, meta = {}) => {
  if (LEVELS[level] < activeLevelValue) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(line);
};

module.exports = {
  debug: (message, meta) => writeLog("debug", message, meta),
  info: (message, meta) => writeLog("info", message, meta),
  warn: (message, meta) => writeLog("warn", message, meta),
  error: (message, meta) => writeLog("error", message, meta),
};
