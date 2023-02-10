const router = require('express').Router();
const authController = require('../controllers/authController');
const loginLimiter = require('../middleware/loginLimiter');
const verifyJwt = require('../middleware/verifyJwt');

router.route('/')
  .post(loginLimiter, authController.login )

router.route('/refresh')
  .get(authController.refresh)

router.route('/logout')
  .post(authController.logout)

module.exports = router;