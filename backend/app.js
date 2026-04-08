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

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
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
