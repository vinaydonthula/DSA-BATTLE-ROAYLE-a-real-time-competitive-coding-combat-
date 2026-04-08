const express = require("express");
const { runCode, submitCode } = require("../controllers/execute.controller");

const router = express.Router();

router.post("/run", runCode);
router.post("/submit", submitCode);

module.exports = router;
