const eventService = require("../services/eventService");
const logger = require("../../config/logger");

const listEvents = async (_req, res) => {
  try {
    const result = await eventService.listEvents();
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Event controller listEvents failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createEvent = async (req, res) => {
  try {
    const result = await eventService.createEvent({
      ...req.body,
      organizerId: req.user.id,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Event controller createEvent failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const result = await eventService.updateEvent({
      eventId: req.params.id,
      organizerId: req.user.id,
      updates: req.body,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Event controller updateEvent failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const result = await eventService.deleteEvent({
      eventId: req.params.id,
      organizerId: req.user.id,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Event controller deleteEvent failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const result = await eventService.registerForEvent({
      eventId: req.params.id,
      userId: req.user.id,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Event controller registerForEvent failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const result = await eventService.getMyEvents(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error("Event controller getMyEvents failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyEvents,
};
