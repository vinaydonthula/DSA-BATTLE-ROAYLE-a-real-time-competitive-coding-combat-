const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { getGlobalLeaderboard } = require('../controllers/leaderboard.controller');

router.get('/global', auth, getGlobalLeaderboard);

module.exports = router;
