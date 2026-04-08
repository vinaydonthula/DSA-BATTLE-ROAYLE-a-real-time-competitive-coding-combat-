const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { getUserStats } = require("../controllers/analytics.controller");

router.get("/dashboard", auth, getUserStats);

module.exports = router;
