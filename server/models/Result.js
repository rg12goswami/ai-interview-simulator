import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  role: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  score: { type: Number, required: true },
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