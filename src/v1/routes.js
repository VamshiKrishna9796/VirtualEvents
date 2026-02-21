const express = require("express");
const authController = require("./controllers/authController");
const eventController = require("./controllers/eventController");
const authenticate = require("../middlewares/authenticationMiddleware");
const requireOrganizer = require("../middlewares/authorizeOrganizer");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/events", authenticate, eventController.listEvents);
router.post("/events", authenticate, requireOrganizer, eventController.createEvent);
router.put(
  "/events/:id",
  authenticate,
  requireOrganizer,
  eventController.updateEvent
);
router.delete(
  "/events/:id",
  authenticate,
  requireOrganizer,
  eventController.deleteEvent
);
router.post("/events/:id/register", authenticate, eventController.registerForEvent);
router.get("/me/events", authenticate, eventController.getMyEvents);

module.exports = router;
