const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const iv = crypto.randomBytes(16);
const sdt = require("silly-datetime");

const AWS = require("aws-sdk");
var SES = require('aws-sdk/clients/ses');
var config = require('../config');
const source_email = config.ses_email_address;
const backend_url = config.backend_url;

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });
const s3 = new AWS.S3({
  accessKeyId: config.s3_accesskeyid,
  secretAccessKey: config.s3_secretaccesskey,
});

var ses = new SES({
  accessKeyId: config.ses_accesskeyid,
  secretAccessKey: config.ses_secretaccesskey,
  region: config.ses_region
});

exports.addInsuranceRecord = (req, res, next) => {
  const client_type_id = 3;
  const datetime_stamp = new Date().getTime();

  //parameters coming from app
  const record_id = req.body.record_id;
  const vehicle_id = req.body.vehicle_id;
  const policy_number = req.body.policy_number;
  const insurer = req.body.insurer;
  const start_of_cover = req.body.start_of_cover;
  const end_of_cover = req.body.end_of_cover;
  const cover_type = req.body.cover_type;
  const insurance_record_identifier = req.body.insurance_record_identifier;

  let insurance_record_hash = null;

  let record_temp_paths3 = null;

  if (req.files) {
    //rename the file
    const mimetype = req.files.document.mimetype;
    const mimeArr = mimetype.split("/");
    const extension = mimeArr[mimeArr.length - 1];

    req.files.document.name = insurance_record_identifier + datetime_stamp + "." + extension;

    const encrypted_object = encrypt(req.files.document.data, insurance_record_identifier);

    //upload file to s3, get back temp path
    const params = {
      Bucket: "wcservicerecordsdev",
      Key: req.files.document.name,
      Body: encrypted_object.encrypted_data
    };

    insurance_record_hash = encrypted_object.key_hash;
    //console.log(params);


    s3.upload(params, (s3Err, data) => {
      if (s3Err) {
        return res.status(401).json({
          message: "Failed to upload insurance record",
        });
      } else {
        //get stored path
        record_temp_paths3 = data.Location;
        //update the table using identifier with all the fields above
        const sql_0 = "UPDATE WC_INSURANCE_RECORD SET vehicle_id=?,policy_number=?,insurer=?,cover_start_date=?,cover_end_date=?,cover_type=? WHERE insurance_record_identifier=?;";
        const data_0 = [vehicle_id, policy_number, insurer, start_of_cover, end_of_cover, cover_type, insurance_record_identifier];
        res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
          if (error) {
            res.status(401).json({
              message: "database operations faliure",
              error: error
            });
          } else {
            const sql_1 = "INSERT INTO WC_INSURANCEREC_DOC_MAP (insurance_rec_id,record_temp_pathS3,client_type_id, record_timestamp, insurance_record_hash) VALUES (?,?,?,?,?);";
            const data_1 = [record_id, record_temp_paths3, client_type_id, datetime_stamp,insurance_record_hash];

            res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
                if (error) {
                  res.status(401).json({
                    message: "database operations failure",
                    error: error
                  });
                } else {
                  res.status(201).json({
                    message: "success",
                    encrypt_hash: insurance_record_hash,
                    s3_temp_path: record_temp_paths3
                  });
                }
              }
            );
            res.locals.connection.end();
          }
        });
      }
    });
  } else {
    //no file uploaded by app
    //update the table using identifier
    const sql_2 = "UPDATE WC_INSURANCE_RECORD SET vehicle_id=?,policy_number=?,insurer=?,cover_start_date=?,cover_end_date=?,cover_type=? WHERE insurance_record_identifier=?;";
    const data_2 = [vehicle_id, policy_number, insurer, start_of_cover, end_of_cover, cover_type, insurance_record_identifier];
    res.locals.connection.query(sql_2, data_2, (error, results, fields) => {
      if (error) {
        res.status(401).json({
          message: "database operations faliure",
          error: error
        });
      } else {
        res.status(201).json({
          message: "success",
          encrypt_hash: "",
          s3_temp_path: ""
        });
      }
    });
    res.locals.connection.end();
  }
};

exports.insuranceCompanyUpload = (req, res, next) => {
  const client_type_id = 2;
  const datetime_stamp = new Date().getTime();
  let insurance_record_hash = null;
  let record_temp_paths3 = null;

  //params coming from webpage
  const identifier = req.body.identifier;
  const file = req.files.inputFile;

  //rename the file
  const mimetype = req.files.inputFile.mimetype;
  const mimeArr = mimetype.split("/");
  const extension = mimeArr[mimeArr.length - 1];
  file.name = identifier + datetime_stamp + "." + extension;

  const encrypted_object = encrypt(file.data, identifier);

  insurance_record_hash = encrypted_object.key_hash;

  const params = {
    Bucket: "wcservicerecordsdev",
    Key: file.name,
    Body: encrypted_object.encrypted_data
  };

  s3.upload(params, (s3Err, data) => {
    if (s3Err) {
      return res.status(401).json({
        message: "Failed to upload insurance record"
      });
    } else {
      record_temp_paths3 = data.Location;

      //get rec_id
      const sql_0 = "SELECT id FROM WC_INSURANCE_RECORD WHERE insurance_record_identifier = ?;";
      const data_0 = [identifier];
      res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
        if (error) {
          res.status(401).json({
            message: "database operations faliure",
            error: error
          });
        } else {
          if (results.length > 0) {
            const record_id = results[0].id;
            const sql_1 = "INSERT INTO WC_INSURANCEREC_DOC_MAP (insurance_rec_id, record_temp_pathS3, client_type_id, record_timestamp, insurance_record_hash) VALUES (?, ?, ?, ?, ?);";

            const data_1 = [record_id,record_temp_paths3,client_type_id,datetime_stamp, insurance_record_hash];
            res.locals.connection.query(sql_1,data_1,(error, results, fields) => {
                if (error) {
                  res.status(401).json({
                    message: "database operations faliure",
                    error: error
                  });
                } else {
                  res.status(201).json({
                    message: "success",
                    encrypt_hash: insurance_record_hash,
                    s3_temp_path: record_temp_paths3
                  });
                }
              }
            );
            res.locals.connection.end();
          }
        }
      });
    }
  });
};

exports.getIdentifier = (req, res, next) => {
  const registration_no = req.params.registration_no;
  const insurance_add_date = req.params.insurance_add_date;
  const time_stamp = new Date().getTime();

  const key = registration_no + " " + insurance_add_date + " "+time_stamp;

  const response =
    BigInt("0x" + crypto.createHash("sha1").update(key).digest("hex")) %
    10n ** 8n;

  const sql = "INSERT INTO WC_INSURANCE_RECORD (insurance_record_identifier) VALUES (?);";
  const data = [response.toString() + "n"];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      if (error.errno === 1062) {
        const sql_1 = "SELECT id FROM WC_INSURANCE_RECORD WHERE insurance_record_identifier = ?;";
        const data_1 = [response.toString() + "n"];
        res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
          if (error) {
            res.status(404).json({
              message: "database failure",
              error: error
            });
          } else {
            res.status(200).json({
              message: "success",
              identifier: response.toString() + "n",
              record_id: results[0].id
            });
          }
        });
        res.locals.connection.end();
      } else {
        res.status("404").json({
          message: "Failed to generate new insurance record identifier",
          error: error
        });
        res.locals.connection.end();
      }
    } else {
      res.status(200).json({
        message: "success",
        identifier: response.toString() + "n",
        record_id: results.insertId
      });
      res.locals.connection.end();
    }
  });
};

exports.getUploadPage = (req, res, next) => {
  res.sendFile("upload.html", { root: "backend/views/" });
};

exports.getFileFromS3 = (req, res, next) => {
  const encrypt_hash = req.body.encrypt_hash;
  const s3_temp_path = req.body.s3_temp_path;

  const arr = s3_temp_path.split('/');
  //get file name from path
  const filename = arr[arr.length-1];
  const params = {
    Bucket: "wcservicerecordsdev",
    Key: filename
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      return "error retrieving the insurance record";
    }else{
      hex_data = data.Body.toString("binary").toString("hex");

      let iv = hex_data.substr(0,32);
      let encrypted_data = hex_data.substring(32);
      let decrypted_data = decrypt({iv:iv, encryptedData:encrypted_data}, encrypt_hash);
      let base64 = Buffer.from(decrypted_data, "binary").toString("base64");
      res.status(201).json({
        message: "success",
        decrypted_data:base64
      });
    }
  });
};

exports.getAllInsuranceRecordByUser = (req, res, next)=>{
  const user_id = req.body.user_id;
  const sql = "SELECT id,registration_no,policy_number,insurer, cover_end_date,has_sent_before FROM WC_VEHICLE JOIN WC_INSURANCE_RECORD USING (vehicle_id) WHERE user_id = ? ORDER BY registration_no,cover_end_date DESC;";
  const data = [user_id];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      res.status(200).json({
        message: "success",
        record_list: results
      });
    }
  });
  res.locals.connection.end();
};

exports.getRecordById = (req, res, next)=>{
  const record_id = req.body.record_id;
  const sql_0 = "SELECT COUNT(*) AS count FROM WC_INSURANCEREC_DOC_MAP WHERE insurance_rec_id = ?;";
  const data_0 = [record_id];
  res.locals.connection.query(sql_0,data_0,(error,results,fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      if(results[0].count == 0){
        const sql_1 = "SELECT policy_number, insurer, cover_start_date, cover_end_date, cover_type FROM WC_INSURANCE_RECORD ir WHERE ir.id = ?;";
        const data_1 = [record_id];

        res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
          if(error){
            res.status(404).json({
              message: "database operations failure",
              error: error
            });
          }else{
            if(results.length>0){
              let url = backend_url+"/api/v1/insurancerecords/appfilepreview/null";

              res.status(200).json({
                message: "success",
                service_id: 5,
                policy_number: results[0].policy_number,
                insurer: results[0].insurer,
                cover_start_date: results[0].cover_start_date,
                cover_end_date: results[0].cover_end_date,
                cover_type: results[0].cover_type,
                file_url: url
              });
            }else{
              res.status(200).json({
               message: "The record does not exist"
              });
            }
          }
        });
        res.locals.connection.end();
      }else{
        const sql = "SELECT policy_number, insurer, cover_start_date, cover_end_date, cover_type, idm.id AS insurance_doc_id FROM WC_INSURANCE_RECORD ir LEFT JOIN WC_INSURANCEREC_DOC_MAP idm ON ir.id=idm.insurance_rec_id WHERE ir.id = ? AND record_timestamp = (SELECT MAX(record_timestamp) FROM WC_INSURANCEREC_DOC_MAP WHERE insurance_rec_id=?);";
        const data = [record_id, record_id];
        res.locals.connection.query(sql, data, (error, results, fields)=>{
          if(error){
            res.status(404).json({
            message: "database operations failure",
            error: error
          });
          }else{
            if(results.length>0){
              let url = backend_url+"/api/v1/insurancerecords/appfilepreview/"+results[0].insurance_doc_id;

              res.status(200).json({
                message: "success",
                service_id: 5,
                policy_number: results[0].policy_number,
                insurer: results[0].insurer,
                cover_start_date: results[0].cover_start_date,
                cover_end_date: results[0].cover_end_date,
                cover_type: results[0].cover_type,
                file_url: url
              });
            }else{
              res.status(200).json({
                message: "The record does not exist"
              });
            }
          }
        });
        res.locals.connection.end();
      }
    }
  });
};

exports.getRecordByUserAndRegistrationNo = (req, res, next)=>{
  const user_id = req.body.user_id;
  const registration_no = req.body.registration_no;
  const sql = "SELECT id,registration_no,policy_number,insurer, cover_end_date,has_sent_before FROM WC_VEHICLE JOIN WC_INSURANCE_RECORD USING (vehicle_id) WHERE user_id = ? AND registration_no = ? ORDER BY registration_no,cover_end_date DESC;";
  const data = [user_id, registration_no];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      res.status(200).json({
        message: "success",
        record_list: results
      });
    }
  });
  res.locals.connection.end();
};

exports.appFilePreview = (req, res, next)=>{

  const insurance_doc_id = req.params.insurance_doc_id;
  const sql = "SELECT record_temp_pathS3, insurance_record_hash FROM WC_INSURANCEREC_DOC_MAP WHERE id = ?;";
  const data = [insurance_doc_id];
  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      })
    }else{
      if(results.length>0){
        const path = results[0].record_temp_pathS3;
        const hash = results[0].insurance_record_hash;
        //console.log(path);
        //console.log(hash);
        const arr = path.split('/');

        //get file name from path
        const filename = arr[arr.length-1];
        const params = {
          Bucket: "wcservicerecordsdev",
          Key: filename
        };
        //console.log(params);
        s3.getObject(params, (err, data) => {
          if (err) {
            res.type('text/plain');
            res.status(404);
            res.send('404 - ' + 'error retrieving the service record' + '.');
          }else{
            hex_data = data.Body.toString("binary").toString("hex");
            //console.log(hex_data);
            let iv = hex_data.substr(0,32);
            let encrypted_data = hex_data.substring(32);
            let decrypted_data = decrypt({iv:iv, encryptedData:encrypted_data}, hash);
            let base64_str = Buffer.from(decrypted_data, "binary").toString("base64");
            //console.log(base64_str.length);
            res.type('text/html');
            res.status(200);
            res.send('<html><body><div style="text-align:center"><img src="data:image/png;base64,'+base64_str+'"/></div></body></html>');
          }
        });
      }else{
        res.type('text/plain');
        res.status(404);
        res.send('404 - The record file does not exist.');
      }
    }
  });
  res.locals.connection.end();
};

exports.sendEmail = (req, res, next)=>{

  const record_id = req.body.record_id;
  const service_id = req.body.service_id;
  const email_to_address = req.body.email_to_address;
  const submit_date_time = req.body.submit_date_time;
  const user_id = req.body.user_id;
  //specific to insurance record
  const policy_number = req.body.policy_number;
  const insurer = req.body.insurer;
  const start_of_cover = req.body.start_of_cover;
  const end_of_cover = req.body.end_of_cover;
  const cover_type = req.body.cover_type;

  let sent_date_time = null;
  let email_body = null;
  let email_subject = null;

  //assemble email body
  email_body = "<html><body><table><tr><td>Policy Number</td><td>"+policy_number+"</td></tr><tr><td>Insurer</td><td>"+insurer+"</td></tr><tr><td>Start Of Cover</td><td>"+start_of_cover+"</td></tr><tr><td>End Of Cover</td><td>"+end_of_cover+"</td></tr><tr><td>Cover Type</td><td>"+cover_type+"</td></tr></table></body></html>";

  const sql_0 = "SELECT first_name, last_name FROM WC_USER WHERE user_id = ?;";
  const data_0 = [user_id];
  res.locals.connection.query(sql_0, data_0, (error, results, fields)=>{
    if(error){
      res.status(401).json({
        message: "database operations failure",
        error:error
      });
    }else{
      if(results.length>0){
        const username = results[0].first_name + " " +results[0].last_name;
        //sent_date_time = sdt.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        sent_date_time = submit_date_time;

        email_subject = "WISECAR - "+username+" - Insurance Record - " + sent_date_time;

        //send email
        var params = {
          Destination: {
            ToAddresses: [
              email_to_address
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
            return res.status(401).json({
              message: "Sending Email failing",
              error: err
            });
          } else{
            const sql_1 = "INSERT INTO WC_SEND_EMAIL_LOG (wc_service_id, email_to_address, email_body_html, sent_date_time, submit_date_time, user_id, email_subject) VALUES (?,?,?,?,?,?,?);";
            const data_1 = [service_id, email_to_address, email_body, sent_date_time, submit_date_time, user_id, email_subject];
            res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
              if(error){
                res.status(401).json({
                  message: "database operations failure",
                  error:error
                });
                res.locals.connection.end();
              }else{
                const email_id = results.insertId;
                const sql_2 = "UPDATE WC_INSURANCE_RECORD SET has_sent_before = 1 WHERE id = ?;";
                const data_2 = [record_id];
                res.locals.connection.query(sql_2, data_2, (error, results, fields)=>{
                  if(error){
                    res.status(401).json({
                      message: "database operations failure",
                      error:error
                    });
                  }else{
                    res.status(201).json({
                      message: "success",
                      email_id: email_id
                    });
                  }
                });
                res.locals.connection.end();
              }
            });
          }
        });
      }else{
        res.status(401).json({
          message: "The user with id "+user_id+" does not exist"
        });
        res.locals.connection.end();
      }
    }
  });
};

function encrypt(buffer, identifier) {
  //store this key in the database field
  let key = crypto.createHash("sha256").update(String(identifier)).digest("base64").substr(0, 32);

  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  //console.log(key);
  //console.log(iv.toString("hex"));
  return {key_hash: key, encrypted_data: iv.toString("hex") + encrypted.toString("hex")};
}

function decrypt(encrypted, encrypt_hash) {
  //console.log(encrypt_hash);
  //console.log(encrypted.iv);
  let iv = Buffer.from(encrypted.iv, "hex");

  let key = encrypt_hash;
  let encryptedText = Buffer.from(encrypted.encryptedData, "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  //object
  return decrypted;
}
