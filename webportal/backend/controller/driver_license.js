const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const iv = crypto.randomBytes(16);
var config = require("../config");

const AWS = require("aws-sdk");

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });
const s3 = new AWS.S3({
  accessKeyId: config.s3_accesskeyid,
  secretAccessKey: config.s3_secretaccesskey,
});

exports.addDriverLicense = (req, res, next) => {
  const client_type_id = 3;
  const datetime_stamp = new Date().getTime();

  const licence_status = req.body.licence_status;

  const license_no = req.body.license_no;
  const license_type = req.body.license_type;
  const start_date = req.body.start_date;
  const expires_in = req. body.expires_in;
  const expiry_date = req.body.expiry_date;
  const remind_me = req.body.remind_me;
  const user_id = req.body.user_id;
  const record_id = req.body.record_id;
  const driver_license_identifier = req.body.driver_license_identifier;

  let driver_license_hash = null;
  let record_temp_paths3 = null;

  if (req.files) {
      //rename the file
      const mimetype = req.files.document.mimetype;
      const mimeArr = mimetype.split("/");
      const extension = mimeArr[mimeArr.length - 1];

      req.files.document.name = driver_license_identifier + datetime_stamp + "." + extension;

      const encrypted_object = encrypt(req.files.document.data, driver_license_identifier);

      //upload file to s3, get back temp path
      const params = {
        Bucket: "wcservicerecordsdev",
        Key: req.files.document.name,
        Body: encrypted_object.encrypted_data
      };

      driver_license_hash = encrypted_object.key_hash;
      //console.log(params);


      s3.upload(params, (s3Err, data) => {
        if (s3Err) {
          return res.status(401).json({
            message: "Failed to upload driver license",
          });
        } else {
          //get stored path
          record_temp_paths3 = data.Location;
          //update the table using identifier with all the fields above
          const sql_0 = "UPDATE WC_DRIVERLICENCE_RECORD SET user_id=?,licence_no=?,licence_type=?,start_date=?,expires_in_years=?,expiry_date=?,reminder=?,licence_status=? WHERE driver_license_identifier=?;";
          const data_0 = [user_id, license_no, license_type, start_date, expires_in, expiry_date,remind_me,licence_status, driver_license_identifier];
          res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
            if (error) {
              res.status(401).json({
                message: "database operations faliure",
                error: error
              });
            } else {
              const sql_1 = "INSERT INTO WC_DRIVERLICENCEREC_DOC_MAP (licence_rec_id,record_temp_pathS3,client_type_id, record_timestamp, licence_record_hash) VALUES (?,?,?,?,?);";
              const data_1 = [record_id, record_temp_paths3, client_type_id, datetime_stamp,driver_license_hash];

              res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
                  if (error) {
                    res.status(401).json({
                      message: "database operations failure",
                      error: error
                    });
                  } else {
                    res.status(201).json({
                      message: "success",
                      encrypt_hash: driver_license_hash,
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
      const sql_2 = "UPDATE WC_DRIVERLICENCE_RECORD SET user_id=?,licence_no=?,licence_type=?,start_date=?,expires_in_years=?,expiry_date=?,reminder=?,licence_status=? WHERE driver_license_identifier=?;";
      const data_2 = [user_id, license_no, license_type, start_date, expires_in, expiry_date,remind_me,licence_status, driver_license_identifier];
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

exports.getDriverLicense = (req, res, next) => {
  //const driver_license_identifier = req.body.identifier;
  const user_id = req.body.user_id;

  const sql = "SELECT licence_no, licence_type, start_date, expires_in_years, expiry_date, reminder, licence_status, driver_license_identifier FROM WC_DRIVERLICENCE_RECORD WHERE user_id = ?;";
  const data = [user_id];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations faliure",
        error: error
      })
    }else{
      if(results.length === 0){
        res.status(200).json({
          message: "There is no driver license record for this user"
        });
      }else{
        res.status(200).json({
          message: "success",
          license_no: results[0].licence_no,
          license_type: results[0].licence_type,
          start_date: results[0].start_date,
          expires_in: results[0].expires_in_years,
          expiry_date: results[0].expiry_date,
          reminder: results[0].reminder,
          license_status: results[0].licence_status,
          driver_license_identifier: results[0].driver_license_identifier
        })
      }
    }
  });
  res.locals.connection.end();
};

exports.getIdentifier = (req, res, next) => {
  const user_name = req.params.user_name;
  const user_id = req.params.user_id;

  const key = user_name + " " + user_id;

  const response = BigInt("0x" + crypto.createHash("sha1").update(key).digest("hex")) % 10n ** 8n;

  const sql = "INSERT INTO WC_DRIVERLICENCE_RECORD (driver_license_identifier) VALUES (?);";
  const data = [response.toString() + "n"];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      if (error.errno === 1062) {
        const sql_1 = "SELECT id FROM WC_DRIVERLICENCE_RECORD WHERE driver_license_identifier = ?;";
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
          message: "Failed to generate new driver license identifier",
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
      return "error retrieving the driver license";
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
