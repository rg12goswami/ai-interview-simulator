import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  role: {
    type: String,
  },

  question: {
    type: String,
  },

  answer: {
    type: String,
  },

  score: {
    type: Number,
    default: 0,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const Result = mongoose.model("Result", resultSchema);

export default Result;