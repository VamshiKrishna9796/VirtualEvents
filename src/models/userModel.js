const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: ["organizer", "attendee"],
      default: "attendee",
      required: true,
    },
    passwordHash: { type: String, required: true },
    eventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
