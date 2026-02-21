const eventModelHelper = require("../../modelHelpers/eventModelHelper");
const userModelHelper = require("../../modelHelpers/userModelHelper");
const emailService = require("./emailService");
const logger = require("../../config/logger");

const serializeEvent = (event) => {
  const raw = typeof event.toObject === "function" ? event.toObject() : event;
  return {
    ...raw,
    id: raw._id.toString(),
  };
};

const listEvents = async () => {
  const events = await eventModelHelper.listEvents();
  const formatted = [];

  for (const event of events) {
    const participants = await Promise.all(
      event.participants.map(async (id) => {
        const user = await userModelHelper.getUserById(id);
        return user ? userModelHelper.sanitizeUser(user) : null;
      })
    );

    formatted.push({ ...serializeEvent(event), participants: participants.filter(Boolean) });
  }
  logger.info("Events fetched", { count: formatted.length });

  return { status: 200, body: { events: formatted } };
};

const createEvent = async ({ title, date, time, description, organizerId }) => {
  if (!title || !date || !time || !description) {
    logger.warn("Create event validation failed", { organizerId: organizerId.toString() });
    return {
      status: 400,
      body: { message: "title, date, time and description are required" },
    };
  }

  const event = await eventModelHelper.insertEvent({
    title,
    date,
    time,
    description,
    organizerId,
  });
  logger.info("Event created", {
    eventId: event._id.toString(),
    organizerId: organizerId.toString(),
  });

  return { status: 201, body: { event: serializeEvent(event) } };
};

const updateEvent = async ({ eventId, organizerId, updates }) => {
  const event = await eventModelHelper.getEventById(eventId);
  if (!event) {
    logger.warn("Update event failed: not found", { eventId });
    return { status: 404, body: { message: "Event not found" } };
  }

  const isOwner = event.organizerId.toString() === organizerId.toString();
  if (!isOwner) {
    logger.warn("Update event forbidden: not owner", {
      eventId,
      userId: organizerId.toString(),
    });
    return { status: 403, body: { message: "Not allowed for this event" } };
  }

  const updatedEvent = await eventModelHelper.updateEvent(eventId, updates);
  logger.info("Event updated", { eventId: updatedEvent._id.toString() });
  return { status: 200, body: { event: serializeEvent(updatedEvent) } };
};

const deleteEvent = async ({ eventId, organizerId }) => {
  const event = await eventModelHelper.getEventById(eventId);
  if (!event) {
    logger.warn("Delete event failed: not found", { eventId });
    return { status: 404, body: { message: "Event not found" } };
  }

  const isOwner = event.organizerId.toString() === organizerId.toString();
  if (!isOwner) {
    logger.warn("Delete event forbidden: not owner", {
      eventId,
      userId: organizerId.toString(),
    });
    return { status: 403, body: { message: "Not allowed for this event" } };
  }

  await eventModelHelper.deleteEvent(eventId);
  logger.info("Event deleted", { eventId });
  return { status: 200, body: { message: "Event deleted" } };
};

const registerForEvent = async ({ eventId, userId }) => {
  const registrationResult = await eventModelHelper.addParticipant(eventId, userId);
  if (!registrationResult) {
    logger.warn("Register for event failed: event not found", { eventId, userId });
    return { status: 404, body: { message: "Event not found" } };
  }

  if (registrationResult.alreadyRegistered) {
    logger.warn("Register for event failed: duplicate registration", { eventId, userId });
    return { status: 409, body: { message: "Already registered for this event" } };
  }

  const user = await userModelHelper.addEventRegistration(
    userId,
    registrationResult.event._id
  );
  await emailService.sendRegistrationEmail({
    to: user.email,
    event: registrationResult.event,
  });
  logger.info("Event registration successful", {
    eventId: registrationResult.event._id.toString(),
    userId: user._id.toString(),
  });

  return {
    status: 200,
    body: {
      message: "Registered successfully and email notification sent",
      eventId: registrationResult.event._id.toString(),
      userId: user._id.toString(),
    },
  };
};

const getMyEvents = async (userId) => {
  const user = await userModelHelper.getUserById(userId);
  const events = await eventModelHelper.listEvents();
  const userEventIds = new Set(user.eventIds.map((id) => id.toString()));
  const registrations = events
    .filter((event) =>
    userEventIds.has(event._id.toString())
  )
    .map((event) => serializeEvent(event));
  logger.info("Fetched user registrations", {
    userId: userId.toString(),
    count: registrations.length,
  });

  return { status: 200, body: { events: registrations } };
};

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyEvents,
};
