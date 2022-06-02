const express = require("express");

const router = express.Router();

const serviceController = require('../controller/service');

router.get('', serviceController.getServices);
router.get('/:vid', serviceController.getServiceByVid);
router.post('/getservicebyuid', serviceController.getServiceByUid);

module.exports = router;
