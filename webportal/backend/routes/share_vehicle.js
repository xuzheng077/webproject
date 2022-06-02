const express = require("express");

const router = express.Router();

const shareController = require('../controller/share_vehicle');

router.post('/check', shareController.checkSharedInfo);
router.post('/submit', shareController.insertShareInfo);
router.post('/update', shareController.updateShareInfo);
router.get('/sharedcompanylist/:vid',shareController.sharedCompanyList);
router.get('/sharedvehiclelist/:cid',shareController.sharedVehicleList);
router.get('/sharedetailapp/:sid',shareController.detailedShareApp);

router.post('/webdetailuser',shareController.webDetailUser);
router.post('/webdetailvehicle', shareController.webDetailVehicle);
router.post('/webdetailregistrationimage', shareController.webDetailRegistrationImage);
router.post('/webdetailservice', shareController.webDetailService);
router.post('/webdetailregistration', shareController.webDetailRegistration);
router.post('/webdetailsetreminder', shareController.webSetRegistrationReminder);
router.post('/webdetailinsurance', shareController.webDetailInsurance);
router.post('/webdetailclaim', shareController.webDetailClaim);
router.post('/webdetailparkingreceipt', shareController.webDatailParkingReceipt);
router.post('/webdetailfuelreceipt', shareController.webDetailFuelReceipt);


module.exports = router;
