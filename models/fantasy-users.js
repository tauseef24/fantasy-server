const mongoose = require("mongoose");
 
const FantasyUsersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    unique: [true, "Email already exists"],
    lowercase: true,
    trim: true,
    required: [true, "Email is required"],
    validate: {
      validator: (v) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "{VALUE} is not a valid email!",
    },
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    required: [true, "Please specify the user role"],
  },
  password: {
    type: String,
    required: true,
  },
  wallet: {
    type: Number,
    default: 100,
  },
  skillScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});
 
module.exports = mongoose.model("User", FantasyUsersSchema, "fantasy-users");