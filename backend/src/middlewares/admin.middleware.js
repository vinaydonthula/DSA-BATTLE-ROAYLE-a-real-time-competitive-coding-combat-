const jwt = require("jsonwebtoken");
const { ADMIN_JWT_SECRET } = require("../config/jwt");

module.exports = function adminAuth(requiredRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Admin token missing" });
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

      // Role check
      if (
        requiredRoles.length &&
        !requiredRoles.includes(decoded.role)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      req.admin = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid admin token" });
    }
  };
};
