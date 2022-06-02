const express = require("express");

const router = express.Router();

const registrationController = require('../controller/registration_record');

router.post('', registrationController.addRegistrationRecord);
router.get('/identifier/:registration_no/:registration_date', registrationController.getIdentifier);
router.get('/upload', registrationController.getUploadPage);
router.post('/userwebupload', registrationController.userWebUpload);
router.post('/retrieveregistrationrecord', registrationController.getFileFromS3);
router.post('/getallrecordbyuser', registrationController.getAllRegistrationRecordByUser);
router.post('/getrecordbyid', registrationController.getRecordById);
router.post('/getrecordbyuserregisno', registrationController.getRecordByUserAndRegistrationNo);
router.get('/appfilepreview/:reg_doc_id', registrationController.appFilePreview);
router.post('/sendemail', registrationController.sendEmail);

module.exports = router;
