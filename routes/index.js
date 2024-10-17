// routes/index.js
const express = require('express');
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

//addeded new POST /users route
router.post('/users', UsersController.postNew);

//Auth endpoints
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

// User endpoints
router.get('/users/me', UsersController.getMe);

// added the POST /files route
router.post('/files', FilesController.postUpload);

// getshow and getidex
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

// added routes for publishing and unpublishing files
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// added the route for retrieving file data
router.get('/files/:id/data', FilesController.getFile);

module.exports = router;
