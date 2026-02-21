const mongoose = require("mongoose");
const Event = require("../models/eventModel");

const listEvents = async () => Event.find().lean();

const getEventById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return Event.findById(id);
};

const insertEvent = async ({ title, date, time, description, organizerId }) =>
  Event.create({
    title,
    date,
    time,
    description,
    organizerId,
    participants: [],
  });

const updateEvent = async (id, updates) => {
  if (!mongoose.isValidObjectId(id)) return null;

  const allowedFields = ["title", "date", "time", "description"];
  const updatePayload = {};
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updatePayload[field] = updates[field];
    }
  });

  return Event.findByIdAndUpdate(id, updatePayload, { new: true });
};

const deleteEvent = async (id) => {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await Event.findByIdAndDelete(id);
  return Boolean(result);
};

const addParticipant = async (id, userId) => {
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  const event = await Event.findById(id);
  if (!event) return null;

  const alreadyRegistered = event.participants.some(
    (participantId) => participantId.toString() === userId.toString()
  );

  if (alreadyRegistered) {
    return { event, alreadyRegistered: true };
  }

  event.participants.push(userId);
  await event.save();

  return { event, alreadyRegistered: false };
};

module.exports = {
  listEvents,
  getEventById,
  insertEvent,
  updateEvent,
  deleteEvent,
  addParticipant,
};
