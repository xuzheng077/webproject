const express = require("express");

const router = express.Router();

const vehicleController = require('../controller/vehicle');

router.post('', vehicleController.addVehicle);
router.get('/:vid', vehicleController.getVehicle);
router.get('/user/:uid', vehicleController.getUserVehicles);
router.put('/:vid', vehicleController.updateVehicle);
router.delete('/:vid', vehicleController.deleteVehicle);

module.exports = router;
