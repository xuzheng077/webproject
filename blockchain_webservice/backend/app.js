const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');

const serviceRecordRoutes = require("./routes/service_record");

const app = express();

app.use(fileUpload());

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

app.use("/api/v1/servicerecords", serviceRecordRoutes);

module.exports = app;
