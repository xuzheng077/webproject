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

exports.addServiceRecord = (req, res, next) => {
  const client_type_id = 3;
  const datetime_stamp = new Date().getTime();
  //console.log(req.body.record_id);

  //parameters coming from app
  const record_id = req.body.record_id;
  const vehicle_id = req.body.vehicle_id;
  const service_date = req.body.service_date;
  const service_center = req.body.service_center;
  const service_ref = req.body.service_ref;
  const service_option_ids = req.body.service_option_ids;
  const service_option_active = true;
  const service_notes = req.body.service_notes;
  const next_service_date = req.body.next_service_date;
  const next_service_odometer = req.body.next_service_odometer;
  let service_record_identifier = req.body.service_record_identifier;
  service_record_identifier = service_record_identifier.trim();

  let service_record_hash = null;

  let record_temp_paths3 = null;

  if (req.files) {
    //rename the file
    const mimetype = req.files.document.mimetype;
    const mimeArr = mimetype.split("/");
    const extension = mimeArr[mimeArr.length - 1];

    req.files.document.name = service_record_identifier + datetime_stamp + "." + extension;

    const encrypted_object = encrypt(req.files.document.data, service_record_identifier);

    //upload file to s3, get back temp path
    const params = {
      Bucket: "wcservicerecordsdev",
      Key: req.files.document.name,
      Body: encrypted_object.encrypted_data
    };

    service_record_hash = encrypted_object.key_hash;
    //console.log(params);


    s3.upload(params, (s3Err, data) => {
      if (s3Err) {
        return res.status(401).json({
          message: "Failed to upload service record",
        });
      } else {
        //get stored path
        record_temp_paths3 = data.Location;
        //update the table using identifier with all the fields above
        const sql_0 = "UPDATE WC_SERVICE_RECORDS SET vehicle_id=?,service_date=?,service_center=?,service_ref=?,service_notes=?,next_service_date=?,next_service_odometer=? WHERE service_record_identifier=?;";
        const data_0 = [vehicle_id, service_date, service_center, service_ref, service_notes, next_service_date, next_service_odometer, service_record_identifier];
        res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
          if (error) {
            //console.log(111);
            res.status(401).json({
              message: "database operations faliure",
              error: error
            });
          } else {
            const sql_1 = "INSERT INTO WC_SVCREC_SVC_MAP (svc_rec_id,service_option_id,service_option_active) VALUES ?;";
            const data_1 = [];
            for (let i = 0; i < service_option_ids.length; i++) {
              data_1.push([parseInt(record_id), parseInt(service_option_ids[i]),service_option_active]);
            }
            res.locals.connection.query(sql_1, [data_1], (error, results, fields) => {
                if (error) {
                  //console.log(222);
                  //console.log(error);
                  res.status(401).json({
                    message: "database operations failure",
                    error: error
                  });
                } else {
                  const sql_2 = "INSERT INTO WC_SVCREC_DOC_MAP (service_rec_id, record_temp_pathS3, client_type_id, record_timestamp, service_record_hash) VALUES (?, ?, ?, ?,?);";
                  const data_2 = [record_id,record_temp_paths3,client_type_id,datetime_stamp, service_record_hash];
                  res.locals.connection.query(sql_2, data_2, (error, results, fields) => {
                      if (error) {
                        console.log(333);
                        res.status(401).json({
                          message: "database operations failure",
                          error: error
                        });
                      } else {
                        res.status(201).json({
                          message: "success",
                          encrypt_hash: service_record_hash,
                          s3_temp_path: record_temp_paths3
                        });
                      }
                    }
                  );
                  res.locals.connection.end();
                }
              }
            );
          }
        });
      }
    });
  } else {
    //no file uploaded by app
    //update the table using identifier
    const sql_3 = "UPDATE WC_SERVICE_RECORDS SET vehicle_id=?,service_date=?,service_center=?,service_ref=?,service_notes=?,next_service_date=?,next_service_odometer=? WHERE service_record_identifier=?;";
    const data_3 = [vehicle_id, service_date, service_center, service_ref, service_notes, next_service_date, next_service_odometer, service_record_identifier];
    // for(let i=0;i<data_3.length;i++){
    //   console.log(data_3[i]);
    // }
    // console.log(service_record_identifier);
    // console.log(typeof(service_record_identifier));
    // console.log(service_record_identifier.length);
    // console.log(service_record_identifier == '8124984n');
    // console.log(service_record_identifier === '8124984n');
    res.locals.connection.query(sql_3, data_3, (error, results, fields) => {
      // console.log(1111);
      if (error) {
        res.status(401).json({
          message: "database operations faliure",
          error: error
        });
      } else {
        // console.log(22222);
        // console.log(results);
        const sql_4 = "INSERT INTO WC_SVCREC_SVC_MAP (SVC_REC_ID,service_option_id,service_option_active) VALUES ?;";
        const data_4 = [];
        for (let i = 0; i < service_option_ids.length; i++) {
          data_4.push([parseInt(record_id), parseInt(service_option_ids[i]), service_option_active]);
        }
        res.locals.connection.query(sql_4, [data_4], (error, results, fields) => {
            if (error) {
              res.status(401).json({
                message: "database operations failure",
                error: error
              });
            } else {
              res.status(201).json({
                message: "success",
                encrypt_hash: "",
                s3_temp_path: ""
              });
            }
          }
        );
        res.locals.connection.end();
      }
    });
  }
};

exports.serviceCenterUpload = (req, res, next) => {
  const client_type_id = 2;
  const datetime_stamp = new Date().getTime();
  let service_record_hash = null;
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

  service_record_hash = encrypted_object.key_hash;

  const params = {
    Bucket: "wcservicerecordsdev",
    Key: file.name,
    Body: encrypted_object.encrypted_data
  };

  s3.upload(params, (s3Err, data) => {
    if (s3Err) {
      return res.status(401).json({
        message: "Failed to upload service record"
      });
    } else {
      record_temp_paths3 = data.Location;

      //get rec_id
      const sql_0 = "SELECT id, service_date, service_center FROM WC_SERVICE_RECORDS WHERE service_record_identifier = ?;";
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
            const sql_1 = "INSERT INTO WC_SVCREC_DOC_MAP (service_rec_id, record_temp_pathS3, client_type_id, record_timestamp, service_record_hash) VALUES (?, ?, ?, ?, ?);";

            const data_1 = [record_id,record_temp_paths3,client_type_id,datetime_stamp, service_record_hash];
            res.locals.connection.query(sql_1,data_1,(error, results, fields) => {
                if (error) {
                  res.status(401).json({
                    message: "database operations faliure",
                    error: error
                  });
                } else {
                  // res.sendFile("success.html", { root: "backend/views/" });
                  res.status(201).json({
                    message: "success",
                    encrypt_hash: service_record_hash,
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
  const service_date = req.params.service_date;
  const time_stamp = new Date().getTime();

  const key = registration_no + " " + service_date + " "+time_stamp;

  const response =
    BigInt("0x" + crypto.createHash("sha1").update(key).digest("hex")) %
    10n ** 8n;

  const sql = "INSERT INTO WC_SERVICE_RECORDS (service_record_identifier) VALUES (?);";
  const data = [response.toString() + "n"];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      if (error.errno === 1062) {
        const sql_1 = "SELECT id FROM WC_SERVICE_RECORDS WHERE service_record_identifier = ?;";
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
          message: "Failed to generate new service record identifier",
          error: error
        });
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

exports.getOptions = (req, res, next) => {
  const sql = "SELECT id,service_option, option_description FROM WC_SERVICE_OPTIONS WHERE vehicle_make_id = ? AND vehicle_model_id = ?;";
  const data = [req.params.make_id, req.params.model_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error,
      });
    } else {
      if (results.length === 0) {
        res.status(404).json({
          message:
            "The service options for the specified make and model are not available.",
        });
      } else {
        res.status(200).json({
          message: "success",
          options: results
        });
      }
    }
  });
  res.locals.connection.end();
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
  //console.log(params);
  s3.getObject(params, (err, data) => {
    if (err) {
      return res.status(404).json({
        message: 'error retrieving the service record'
      });
    }else{
      hex_data = data.Body.toString("binary").toString("hex");
      //console.log(hex_data);
      let iv = hex_data.substr(0,32);
      let encrypted_data = hex_data.substring(32);
      let decrypted_data = decrypt({iv:iv, encryptedData:encrypted_data}, encrypt_hash);
      let base64_str = Buffer.from(decrypted_data, "binary").toString("base64");
      //console.log(base64_str.length);
      res.status(200).json({
        message: "success",
        result: base64_str
      });
    }
  });
};

exports.getAllServiceRecordByUser = (req, res, next)=>{
  const user_id = req.body.user_id;
  const sql = "SELECT id,registration_no, service_date,service_ref, next_service_date, next_service_odometer, has_sent_before FROM WC_VEHICLE JOIN WC_SERVICE_RECORDS USING (vehicle_id) WHERE user_id=? ORDER BY registration_no, next_service_date DESC;";
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

  const sql_0 = "SELECT COUNT(*) AS count FROM WC_SVCREC_DOC_MAP WHERE service_rec_id = ?;";
  const data_0 = [record_id];
  res.locals.connection.query(sql_0,data_0,(error,results,fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      if(results[0].count == 0){
        const sql_1 = "SELECT DISTINCT service_date,service_center,service_ref,service_notes,next_service_date,next_service_odometer, service_option_id,service_option FROM WC_SERVICE_RECORDS sr LEFT JOIN WC_SVCREC_SVC_MAP ssm ON sr.id = ssm.svc_rec_id JOIN WC_SERVICE_OPTIONS so ON ssm.service_option_id = so.id WHERE sr.id = ?;";
        const data_1 = [record_id];
        res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
          if(error){
            res.status(404).json({
              message: "database operations failure",
              error: error
            });
          }else{
            if(results.length>0){
              service_option_list = [];
              for(let i=0;i<results.length;i++){
              service_option_list.push({service_option_id:results[i].service_option_id,service_option:results[i].service_option});
              }
              let url = backend_url+"/api/v1/servicerecords/appfilepreview/null";


              res.status(200).json({
                message: "success",
                service_id: 1,
                service_date: results[0].service_date,
                service_center: results[0].service_center,
                service_ref_no: results[0].service_ref,
                service_options: service_option_list,
                notes: results[0].service_notes,
                next_service_date: results[0].next_service_date,
                next_service_odometer: results[0].next_service_odometer,
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
        const sql = "SELECT DISTINCT service_date,service_center,service_ref,service_notes,next_service_date,next_service_odometer,sdm.id AS svc_doc_id, service_option_id,service_option FROM WC_SERVICE_RECORDS sr LEFT JOIN WC_SVCREC_SVC_MAP ssm ON sr.id = ssm.svc_rec_id JOIN WC_SERVICE_OPTIONS so ON ssm.service_option_id = so.id LEFT JOIN WC_SVCREC_DOC_MAP sdm ON sr.id=sdm.service_rec_id WHERE sr.id = ? AND record_timestamp = (SELECT MAX(record_timestamp) FROM WC_SVCREC_DOC_MAP WHERE service_rec_id=?);";
        const data = [record_id,record_id];

        res.locals.connection.query(sql, data, (error, results, fields)=>{
          if(error){
            res.status(404).json({
              message: "database operations failure",
              error: error
            });
          }else{
            if(results.length>0){
              service_option_list = [];
              for(let i=0;i<results.length;i++){
              service_option_list.push({service_option_id:results[i].service_option_id,service_option:results[i].service_option});
              }
              let url = backend_url+"/api/v1/servicerecords/appfilepreview/"+results[0].svc_doc_id;

              res.status(200).json({
                message: "success",
                service_id: 1,
                service_date: results[0].service_date,
                service_center: results[0].service_center,
                service_ref_no: results[0].service_ref,
                service_options: service_option_list,
                notes: results[0].service_notes,
                next_service_date: results[0].next_service_date,
                next_service_odometer: results[0].next_service_odometer,
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
  const sql = "SELECT id,registration_no, service_date,service_ref, next_service_date, next_service_odometer, has_sent_before FROM WC_VEHICLE JOIN WC_SERVICE_RECORDS USING (vehicle_id) WHERE user_id=? AND registration_no = ? ORDER BY registration_no, next_service_date DESC;";
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
  //console.log(req);
  const svc_doc_id = req.params.svc_doc_id;
  const sql = "SELECT record_temp_pathS3, service_record_hash FROM WC_SVCREC_DOC_MAP WHERE id = ?;";
  const data = [svc_doc_id];
  //console.log(svc_doc_id);
  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      })
    }else{
      if(results.length>0){
        const path = results[0].record_temp_pathS3;
        const hash = results[0].service_record_hash;
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
  //console.log(111);

  const record_id = req.body.record_id;
  const service_id = req.body.service_id;
  const email_to_address = req.body.email_to_address;
  const submit_date_time = req.body.submit_date_time;
  const user_id = req.body.user_id;
  //specific to service record
  const service_date = req.body.service_date;
  const service_center = req.body.service_center;
  const service_ref_no = req.body.service_ref_no;
  const service_options = req.body.service_options;
  const notes = req.body.notes;
  const next_service_date = req.body.next_service_date;
  const next_service_odometer = req.body.next_service_odometer;

  let sent_date_time = null;
  let email_body = null;
  let email_subject = null;

  //assemble email body
  email_body = "<html><body><table><tr><td>Service Date</td><td>"+service_date+"</td></tr><tr><td>Service Center</td><td>"+service_center+"</td></tr><tr><td>Service Reference Number</td><td>"+service_ref_no+"</td></tr><tr><td>Service Options</td><td>"+service_options+"</td></tr><tr><td>Notes</td><td>"+notes+"</td></tr><tr><td>Next Service Date</td><td>"+next_service_date+"</td></tr><tr><td>Next Service Odometer</td><td>"+next_service_odometer+"</td></tr></table></body></html>";
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
        //console.log(222);
        const username = results[0].first_name + " " +results[0].last_name;
        //sent_date_time = sdt.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        sent_date_time = submit_date_time;

        email_subject = "WISECAR - "+username+" - Service Record - " + sent_date_time;

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
            //console.log(333);
            return res.status(401).json({
              message: "Sending Email failing",
              error: err
            });
          } else{
            //console.log(444);
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
                const sql_2 = "UPDATE WC_SERVICE_RECORDS SET has_sent_before = 1 WHERE id = ?;";
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

