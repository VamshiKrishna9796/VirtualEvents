const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModelHelper = require("../../modelHelpers/userModelHelper");
const logger = require("../../config/logger");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const register = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    logger.warn("Register validation failed: missing fields");
    return { status: 400, body: { message: "name, email and password are required" } };
  }

  const existingUser = await userModelHelper.findUserByEmail(email);
  if (existingUser) {
    logger.warn("Register failed: email already exists", { email });
    return { status: 409, body: { message: "Email already registered" } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModelHelper.insertUser({
    name,
    email,
    role: role === "organizer" ? "organizer" : "attendee",
    passwordHash,
  });
  logger.info("User registered", { userId: user._id.toString(), role: user.role });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return {
    status: 201,
    body: { user: userModelHelper.sanitizeUser(user), token },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    logger.warn("Login validation failed: missing fields");
    return { status: 400, body: { message: "email and password are required" } };
  }

  const user = await userModelHelper.findUserByEmail(email);
  if (!user) {
    logger.warn("Login failed: user not found", { email });
    return { status: 401, body: { message: "Invalid credentials" } };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    logger.warn("Login failed: invalid password", { userId: user._id.toString() });
    return { status: 401, body: { message: "Invalid credentials" } };
  }
  logger.info("User logged in", { userId: user._id.toString() });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return {
    status: 200,
    body: { user: userModelHelper.sanitizeUser(user), token },
  };
};

module.exports = {
  register,
  login,
};
