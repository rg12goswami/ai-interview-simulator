# AI Interview Simulator

An AI-powered mock interview platform that helps developers practice technical interviews, analyze performance, track weak areas, and improve communication and problem-solving skills through real-time feedback and analytics.

---

##  Features

* AI-generated interview questions
* Technical interview simulation
* Real-time answer evaluation
* Performance scoring system
* Weak area analysis
* JWT Authentication
* User login & signup system
* Interactive dashboard
* Analytics and progress charts
* Timer-based interview rounds
* Responsive modern UI
* MongoDB database integration
* Protected routes and secure APIs

---

##  Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* JWT Authentication
* REST APIs

### Database

* MongoDB Atlas

---



---

##  Folder Structure

```bash
AI-Interview-Simulator/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
│
├── server/
│   ├── middleware/
│   ├── models/
│   └── config/
│
├── package.json
└── README.md
```

---

##  Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/rg12goswami/ai-interview-simulator.git
```

### 2. Navigate into the project

```bash
cd AI-Interview-Simulator
```

### 3. Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd server
npm install
```

---

##  Environment Variables

Create a `.env` file inside the server folder and add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

---

##  Run the Project

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

```bash
cd client
npm start
```

---

##  How It Works

1. User signs up or logs in securely.
2. The platform generates interview questions.
3. User attempts mock interview rounds.
4. Answers are analyzed and scored.
5. Performance analytics and weak areas are displayed.
6. Users can track improvement over time.

---

##  Authentication & Security

* JWT-based authentication
* Secure API handling
* Environment variable protection

---

##  Future Improvements

* AI-generated feedback using GroqAI APIs
* Voice-based interviews
---

##  Deployment

### Frontend Deployment

* Vercel


### Backend Deployment

* Render
  

### Database

* MongoDB Atlas

---

##  Why This Project?

This project was built to solve a real problem faced by developers and students preparing for technical interviews. It combines full-stack development, authentication, APIs, analytics, and modern UI concepts into one scalable application.

---

## Author

### Riddam Goswami

Full Stack Developer passionate about building scalable web applications and AI-powered tools.

* React.js
* Node.js
* Express.js
* MongoDB
* JavaScript

---

## ⭐ Support

If you liked this project, give it a star on GitHub.
