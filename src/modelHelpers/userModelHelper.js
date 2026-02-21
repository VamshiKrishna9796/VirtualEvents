const mongoose = require("mongoose");
const User = require("../models/userModel");

const findUserByEmail = async (email) =>
  User.findOne({ email: String(email).toLowerCase() });

const getUserById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findById(id);
};

const insertUser = async ({ name, email, role, passwordHash }) =>
  User.create({
    name,
    email: String(email).toLowerCase(),
    role,
    passwordHash,
    eventIds: [],
  });

const addEventRegistration = async (userId, eventId) => {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(eventId)) {
    return null;
  }

  return User.findByIdAndUpdate(
    userId,
    { $addToSet: { eventIds: eventId } },
    { new: true }
  );
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

module.exports = {
  findUserByEmail,
  getUserById,
  insertUser,
  addEventRegistration,
  sanitizeUser,
};
