const express = require("express");

const router = express.Router();

const serviceController = require('../controller/service_record');

router.post('/blockchaininvoke', serviceController.blockChainInvoke);
router.post('/blockchainquery', serviceController.blockChainQuery);

module.exports = router;
