
const express = require("express");

const router = express.Router();

const driverLicenseController = require('../controller/driver_license');

router.post('', driverLicenseController.addDriverLicense);
router.post('/getdriverlicense', driverLicenseController.getDriverLicense);
router.get('/identifier/:user_name/:user_id', driverLicenseController.getIdentifier);
router.post('/retrievedriverlicense', driverLicenseController.getFileFromS3);

module.exports = router;
