const express = require("express");

const router = express.Router();

const countryController = require('../controller/country');

router.get('', countryController.getCountries);

module.exports = router;
