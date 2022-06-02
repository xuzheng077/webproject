const express = require("express");

const router = express.Router();

const notificationController = require('../controller/notification');

router.post('/gettwoclosest', notificationController.getTwoClosestNotification);
router.post('/calendar', notificationController.getNotificationForCalendar);


module.exports = router;