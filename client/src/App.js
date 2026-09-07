import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { LineChart, Line, XAxis, YAxis , Tooltip,
  CartesianGrid , Bar ,BarChart } from "recharts";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [isLogin, setIsLogin] = useState(true);

  // "home" | "login" | "interview" | "stats"
  const [view, setView] = useState("home");

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [dailyData, setDailyData] = useState([]);

const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const ROLE_OPTIONS = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Android Developer",
    "iOS Developer",
    "React Native / Flutter Developer",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Database Engineer",
    "Cybersecurity Engineer",
    "QA / Automation Engineer",
    "Java Developer",
    "Python Developer",
    "Go Developer",
    "C++ Developer",
    "JavaScript / Node.js Developer",
    "Data Structures & Algorithms",
  ];

  const filteredRoles = ROLE_OPTIONS.filter((r) =>
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );
  const [question, setQuestion] = useState("");

  // resume-tailored interview
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeMode, setResumeMode] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState([]);

  // full session transcript, for the PDF export
  const [sessionLog, setSessionLog] = useState([]);

  // text-to-speech
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
const [timeTakenData, setTimeTakenData] = useState([]);
const [startTime, setStartTime] = useState(Date.now());
useEffect(() => {
  if (step === 3 && timeLeft > 0) {
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }
}, [timeLeft, step]);

  const TOTAL_QUESTIONS = 5;
  const [currentQ, setCurrentQ] = useState(1);

  // 🔥 NEW STATES

  const [scores, setScores] = useState([]);
  const [results, setResults] = useState([]);
  const [time, setTime] = useState(30);
  const [confidence, setConfidence] =
  useState(0);

  // ⏱ TIMER
  useEffect(() => {
    if (step === 3 && time > 0) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [time, step]);

  // format seconds as mm:ss for the timer display
  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };
  const timerColor =
    time <= 10 ? "text-danger" : time <= 20 ? "text-amber" : "text-accent";

  // score for this session, per question (independent of the /results endpoint)
  const sessionScoreData = scores.map((s, i) => ({
    name: `Q${i + 1}`,
    score: s,
  }));

  //==================
  //LOGIN
  // ==================
  const loginUser = async () => {
  try {
    const res = await axios.post(
      `${API_URL}/login`,
      {
        email,
        password,
      }
    );

    localStorage.setItem(
      "token",
      res.data.token
    );

    setIsAuthenticated(true);
    setView("interview");

  } catch (err) {
    alert("Login failed");
  }
};

//=======================
//LOGOUT
//=======================
const logoutUser = () => {
  localStorage.removeItem("token");
  setIsAuthenticated(false);
  setEmail("");
  setPassword("");
  setStep(1);
  setView("home");
};

//=======================
//NAV: PRACTICE (start / resume interview)
//=======================
const goToPractice = () => {
  if (isAuthenticated) {
    setView("interview");
  } else {
    alert("Please login first");
    setIsLogin(true);
    setView("login");
  }
};

//=======================
//NAV: DASHBOARD (weak areas + daily analysis)
//=======================
const goToDashboardStats = () => {
  if (isAuthenticated) {
    fetchResults();
    fetchDailyAnalysis();
    setView("stats");
  } else {
    alert("Please login first");
    setIsLogin(true);
    setView("login");
  }
};

//=======================
//SIGNUP
//=======================
const signupUser = async () => {
  try {
    await axios.post(
      `${API_URL}/signup`,
      {
        name,
        email,
        password,
      }
    );

    alert("Signup successful");

    setIsLogin(true);

  } catch (err) {
    alert("Signup failed");
  }
};
//daily analysis fetch
const fetchDailyAnalysis = async () => {

  const token = localStorage.getItem("token");

  const res = await axios.get(
    `${API_URL}/daily-analysis`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setDailyData(res.data);
};

  // 📊 FETCH RESULTS
  const fetchResults = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/results`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 🔥 safety check
    if (!res.data || res.data.length === 0) {
      setResults([]);
    
      return;
    }

    setResults(res.data);


  } catch (err) {
    console.log("Fetch error:", err);
    setResults([]);
    
  }
};

  // Fetch Question
  const getQuestion = async (selectedRole) => {
    const res = await axios.get(
      `${API_URL}/question?role=${selectedRole}`
    );
    setResumeMode(false);
    setQuestion(res.data.question);
    setStep(3);
    setTime(30); // reset timer
    setTimeLeft(30);
setStartTime(Date.now());
  };

  const startInterview = (selectedRole) => {
    setRole(selectedRole);
    setAskedQuestions([]);
    setSessionLog([]);
    getQuestion(selectedRole);
  };

  //=======================
  // TEXT-TO-SPEECH — AI reads the question out loud
  //=======================
  const speakText = (text) => {
    if (!ttsEnabled || !text) return;
    if (!window.speechSynthesis) return; // not supported in this browser

    window.speechSynthesis.cancel(); // stop any previous utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // speak automatically whenever a new question is shown
  useEffect(() => {
    if (step === 3 && question) {
      speakText(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, step]);

  //=======================
  // RESUME-TAILORED INTERVIEW
  //=======================
  const uploadResumeAndStart = async () => {
    if (!resumeFile) return;

    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const parseRes = await axios.post(`${API_URL}/parse-resume`, formData);

      const extractedText = parseRes.data.resumeText;
      setResumeText(extractedText);
      setResumeMode(true);
      setRole("Resume-tailored Interview");
      setAskedQuestions([]);
      setSessionLog([]);

      await getResumeQuestion(extractedText, []);
    } catch (err) {
      console.error(err);
      alert("Could not process that resume. Try a different PDF.");
    } finally {
      setResumeUploading(false);
    }
  };

  const getResumeQuestion = async (text, asked) => {
    const res = await axios.post(`${API_URL}/resume-question`, {
      resumeText: text,
      askedQuestions: asked,
    });
    setQuestion(res.data.question);
    setAskedQuestions([...asked, res.data.question]);
    setStep(3);
    setTime(30);
    setTimeLeft(30);
    setStartTime(Date.now());
  };

  // Submit Answer
  const submitAnswer = async () => {
    const endTime = Date.now();

   const secondsTaken = Math.floor(
   (endTime - startTime) / 1000
     );
       const token = localStorage.getItem("token");

    const res = await axios.post(`${API_URL}/evaluate`, {
      question,
      answer,
      role,
    },
   {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setFeedback(res.data.feedback);
    setTimeTakenData(prev => [
  ...prev,
  {
    name: `Q${currentQ}`,
    time: secondsTaken,
  },
]);
    // score extract
    const match = res.data.feedback.match(/Score:\s*(\d+)/);
    const score = match ? parseInt(match[1]) : 0;

    setScores([...scores, score]);
    setSessionLog(prev => [
      ...prev,
      {
        question,
        answer,
        feedback: res.data.feedback,
        score,
        timeTaken: secondsTaken,
      },
    ]);

    setStep(4);
  };

  //=======================
  // EXPORT SESSION AS PDF
  //=======================
  const exportSessionPDF = () => {
    const doc = new jsPDF();
    const marginLeft = 14;
    let y = 20;

    doc.setFontSize(16);
    doc.text("Interview Session Report", marginLeft, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Role: ${role || "N/A"}`, marginLeft, y);
    y += 7;
    doc.text(`Average Score: ${avg}/10`, marginLeft, y);
    y += 7;
    doc.text(`Confidence: ${confidence}/10`, marginLeft, y);
    y += 10;

    sessionLog.forEach((entry, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(undefined, "bold");
      const qLines = doc.splitTextToSize(`Q${i + 1}: ${entry.question}`, 180);
      doc.text(qLines, marginLeft, y);
      y += qLines.length * 6 + 3;

      doc.setFont(undefined, "normal");
      doc.text(`Score: ${entry.score}/10  |  Time taken: ${entry.timeTaken}s`, marginLeft, y);
      y += 7;

      const feedbackLines = doc.splitTextToSize(entry.feedback, 180);
      if (y + feedbackLines.length * 6 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(feedbackLines, marginLeft, y);
      y += feedbackLines.length * 6 + 8;
    });

    doc.save(`interview-report-${Date.now()}.pdf`);
  };

  // 📈 Average Score
  const avg =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;

  // 🎯 Weak Areas
  const weak = results.filter((r) => r.score < 5);
  //listening
  const startListening = () => {

  const recognition =
    new window.webkitSpeechRecognition();

  recognition.continuous = false;

  recognition.lang = "en-US";

  recognition.onresult = (event) => {

    const transcript =
      event.results[0][0].transcript;

    setAnswer(transcript);
     // 🎯 filler words detection
    const fillerWords =
      transcript.match(/um|uh|like/gi);
          const fillerCount =
      fillerWords
        ? fillerWords.length
        : 0;

    console.log(
      "Filler Count:",
      fillerCount
    );
// 🎯 confidence score
   setConfidence(
  Math.max(
    10 - fillerCount,
    1
  )
);

    console.log(
      "Confidence:",
      confidence
    );

};

  recognition.start();
};

  return (
    <div className="min-h-screen bg-ink font-sans">

      {/* NAVBAR */}
      <nav className="border-b border-edge bg-ink/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span
            className="flex items-center gap-2 font-display text-[15px] font-semibold text-gray-100 cursor-pointer"
            onClick={() => setView("home")}
          >
            <span className="text-accent font-mono">{"{ }"}</span>
            AI Interview Simulator
          </span>

          <div className="flex items-center gap-6">
            <button
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              onClick={() => setView("home")}
            >
              Home
            </button>

            <button
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              onClick={goToPractice}
            >
              Practice
            </button>

            <button
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              onClick={goToDashboardStats}
            >
              Dashboard
            </button>

            {!isAuthenticated ? (
              <button
                className="text-sm font-medium bg-accent text-ink px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors"
                onClick={() => {
                  setIsLogin(true);
                  setView("login");
                }}
              >
                Log in
              </button>
            ) : (
              <button
                className="text-sm font-medium border border-edge text-gray-300 px-4 py-2 rounded-lg hover:border-gray-500 hover:text-gray-100 transition-colors"
                onClick={logoutUser}
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">

      {/* HOME PAGE */}
      {view === "home" && (
        <div className="grid lg:grid-cols-2 gap-14 items-center py-20 lg:py-28">
          <div>
            <p className="font-mono text-xs tracking-widest text-accent uppercase mb-4">
              AI-powered practice
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gray-50 leading-tight mb-5">
              Practice technical interviews that actually feel real.
            </h1>
            <p className="text-gray-400 text-[15px] leading-relaxed mb-8 max-w-md">
              Pick any role or language, answer timed questions, and get
              structured AI feedback on your strengths, weaknesses, and
              confidence — then track your progress over time.
            </p>
            <button
              className="bg-accent text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors"
              onClick={goToPractice}
            >
              {isAuthenticated ? "Start practicing" : "Get started"}
            </button>
          </div>

          <div className="rounded-xl border border-edge bg-surface p-7">
            <p className="font-mono text-xs tracking-widest text-accent uppercase mb-5">
              How it works
            </p>
            <div className="space-y-5">
              <div className="flex gap-4">
                <span className="font-display text-lg font-semibold text-accent shrink-0">01</span>
                <div>
                  <p className="text-gray-100 font-medium text-sm mb-0.5">Pick a role or stack</p>
                  <p className="text-gray-400 text-sm leading-relaxed">Frontend, backend, data science, or type in anything.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="font-display text-lg font-semibold text-accent shrink-0">02</span>
                <div>
                  <p className="text-gray-100 font-medium text-sm mb-0.5">Answer timed questions</p>
                  <p className="text-gray-400 text-sm leading-relaxed">Real interview pressure, real thinking time.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="font-display text-lg font-semibold text-accent shrink-0">03</span>
                <div>
                  <p className="text-gray-100 font-medium text-sm mb-0.5">Get structured feedback</p>
                  <p className="text-gray-400 text-sm leading-relaxed">Scores, confidence, and weak areas — tracked over time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN / SIGNUP */}
      {view === "login" && !isAuthenticated && (
        <div className="flex justify-center py-20">
          <div className="w-full max-w-sm rounded-2xl border border-edge bg-surface p-8">
            <h2 className="font-display text-xl font-semibold text-gray-50 mb-1">
              {isLogin ? "Log in" : "Create account"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isLogin
                ? "Welcome back. Enter your details to continue."
                : "Start practicing in under a minute."}
            </p>

            {!isLogin && (
              <input
                type="text"
                placeholder="Name"
                className="w-full bg-ink/60 border border-edge rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 mb-3 outline-none focus:border-accent transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full bg-ink/60 border border-edge rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 mb-3 outline-none focus:border-accent transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full bg-ink/60 border border-edge rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 mb-5 outline-none focus:border-accent transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="w-full bg-accent text-ink font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
              onClick={isLogin ? loginUser : signupUser}
            >
              {isLogin ? "Log in" : "Sign up"}
            </button>

            <p
              className="mt-5 text-sm text-gray-500 text-center cursor-pointer hover:text-gray-300 transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Log in"}
            </p>
          </div>
        </div>
      )}

   {/* INTERVIEW FLOW: role select -> question -> feedback -> completion */}
   {view === "interview" && isAuthenticated && (
  <div className="py-14">

      {/* PROGRESS */}
      {step >= 3 && step < 5 && (
        <div className="max-w-xl mx-auto mb-5 flex items-center justify-between">
          <span className="font-mono text-xs text-gray-500">
            Q{String(currentQ).padStart(2, "0")} / {String(TOTAL_QUESTIONS).padStart(2, "0")}
          </span>
          <div className="flex-1 mx-4 h-1.5 bg-edge rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${(currentQ / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
          <span className={`font-mono text-xs font-medium ${timerColor}`}>
            {formatTime(time)}
          </span>
        </div>
      )}

      {step < 5 && (
      <div className="max-w-xl mx-auto rounded-2xl border border-edge bg-surface p-6 sm:p-8">

        {/* ROLE */}
        {step === 1 && (
          <>
            <p className="font-mono text-xs tracking-widest text-accent uppercase mb-2">
              Step 1
            </p>
            <h2 className="font-display text-xl font-semibold text-gray-50 mb-5">
              What do you want to interview for?
            </h2>

            <input
              type="text"
              placeholder="Search roles..."
              className="w-full bg-ink/60 border border-edge rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 mb-4 outline-none focus:border-accent transition-colors"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-5 pr-1">
              {filteredRoles.map((r) => (
                <button
                  key={r}
                  className="text-left text-sm text-gray-300 border border-edge rounded-lg px-3 py-2.5 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
                  onClick={() => startInterview(r)}
                >
                  {r}
                </button>
              ))}
              {filteredRoles.length === 0 && (
                <p className="col-span-full text-sm text-gray-500">
                  No matches — try the custom field below.
                </p>
              )}
            </div>

            <div className="border-t border-edge pt-4">
              <p className="text-sm text-gray-500 mb-2">
                Don't see your stack? Type any role or language.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Rust Developer"
                  className="flex-1 bg-ink/60 border border-edge rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-accent transition-colors"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
                <button
                  className="bg-accent text-ink text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-dim disabled:opacity-40 disabled:hover:bg-accent transition-colors"
                  disabled={!customRole.trim()}
                  onClick={() => startInterview(customRole.trim())}
                >
                  Start
                </button>
              </div>
            </div>

            <div className="border-t border-edge pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Or generate questions tailored to your resume.
              </p>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files[0] || null)}
                  className="flex-1 text-sm text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-edge file:bg-surface2 file:text-gray-300 file:text-sm"
                />
                <button
                  className="bg-accent text-ink text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-dim disabled:opacity-40 disabled:hover:bg-accent transition-colors"
                  disabled={!resumeFile || resumeUploading}
                  onClick={uploadResumeAndStart}
                >
                  {resumeUploading ? "Reading resume..." : "Start"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* QUESTION */}
        {step === 3 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-xs tracking-widest text-accent uppercase">
                {role}
              </p>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-gray-400 hover:text-gray-100 transition-colors"
                  onClick={() => speakText(question)}
                >
                  Replay question
                </button>
                <button
                  className="text-xs text-gray-400 hover:text-gray-100 transition-colors"
                  onClick={() => {
                    if (ttsEnabled) window.speechSynthesis?.cancel();
                    setTtsEnabled(!ttsEnabled);
                  }}
                >
                  Voice: {ttsEnabled ? "On" : "Off"}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-ink/40 p-4 mb-4">
              <p className="font-mono text-[13px] text-gray-200 leading-relaxed">
                &gt; {question}
              </p>
            </div>

            <textarea
              className="w-full bg-ink/60 border border-edge rounded-lg p-3 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-accent transition-colors min-h-[120px] mb-3"
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="flex-1 border border-edge text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:border-gray-500 hover:text-gray-100 transition-colors"
                onClick={startListening}
              >
                Speak answer
              </button>
              <button
                className="flex-1 bg-accent text-ink text-sm font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
                onClick={submitAnswer}
              >
                Submit
              </button>
            </div>
          </>
        )}

        {/* FEEDBACK */}
        {step === 4 && (
          <>
            <p className="font-mono text-xs tracking-widest text-accent uppercase mb-2">
              Feedback
            </p>
            <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-300 font-mono bg-ink/40 border border-edge p-4 rounded-xl max-h-72 overflow-y-auto">
              {feedback}
            </div>
            <button
              className="mt-4 w-full bg-accent text-ink text-sm font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
              onClick={() => {
                if (currentQ < TOTAL_QUESTIONS) {
                  setCurrentQ(currentQ + 1);
                  setAnswer("");
                  if (resumeMode) {
                    getResumeQuestion(resumeText, askedQuestions);
                  } else {
                    getQuestion(role);
                  }
                } else {
                  setStep(5);
                }
              }}
            >
              {currentQ < TOTAL_QUESTIONS ? "Next question" : "See results"}
            </button>
          </>
        )}
      </div>
      )}

      {/* COMPLETION PAGE */}
      {step === 5 && (
        <div className="max-w-3xl mx-auto">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-xs tracking-widest text-accent uppercase mb-2">
                Session complete
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gray-50">
                Here's how you did
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                className="border border-edge text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:border-gray-500 hover:text-gray-100 transition-colors"
                onClick={exportSessionPDF}
              >
                Download PDF
              </button>
              <button
                className="border border-edge text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:border-gray-500 hover:text-gray-100 transition-colors"
                onClick={goToDashboardStats}
              >
                View dashboard
              </button>
              <button
                className="bg-accent text-ink text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
                onClick={() => {
                  setStep(1);
                  setCurrentQ(1);
                  setScores([]);
                }}
              >
                New session
              </button>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-edge bg-surface p-5 text-center">
              <p className="font-mono text-[11px] tracking-widest text-gray-500 uppercase mb-1">
                Average score
              </p>
              <p className="font-display text-3xl font-semibold text-accent">
                {avg}
                <span className="text-sm text-gray-500">/10</span>
              </p>
            </div>
            <div className="rounded-xl border border-edge bg-surface p-5 text-center">
              <p className="font-mono text-[11px] tracking-widest text-gray-500 uppercase mb-1">
                Confidence
              </p>
              <p className="font-display text-3xl font-semibold text-amber">
                {confidence}
                <span className="text-sm text-gray-500">/10</span>
              </p>
            </div>
            <div className="rounded-xl border border-edge bg-surface p-5 text-center">
              <p className="font-mono text-[11px] tracking-widest text-gray-500 uppercase mb-1">
                Questions
              </p>
              <p className="font-display text-3xl font-semibold text-gray-100">
                {scores.length}
              </p>
            </div>
          </div>

          {/* SCORE BREAKDOWN */}
          <div className="rounded-xl border border-edge bg-surface p-5 mb-6">
            <p className="text-sm font-medium text-gray-300 mb-4">
              Score per question
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {scores.map((s, i) => (
                <span
                  key={i}
                  className={`font-mono text-xs px-2.5 py-1 rounded-md border ${
                    s >= 7
                      ? "border-accent/40 text-accent bg-accent/5"
                      : s >= 4
                      ? "border-amber/40 text-amber bg-amber/5"
                      : "border-danger/40 text-danger bg-danger/5"
                  }`}
                >
                  Q{i + 1} · {s}/10
                </span>
              ))}
            </div>
            <div className="flex justify-center">
              {sessionScoreData.length > 0 ? (
                <LineChart width={560} height={200} data={sessionScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                  <XAxis dataKey="name" stroke="#8A7460" fontSize={12} />
                  <YAxis stroke="#8A7460" fontSize={12} domain={[0, 10]} />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E8DCC8", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#3A2C1E" }} />
                  <Line type="monotone" dataKey="score" stroke="#D85A30" strokeWidth={2} dot={{ fill: "#D85A30", r: 3 }} />
                </LineChart>
              ) : (
                <p className="text-gray-500 text-sm py-10">No data available</p>
              )}
            </div>
          </div>

          {/* TIME ANALYSIS */}
          <div className="rounded-xl border border-edge bg-surface p-5 mb-4">
            <p className="text-sm font-medium text-gray-300 mb-1">
              Time per question
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Questions taking longer than 20s often signal lower confidence.
            </p>
            <div className="flex justify-center">
              <BarChart width={560} height={200} data={timeTakenData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis dataKey="name" stroke="#8A7460" fontSize={12} />
                <YAxis stroke="#8A7460" fontSize={12} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E8DCC8", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#3A2C1E" }} />
                <Bar dataKey="time" fill="#C97D1D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </div>
          </div>

        </div>
      )}
  </div>
  )}

  {/* DASHBOARD: weak areas + daily analysis, available any time via navbar */}
  {view === "stats" && isAuthenticated && (
    <div className="py-14 max-w-3xl mx-auto">
      <p className="font-mono text-xs tracking-widest text-accent uppercase mb-2">
        Your dashboard
      </p>
      <h2 className="font-display text-2xl font-semibold text-gray-50 mb-8">
        Weak areas and long-term progress
      </h2>

      {/* WEAK AREAS */}
      <div className="rounded-xl border border-edge bg-surface p-5 mb-6">
        <p className="text-sm font-medium text-gray-300 mb-4">Weak areas</p>
        {weak && weak.length === 0 ? (
          <p className="text-accent text-sm">No weak areas flagged yet.</p>
        ) : (
          <div className="space-y-2">
            {weak.map((w, i) => (
              <p
                key={i}
                className="text-sm text-gray-300 border-l-2 border-danger bg-danger/5 pl-3 py-1.5 rounded-r"
              >
                {w.question}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* DAILY IMPROVEMENT */}
      <div className="rounded-xl border border-edge bg-surface p-5">
        <p className="text-sm font-medium text-gray-300 mb-4">
          Daily improvement
        </p>
        <div className="flex justify-center">
          {dailyData && dailyData.length > 0 ? (
            <LineChart width={560} height={220} data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
              <XAxis dataKey="date" stroke="#8A7460" fontSize={12} />
              <YAxis stroke="#8A7460" fontSize={12} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E8DCC8", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#3A2C1E" }} />
              <Line type="monotone" dataKey="avgScore" stroke="#D85A30" strokeWidth={2} dot={{ fill: "#D85A30", r: 3 }} />
            </LineChart>
          ) : (
            <p className="text-gray-500 text-sm py-10">No sessions yet — complete an interview to see progress here.</p>
          )}
        </div>
      </div>
    </div>
  )}

      </div>
    </div>
  );
}

export default App;