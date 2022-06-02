
const express = require("express");

const router = express.Router();

const parkingReceiptController = require('../controller/parking_receipt');

router.post('', parkingReceiptController.addParkingReceipt);
router.get('/identifier/:registration_no/:parking_date', parkingReceiptController.getIdentifier);
router.post("/checkcurrentshare", parkingReceiptController.checkCurrentShare);
router.post('/retrieveparkingreceipt', parkingReceiptController.getFileFromS3);
router.post('/getallrecordbyuser',parkingReceiptController.getAllParkingReceiptByUser);
router.post('/getrecordbyid', parkingReceiptController.getRecordById);
router.post('/getrecordbyuserregisno', parkingReceiptController.getRecordByUserAndRegistrationNo);
router.get('/appfilepreview/:parking_doc_id', parkingReceiptController.appFilePreview);
router.post('/sendemail', parkingReceiptController.sendEmail);

module.exports = router;
