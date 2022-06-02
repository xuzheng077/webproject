const express = require("express");

const router = express.Router();

const driveLogController = require('../controller/drive_log');

router.post('/currentsharedetail', driveLogController.getCurrentShareDetail);
router.post('/savedrivelog', driveLogController.saveDriveLog);
router.post('/recentlogbyvid', driveLogController.getRecentLogByVid);
router.post('/recentlogbycompany', driveLogController.getRecentLogByCname);
router.post('/showclaims', driveLogController.getClaimsByCompany);
router.post('/getallrecordbyuser', driveLogController.getAllDriverLogByUser);
router.post('/getrecordbyid', driveLogController.getRecordById);
router.post('/getrecordbyuserregisno', driveLogController.getRecordByUserAndRegistrationNo);
router.post('/sendemail', driveLogController.sendEmail);

module.exports = router;
