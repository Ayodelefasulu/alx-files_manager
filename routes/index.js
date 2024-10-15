// routes/index.js
const express = require('express');
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

//add new POST /users route
router.post('/users', UsersController.postNew);

//Auth endpoints
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

// User endpoints
router.get('/users/me', UsersController.getMe);

module.exports = router;
