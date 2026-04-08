const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/admin.middleware");

// LOGIN
router.post("/login", adminController.login);

// Example protected route
router.get(
  "/me",
  adminAuth(["admin", "superadmin", "problem_setter"]),
  (req, res) => {
    res.json({ admin: req.admin });
  }
);

// Problem Management
router.get(
  "/problems",
  adminAuth(["admin", "superadmin", "problem_setter"]),
  adminController.getProblems
);

router.post(
  "/problems",
  adminAuth(["admin", "superadmin", "problem_setter"]),
  adminController.createProblem
);

router.put(
  "/problems/:id",
  adminAuth(["admin", "superadmin", "problem_setter"]),
  adminController.updateProblem
);

router.delete(
  "/problems/:id",
  adminAuth(["admin", "superadmin", "problem_setter"]),
  adminController.deleteProblem
);

module.exports = router;
