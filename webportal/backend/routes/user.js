const express = require("express");

const router = express.Router();

const userController = require('../controller/user');

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.get('/:userId', userController.getUserInfo);

router.post('/updateprofile', userController.updateUserProfile);

router.post('/getprofile', userController.getProfile);

module.exports = router;
