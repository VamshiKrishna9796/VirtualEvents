const logger = require("../../config/logger");

const sendRegistrationEmail = async ({ to, event }) =>
  new Promise((resolve) => {
    setTimeout(() => {
      logger.info("Registration email queued", {
        to,
        eventId: event._id ? event._id.toString() : undefined,
      });
      resolve({
        accepted: [to],
        subject: "Event Registration Confirmation",
        body: `You are registered for ${event.title} on ${event.date} at ${event.time}`,
      });
    }, 5);
  });

module.exports = {
  sendRegistrationEmail,
};
