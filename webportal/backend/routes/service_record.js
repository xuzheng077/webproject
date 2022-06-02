const express = require("express");

const router = express.Router();

const serviceController = require('../controller/service_record');

router.post('', serviceController.addServiceRecord);
router.get('/identifier/:registration_no/:service_date', serviceController.getIdentifier);
router.get('/options/:make_id/:model_id', serviceController.getOptions);
router.get('/upload', serviceController.getUploadPage);
router.post('/servicecenterupload', serviceController.serviceCenterUpload);
router.post('/retrieveservicerecord', serviceController.getFileFromS3);
router.post('/getallrecordbyuser', serviceController.getAllServiceRecordByUser);
router.post('/getrecordbyid', serviceController.getRecordById);
router.post('/getrecordbyuserregisno', serviceController.getRecordByUserAndRegistrationNo);
router.get('/appfilepreview/:svc_doc_id', serviceController.appFilePreview);
router.post('/sendemail', serviceController.sendEmail);

module.exports = router;
