
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "./middleware/auth.js";


dotenv.config();
 console.log("MONGO URI:", process.env.MONGO_URI);
import mongoose from "mongoose";
import Result from "./models/Result.js";
import User from "./models/User.js";


const app = express();

// ========================
// 🔥 DB CONNECTION (FIXED)
// ========================
let isDBConnected = false;
mongoose.connect(process.env.MONGO_URI)
  .then(() =>{ console.log("MongoDB Connected ✅");
  isDBConnected=true;}
)
  .catch(err => console.log("Mongo Error:", err.message));

// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());

// ========================
// 🔥 TOGGLE
// ========================
const useAI = true;

let groq;

if (useAI) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// ========================
// HEALTH CHECK
// ========================
app.get("/", (req, res) => {
  res.send("AI Interview Server is running 🚀");
});
// =========================
//SIGN UP
//==========================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({
      message: "Signup successful",
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Signup error",
    });
  }
});
// =============================
// LOGIN
// =============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Login error",
    });
  }
});
//===========================
//daily analysis
//=====================
app.get("/daily-analysis", auth, async (req, res) => {
  try {

    const results = await Result.find({
      userId: req.user.id,
      score: { $gte: 0 },
    });

    const grouped = {};

    results.forEach((r) => {
      const date = new Date(r.date)
        .toLocaleDateString();

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(r.score);
    });

    const finalData = Object.keys(grouped).map(date => {

      const avg =
        grouped[date].reduce(
          (a, b) => a + b,
          0
        ) / grouped[date].length;

      return {
        date,
        avgScore: Number(avg.toFixed(1)),
      };
    });

    res.json(finalData);
    console.log(req.user.id);
console.log(results);

  } catch (err) {
    res.status(500).json({
      message: "Analysis error",
    });
  }
});

// ========================
// QUESTION API
// ========================


app.get("/question", async (req, res) => {
  try {
    const role = req.query.role || "frontend";

    const prompt = `
You are an expert technical interviewer.

Generate ONE concise interview question for a ${role} developer.

Rules:
- Do not give answer
- Keep it short
- Make it interview-level
- Only return the question text
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const question = response.choices[0].message.content.trim();

    res.json({ question });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Question error" });
  }
});
// ========================
// EVALUATE API (SAFE)
// ========================

app.post("/evaluate",auth, async (req, res) => {
  console.log("Evaluate API called");

  try {
    const { question, answer, role } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Missing data" });
    }

    const prompt = `
You are an expert technical interviewer evaluating an answer.

Role: ${role}

Question: ${question}

User Answer: ${answer}

Evaluate strictly and return response in EXACT format:

Score: (0 to 10)

Strengths:
- point 1
- point 2

Weaknesses:
- point 1
- point 2

Suggestions:
- point 1
- point 2
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const feedback = response.choices[0].message.content.trim();
    const scoreMatch = feedback.match(/Score:\s*(\d+)/);

const score = scoreMatch
  ? Number(scoreMatch[1])
  : 0;

    // 🔥 DB SAVE (INSIDE TRY BLOCK)
    if (isDBConnected) {
      try {
        await Result.create({
          role: role || "unknown",
          question,
          answer,
          userId: req.user.id,
          score, // optional if not extracting score
        });
        console.log("Saved to DB ✅");
      } catch (dbErr) {
        console.log("DB Save Error:", dbErr.message);
      }
    } else {
      console.log("DB not connected ❌");
    }

    res.json({ feedback });

  } catch (err) {
    console.log("SERVER ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// ========================
// RESULTS API
// ========================
app.get("/results", async (req, res) => {
  try {
    const data = await Result.find().sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results" });
  }
});

// ========================
// SERVER START
// ========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("server is live")
  console.log(`Server running on port ${PORT} 🚀`);
});