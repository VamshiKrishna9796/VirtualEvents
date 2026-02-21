const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDB, disconnectDB } = require("../src/config/mongoDbConfig");
const app = require("../app");

let server;
let baseUrl;
let mongoServer;
let organizerEmail;
let attendeeEmail;

const jsonFetch = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let body = {};
  try {
    body = await response.json();
  } catch (_error) {
    body = {};
  }

  return { status: response.status, body };
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  await connectDB(mongoUri);

  const suffix = Date.now();
  organizerEmail = `organizer.${suffix}@example.com`;
  attendeeEmail = `attendee.${suffix}@example.com`;

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test("register and login users", async () => {
  const organizerPayload = {
    name: "Alice Organizer",
    email: organizerEmail,
    password: "StrongPass123",
    role: "organizer",
  };

  const attendeePayload = {
    name: "Bob Attendee",
    email: attendeeEmail,
    password: "StrongPass123",
    role: "attendee",
  };

  const organizerRegistration = await jsonFetch("/register", {
    method: "POST",
    body: JSON.stringify(organizerPayload),
  });
  assert.equal(organizerRegistration.status, 201);
  assert.ok(organizerRegistration.body.token);
  assert.equal(organizerRegistration.body.user.role, "organizer");

  const attendeeRegistration = await jsonFetch("/register", {
    method: "POST",
    body: JSON.stringify(attendeePayload),
  });
  assert.equal(attendeeRegistration.status, 201);
  assert.equal(attendeeRegistration.body.user.role, "attendee");

  const loginResponse = await jsonFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      email: attendeePayload.email,
      password: attendeePayload.password,
    }),
  });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.token);
});

test("organizer can create/update/delete event, attendee cannot create", async () => {
  const organizerLogin = await jsonFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      email: organizerEmail,
      password: "StrongPass123",
    }),
  });
  const attendeeLogin = await jsonFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      email: attendeeEmail,
      password: "StrongPass123",
    }),
  });

  const organizerToken = organizerLogin.body.token;
  const attendeeToken = attendeeLogin.body.token;

  const forbiddenCreate = await jsonFetch("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${attendeeToken}` },
    body: JSON.stringify({
      title: "Bad Create",
      date: "2026-03-01",
      time: "10:00",
      description: "Should fail",
    }),
  });
  assert.equal(forbiddenCreate.status, 403);

  const createEvent = await jsonFetch("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: "Node Summit",
      date: "2026-03-10",
      time: "14:00",
      description: "A virtual Node.js event",
    }),
  });
  assert.equal(createEvent.status, 201);
  const eventId = createEvent.body.event.id || createEvent.body.event._id;

  const updateEvent = await jsonFetch(`/events/${eventId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({ description: "Updated description" }),
  });
  assert.equal(updateEvent.status, 200);
  assert.equal(updateEvent.body.event.description, "Updated description");

  const deleteEvent = await jsonFetch(`/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${organizerToken}` },
  });
  assert.equal(deleteEvent.status, 200);
});

test("attendee can register for event and view registrations", async () => {
  const organizerLogin = await jsonFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      email: organizerEmail,
      password: "StrongPass123",
    }),
  });
  const attendeeLogin = await jsonFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      email: attendeeEmail,
      password: "StrongPass123",
    }),
  });

  const organizerToken = organizerLogin.body.token;
  const attendeeToken = attendeeLogin.body.token;

  const createEvent = await jsonFetch("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: "Event Registration Test",
      date: "2026-03-15",
      time: "16:00",
      description: "Registration flow",
    }),
  });
  assert.equal(createEvent.status, 201);
  const eventId = createEvent.body.event.id || createEvent.body.event._id;

  const registerResponse = await jsonFetch(`/events/${eventId}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${attendeeToken}` },
  });
  assert.equal(registerResponse.status, 200);
  assert.match(registerResponse.body.message, /email notification sent/i);

  const registrations = await jsonFetch("/me/events", {
    headers: { Authorization: `Bearer ${attendeeToken}` },
  });
  assert.equal(registrations.status, 200);
  assert.equal(registrations.body.events.length, 1);
  assert.equal(registrations.body.events[0].id || registrations.body.events[0]._id, eventId);
});
