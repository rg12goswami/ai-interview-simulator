
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "./middleware/auth.js";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { PDFParse } from "pdf-parse";


dotenv.config();
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
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);

    // allow any deployment under your Vercel project (preview + production)
    if (/^https:\/\/ai-interview-simulator.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // allow local development
    if (origin === "http://localhost:3000") {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

// Limits login/signup attempts to slow down brute-force / credential
// stuffing. 20 requests per 15 min per IP is generous for real users,
// tight enough to blunt automated guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

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
app.post("/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

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
app.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
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
      model: "openai/gpt-oss-120b",
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
// RESUME-TAILORED INTERVIEW
// ========================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload a resume PDF, extract its text
app.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();

    // keep prompt size sane
    const resumeText = result.text.slice(0, 6000);

    res.json({ resumeText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not parse resume" });
  }
});

// Generate a question tailored to the candidate's resume content
app.post("/resume-question", async (req, res) => {
  try {
    const { resumeText, askedQuestions = [] } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "resumeText is required" });
    }

    const prompt = `
You are an expert technical interviewer reviewing this candidate's resume:

"""
${resumeText}
"""

Generate ONE concise interview question that probes a specific skill, project, or technology mentioned in the resume above.

Rules:
- Reference something specific from the resume (a named project, technology, or claim)
- Do not give the answer
- Keep it short and interview-level
- Do not repeat any of these already-asked questions: ${askedQuestions.join(" | ") || "none"}
- Only return the question text
`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
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
    res.status(500).json({ error: "Resume question error" });
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
      model: "openai/gpt-oss-120b",
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
app.get("/results", auth, async (req, res) => {
  try {
    const data = await Result.find({ userId: req.user.id }).sort({ date: -1 });
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