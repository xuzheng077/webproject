
const express = require("express");

const router = express.Router();

const insuranceController = require('../controller/insurance_record');


router.post('', insuranceController.addInsuranceRecord);
router.get('/identifier/:registration_no/:insurance_add_date', insuranceController.getIdentifier);
router.get('/upload', insuranceController.getUploadPage);
router.post('/insurancecompanyupload', insuranceController.insuranceCompanyUpload);
router.post('/retrieveinsurancerecord', insuranceController.getFileFromS3);
router.post('/getallrecordbyuser', insuranceController.getAllInsuranceRecordByUser);
router.post('/getrecordbyid', insuranceController.getRecordById);
router.post('/getrecordbyuserregisno', insuranceController.getRecordByUserAndRegistrationNo);
router.get('/appfilepreview/:insurance_doc_id', insuranceController.appFilePreview);
router.post('/sendemail', insuranceController.sendEmail);

module.exports = router;
