const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { joinQueue } = require('../controllers/duel.controller');

router.post('/join', auth, joinQueue);

module.exports = router;
