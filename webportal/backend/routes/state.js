const express = require("express");

const router = express.Router();

const stateController = require('../controller/state');

router.get('', stateController.getStates);

module.exports = router;
