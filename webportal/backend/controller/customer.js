const jwt = require("jsonwebtoken");
const crypto = require("crypto");
var SES = require('aws-sdk/clients/ses');
var config = require('../config');
const source_email = config.ses_email_address;
var ses = new SES({
  accessKeyId: config.ses_accesskeyid,
  secretAccessKey: config.ses_secretaccesskey,
  region: config.ses_region
});


exports.registerCustomer = (req, res, next) => {
  const email = req.body.email;
  //const password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  const password = req.body.password;
  if (req.files) {
    //insert image table
    const sql = "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
    const data = [req.files.logo.mimetype, req.files.logo.data];

    var new_image_id = null;

    res.locals.connection.query(sql, data, (error, results, fields) => {
      if (error) {
        res.status(500).json({
          message: "failure",
          error: error
        });
      } else {
        new_image_id = results.insertId;
        const sql_1 = "INSERT INTO WC_CUSTOMER_INFO (COMPANY_NAME, COMPANY_WEBSITE, Address_line1, Address_line2, Post_code, State_id, Country_id, image_id, password, email_address) VALUES (?,?,?,?,?,?,?,?,?,?);";
        const data_1 = [req.body.companyName,req.body.webAddr,req.body.companyAddr1,req.body.companyAddr2,req.body.postCode,req.body.state,req.body.country,new_image_id,password,req.body.email];
        res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
          if (error) {
            res.status(500).json({
              message: "failure",
              error: error
            });
          } else {
            //send email
            const customer_id = results.insertId;
            const email_body = "<html><body><p>Thank you for registering "+req.body.companyName+" to WISECAR Fleet management system. Your company id: "+customer_id+".</p><br><p>Your employee/contractor can claim at work mileages for you using WISECAR – Your fleet manager app. Request your employee/contractor to download the app and share their vehicle information with your company and claim at work mileages, parking and fuel claims.</p><br><p>For any support please send email to: support@wisecar.com.au</p></body></html>";
            const email_subject = "Welcome to WISECAR Platform - " + req.body.companyName;
            //send email
            var params = {
              Destination: {
                ToAddresses: [
                  email
                ]
              },
              Message: {
                Body: {
                  Html: {
                    Data: email_body,
                    Charset: 'utf-8'
                  }
                },
                Subject: {
                  Data: email_subject,
                  Charset: 'utf-8'
                }
              },
              Source: source_email
            };
            ses.sendEmail(params, (err, data) => {
              if (err){
                res.status(401).json({
                  message: "Sending Email failing",
                  error: err
                });
              } else{
                res.status(201).json({
                  message: "success",
                  email: email,
                  customer_id: customer_id
                });
              }
            });
          }
        });
        res.locals.connection.end();
      }
    });
  } else {
    const sql_1 = "INSERT INTO WC_CUSTOMER_INFO (COMPANY_NAME, COMPANY_WEBSITE, Address_line1, Address_line2, Post_code, State_id, Country_id, password, email_address) VALUES (?,?,?,?,?,?,?,?,?);";
    const data_1 = [req.body.companyName,req.body.webAddr,req.body.companyAddr1,req.body.companyAddr2,req.body.postCode,req.body.state,req.body.country,password,req.body.email];

    res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
      if (error) {
        res.status(500).json({
          message: "failure",
          error: error
        });
      } else {
        //send email
        const customer_id = results.insertId;
        const email_body = "<html><body><p>Thank you for registering "+req.body.companyName+" to WISECAR Fleet management system. Your company id: "+customer_id+".</p><br><p>Your employee/contractor can claim at work mileages for you using WISECAR – Your fleet manager app. Request your employee/contractor to download the app and share their vehicle information with your company and claim at work mileages, parking and fuel claims.</p><br><p>For any support please send email to: support@wisecar.com.au</p></body></html>";
        const email_subject = "Welcome to WISECAR Platform - " + req.body.companyName;
        //send email
        var params = {
          Destination: {
            ToAddresses: [
              email
            ]
          },
          Message: {
            Body: {
              Html: {
                Data: email_body,
                Charset: 'utf-8'
              }
            },
            Subject: {
                Data: email_subject,
                Charset: 'utf-8'
            }
          },
            Source: source_email
        };
        ses.sendEmail(params, (err, data) => {
          if (err){
            res.status(401).json({
              message: "Sending Email failing",
              error: err
            });
          } else{
            res.status(201).json({
              message: "success",
              email: email,
              customer_id: customer_id
            });
          }
        });
      }
    });
    res.locals.connection.end();
  }
};

exports.loginCustomer = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  //customer does not exist or pass does not match

  const sql = "SELECT cust_id,password FROM WC_CUSTOMER_INFO WHERE email_address = ?";
  const data = [email];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(401).json({
        message: "database query failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "This email is not registered"
        });
      } else {
        if (password === results[0].password) {
          const token = jwt.sign({ email: email },"the_key_should_be_longer_str",{ expiresIn: "24h" });
          const cust_id = results[0].cust_id;
          //console.log(cust_id);
          res.status(200).json({message: "success",token: token,expiresIn: 2592000,cust_id:cust_id});
        } else {
          res.status(200).json({
            message: "The password does not match",
          });
        }
      }
    }
  });
  res.locals.connection.end();
};

//return image, email, username
exports.getCustomerInfo = (req, res, next) => {
  const cust_id = req.params.custId;

  const sql = "SELECT company_name, image FROM WC_CUSTOMER_INFO JOIN WC_IMAGE USING (image_id) WHERE cust_id = ?;";
  data = [cust_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(401).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The customer does not exist"
        });
      } else {
        const base64 = Buffer.from(results[0].image).toString('base64');

        res.status(200).json({
          message: "success",
          company_name: results[0].company_name,
          logo: base64
        })
      }
    }
  });
  res.locals.connection.end();
};

exports.getAllCustomers = (req, res, next) => {
  const sql = "SELECT cust_id, company_name FROM WC_CUSTOMER_INFO;";

  res.locals.connection.query(sql, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else {
      res.status(200).json({
        message: "success",
        company_list: results
      });
    }
  });
  res.locals.connection.end()
};
