require("dotenv").config();

const http = require("http");
const app = require("./app");
const initSocket = require("./src/socket");
const sequelize = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Attach Socket.IO to THIS server
initSocket(server);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected");

    // ✅ START THE SAME SERVER
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
