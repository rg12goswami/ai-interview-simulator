import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis , Tooltip,
  CartesianGrid , Bar ,BarChart } from "recharts";

function App() {
  const [isLogin, setIsLogin] = useState(true);

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [dailyData, setDailyData] = useState([]);

const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [question, setQuestion] = useState("");
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
  const [data, setData] = useState([]);
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
  //==================
  //LOGIN
  // ==================
  const loginUser = async () => {
  try {
    const res = await axios.post(
      "https://ai-interview-simulator-aknp.onrender.com/login",
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
    fetchDailyAnalysis();

  } catch (err) {
    alert("Login failed");
  }
};
//=======================
//SIGNUP
//=======================
const signupUser = async () => {
  try {
    await axios.post(
      "https://ai-interview-simulator-aknp.onrender.com/signup",
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
    "https://ai-interview-simulator-aknp.onrender.com/daily-analysis",
    {
      headers: {
        Authorization: token,
      },
    }
  );

  setDailyData(res.data);
};

  // 📊 FETCH RESULTS
  const fetchResults = async () => {
  try {
    const res = await axios.get("https://ai-interview-simulator-aknp.onrender.com/results");

    // 🔥 safety check
    if (!res.data || res.data.length === 0) {
      setResults([]);
      setData([]);
      return;
    }

    setResults(res.data);

    const formatted = res.data.map((item, index) => ({
      name: `Q${index + 1}`,
      score: item.score,
    }));

    setData(formatted);

  } catch (err) {
    console.log("Fetch error:", err);
    setResults([]);
    setData([]);
  }
};

  // Fetch Question
  const getQuestion = async (selectedRole) => {
    const res = await axios.get(
      `https://ai-interview-simulator-aknp.onrender.com/question?role=${selectedRole}`
    );
    setQuestion(res.data.question);
    setStep(3);
    setTime(30); // reset timer
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

    const res = await axios.post("https://ai-interview-simulator-aknp.onrender.com/evaluate", {
      question,
      answer,
      role,
    },
   {
      headers: {
        Authorization: token,
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

    setStep(4);
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
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-500 flex flex-col items-center justify-center">
      {!isAuthenticated && (
  <div className="bg-white p-6 rounded-2xl shadow-xl w-96 text-center mb-6">

    <h2 className="text-2xl font-bold mb-4">
      {isLogin ? "Login" : "Signup"}
    </h2>

    {!isLogin && (
      <input
        type="text"
        placeholder="Name"
        className="w-full border p-2 rounded-lg mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    )}

    <input
      type="email"
      placeholder="Email"
      className="w-full border p-2 rounded-lg mb-3"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      type="password"
      placeholder="Password"
      className="w-full border p-2 rounded-lg mb-3"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <button
      className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-700"
      onClick={
        isLogin
          ? loginUser
          : signupUser
      }
    >
      {isLogin ? "Login" : "Signup"}
    </button>

    <p
      className="mt-4 text-sm text-blue-500 cursor-pointer"
      onClick={() =>
        setIsLogin(!isLogin)
      }
    >
      {isLogin
        ? "Don't have an account? Signup"
        : "Already have an account? Login"}
    </p>
  </div>
)}
   {isAuthenticated && (
  <>

      <h1 className="text-4xl font-bold text-white mb-6">
        AI Interview Simulator 🚀
      </h1>

      {/* PROGRESS */}
      {step >= 3 && (
        <div className="w-96 mb-4 text-white">
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${(currentQ / TOTAL_QUESTIONS) * 100}%` }}
            ></div>
          </div>
          <p>Question {currentQ}/{TOTAL_QUESTIONS}</p>
          <p>⏱ Time Left: {time}s</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 text-center">

        {/* ROLE */}
        {step === 1 && (
          <>
            <h2>Select Role</h2>
            <button className="bg-gradient-to-r mr-3 from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all" onClick={() => { setRole("frontend"); getQuestion("frontend"); }}>
              Frontend
            </button>
            <button className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all" onClick={() => { setRole("backend"); getQuestion("backend"); }}>
              Backend
            </button>
          </>
        )}

        {/* QUESTION */}
        {step === 3 && (
          <>
            <p>{question}</p>
            <textarea
              className="w-full border p-2"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button className="w-full mb-2 bg-green-500 text-white px-4 py-3 rounded-xl shadow-md hover:bg-green-600 hover:scale-105 transition-all" onClick={startListening}>
🎤 Start Speaking
</button>

            <button  className="w-full bg-green-500 text-white px-4 py-3 rounded-xl shadow-md hover:bg-green-600 hover:scale-105 transition-all" onClick={submitAnswer}>Submit</button>
          </>
        )}

        {/* FEEDBACK */}
        {step === 4 && (
          <>
            <div className="whitespace-pre-wrap break-words text-left bg-gray-100 p-4 rounded-xl max-h-64 overflow-y-auto">
  {feedback}
</div>
            <button className="mt-4 w-full bg-blue-500 text-white px-4 py-3 rounded-xl shadow-md hover:bg-blue-600 hover:scale-105 transition-all"
              onClick={() => {
                if (currentQ < TOTAL_QUESTIONS) {
                  setCurrentQ(currentQ + 1);
                  setAnswer("");
                  getQuestion(role);
                } else {
                  fetchResults(); // 🔥 important
                  setStep(5);
                }
              }}
            >
              Next
            </button>
          </>
        )}

        {/* FINAL DASHBOARD */}
        {step === 5 && (
          <>
            <h2 className="text-xl font-bold mb-2">
      Interview Completed 🎉
    </h2>


            {/* 📈 AVG */}
              <p className="mb-3 font-semibold text-gray-700">
      Average Score: {avg}
    </p>
    <h2 className="text-xl font-bold mt-6">
  Confidence Analysis 🎤
</h2>

<p className="text-green-600 font-semibold">
  Confidence Score: {confidence}/10
</p>


            {/* 📊 CHART */}
            <div className="flex justify-center mt-4">
      {data && data.length > 0 ? (
        <LineChart width={300} height={200} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="score" />
        </LineChart>
      ) : (
        <p className="text-gray-500">No data available 📭</p>
      )}
    </div>
            {/* 🎯 WEAK AREAS */}
             <div className="mt-4">
      <h3 className="font-semibold">Weak Areas</h3>

      {weak && weak.length === 0 ? (
        <p className="text-green-600">None 🎉</p>
      ) : (
        weak.map((w, i) => (
          <p key={i} className="text-red-500 text-sm">
            {w.question}
          </p>
        ))
      )}
    </div> 
     <h2 className="text-xl font-bold mb-4">
  Time Analysis ⏱
</h2>

<BarChart
  width={350}
  height={250}
  data={timeTakenData}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  
  <Bar dataKey="time" fill="#8884d8" />
</BarChart> 
<p  className="text-red-500 text-sm">"Questions taking longer 20 sec are weak confidence areas"</p>
     <h2 className="text-xl font-bold mt-6 mb-4">
  Daily Improvement 📈
</h2>


<div className="flex justify-center">
  <LineChart
    width={350}
    height={250}
    data={dailyData}
  >
    <CartesianGrid strokeDasharray="3 3" />

    <XAxis dataKey="date" />

    <YAxis />

    <Tooltip />

    <Line
      type="monotone"
      dataKey="avgScore"
      stroke="#8884d8"
    />
  </LineChart>
</div>


            <button  className="mt-4 w-full bg-purple-500 text-white px-4 py-3 rounded-xl shadow-md hover:bg-purple-600 hover:scale-105 transition-all"
              onClick={() => {
                setStep(1);
                setCurrentQ(1);
                setScores([]);
              }}
            >
              Restart
            </button>
          </>
        )}
      </div>
       </>
  )}
    </div>
  );
}

export default App;