const jwt = require("jsonwebtoken");
const cookie = require("cookie");

module.exports = (socket, next) => {
  try {
    const cookies = cookie.parse(
      socket.handshake.headers.cookie || ""
    );

    const token = cookies.token || socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id; // 🔒 TRUSTED
    socket.username = decoded.username || 'Player';
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
};
