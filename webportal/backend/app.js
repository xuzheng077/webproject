const express = require('express');
const bodyParser = require('body-parser');
const mysql = require("mysql");
const fileUpload = require('express-fileupload');
const path = require('path');
var config = require('./config');

const customerRoutes = require("./routes/customer");
const countryRoutes = require("./routes/country");
const stateRoutes = require("./routes/state");
const userRoutes = require("./routes/user");
const serviceRoutes = require("./routes/service");
const vehicleRoutes = require("./routes/vehicle");
const serviceRecordRoutes = require("./routes/service_record");
const insuranceRecordRoutes = require("./routes/insurance_record");
const parkingReceiptRoutes = require("./routes/parking_receipt");
const registrationRecordRoutes = require("./routes/registration_record");
const fuelReceiptRoutes = require("./routes/fuel_receipt");
const driverLicenseRoutes = require("./routes/driver_license");
const shareVehicleRoutes = require("./routes/share_vehicle");
const driveLogRoutes = require("./routes/drive_log");
const notificationRoutes = require('./routes/notification');

const app = express();

app.use(fileUpload());

app.use(express.static(path.join(__dirname+'/public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin,X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE,PUT, PATCH, OPTIONS");
  next();
})

//Database connection
app.use((req, res, next) => {
	res.locals.connection = mysql.createConnection({
    host: config.database_host,
    port: config.database_port,
		user: config.database_username,
		password: config.database_password,
    database: config.database_dbname,
    timezone: config.database_timezone
  });
  res.locals.connection.connect();
	next();
});
// app.use((req, res, next) => {
// 	res.locals.connection = mysql.createConnection({
//     host: process.env.dbhost,
//     port: '3306',
// 		user: process.env.dbuser,
// 		password: process.env.dbpassword,
// 		database: 'wisecardevdb'
//   });
//   res.locals.connection.connect();
// 	next();
// });


app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/countries", countryRoutes);
app.use("/api/v1/states", stateRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/servicerecords", serviceRecordRoutes);
app.use("/api/v1/insurancerecords", insuranceRecordRoutes);
app.use("/api/v1/parkingreceipts", parkingReceiptRoutes);
app.use("/api/v1/registrationrecords", registrationRecordRoutes);
app.use("/api/v1/fuelreceipts", fuelReceiptRoutes);
app.use("/api/v1/driverlicense", driverLicenseRoutes);
app.use("/api/v1/sharevehicle", shareVehicleRoutes);
app.use("/api/v1/drivelog", driveLogRoutes);
app.use("/api/v1/notification", notificationRoutes);


module.exports = app;
