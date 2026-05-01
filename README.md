# LifeOS 🌟

A beautiful, full-featured productivity suite to organize your daily life — track tasks, goals, habits, diary entries, reminders, and more with gamification!

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb)

## ✨ Features

- **Dashboard** — Overview of your productivity stats at a glance
- **Tasks** — Create, manage, and track daily tasks with priorities
- **Goals** — Set and track long-term goals with progress
- **Habits** — Build and maintain positive habits with streak tracking
- **Calendar** — Visual calendar with event management
- **Diary** — Journal entries with mood tracking and attachments
- **Reminders** — Never miss important events with recurring reminders
- **Notes** — Quick notes for capturing ideas
- **Gamification** — XP, levels, and streaks to keep you motivated
- **Settings** — Customizable accent colors and preferences

## 🛠️ Tech Stack

| Layer    | Technology              |
|----------|------------------------|
| Frontend | React 19, Vite 8       |
| Backend  | Express.js, Node.js    |
| Database | MongoDB / In-Memory DB |
| Styling  | Custom CSS (Dark Mode) |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (optional — falls back to in-memory DB)

### Step 1: Clone the repo
```bash
git clone https://github.com/Aarya5023138/LifeOs.git
cd LifeOs
```

### Step 2: Start the Backend 🧠
```bash
cd server
npm install
npm run dev
```
> You should see "LifeOS server running". Keep this terminal open!

### Step 3: Start the Frontend ✨
Open a **new terminal**:
```bash
cd client
npm install
npm run dev
```

### Step 4: Open the App! 🎉
Visit **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 🌐 Deployment

### Frontend (Vercel)
1. Import this repo in [Vercel](https://vercel.com)
2. Set the following in Vercel project settings:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
3. Add environment variable:
   - `VITE_API_URL` = your deployed backend URL (e.g. `https://your-api.onrender.com/api`)

### Backend (Render / Railway)
1. Deploy the `server/` directory to [Render](https://render.com) or [Railway](https://railway.app)
2. Set environment variables:
   - `PORT` = `5001`
   - `MONGODB_URI` = your MongoDB Atlas connection string

---

## 📁 Project Structure
```
lifeos/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   └── App.jsx
│   └── package.json
├── server/          # Express backend
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── package.json
├── vercel.json      # Vercel deployment config
└── README.md
```

## 📄 License

This project is for personal/educational use.
