const express = require("express");
const router = express.Router();
const { getMatchById } = require("../controllers/match.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/:matchId", auth, getMatchById);

module.exports = router;
