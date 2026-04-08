const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { register, login, logout } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
 