const express = require("express");

const router = express.Router();

const fuelController = require('../controller/fuel_receipt');

router.post('', fuelController.addFuelReceipt);
router.get('/identifier/:registration_no/:fuel_add_date', fuelController.getIdentifier);
router.post("/checkcurrentshare", fuelController.checkCurrentShare);
router.post('/retrievefuelreceipt', fuelController.getFileFromS3);
router.post('/getallrecordbyuser',fuelController.getAllFuelReceiptByUser);
router.post('/getrecordbyid', fuelController.getRecordById);
router.post('/getrecordbyuserregisno', fuelController.getRecordByUserAndRegistrationNo);
router.get('/appfilepreview/:fuel_doc_id', fuelController.appFilePreview);
router.post('/sendemail', fuelController.sendEmail);

module.exports = router;
