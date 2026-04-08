const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");
const leaderboardRoutes = require('./src/routes/leaderboard.routes');
const matchRoutes = require("./src/routes/match.routes");
const adminRoutes = require("./src/routes/admin.routes");
const userRoutes = require("./src/routes/user.routes");
const executeRoutes = require("./src/routes/execute.routes");


//const duelRoutes = require('./src/routes/duel.routes');


const app = express();

app.set("trust proxy", 1); // crucial for Render deployed secure cookies

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  (process.env.CLIENT_URL || "").replace(/\/$/, ""),
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin.replace(/\/$/, "")) || origin.endsWith(".vercel.app");
      
      if (!isAllowed) {
        console.warn(`⚠️ CORS blocked for origin: ${origin}. Allowed origins are:`, allowedOrigins);
      }
      
      callback(null, true); // Allow all during transition
    },
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api", executeRoutes); // Mounts /api/run and /api/submit
//app.use('/api/duel', duelRoutes);


module.exports = app;
