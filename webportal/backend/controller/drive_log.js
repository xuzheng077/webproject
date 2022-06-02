const sdt = require("silly-datetime");

var SES = require('aws-sdk/clients/ses');
var config = require('../config');

var ses = new SES({
  accessKeyId: config.ses_accesskeyid,
  secretAccessKey: config.ses_secretaccesskey,
  region: config.ses_region
});

const source_email = config.ses_email_address;

//return the current share details
exports.getCurrentShareDetail = (req, res, next) => {
  const vehicle_id = req.body.vehicle_id;
  const current_date_time = req.body.current_date_time;

  //get cust_id, company_name, logo, claim_rate, share info (share_id, start_date,end_date)
  const sql = "SELECT cust_id, company_name, claim_rate, image, vs.id, start_time, end_time, service_id FROM WC_CUSTOMER_INFO LEFT JOIN WC_IMAGE USING (image_id) LEFT JOIN WC_VEHICLE_SHARE vs USING (cust_id) LEFT JOIN WC_VSHARE_MAP vm ON vs.id = vm.share_id LEFT JOIN WC_SHARE_SVC_MAP ssm ON vs.id = ssm.share_id WHERE vehicle_id=? AND (? BETWEEN start_time AND end_time) AND ssm.is_active=1;";
  const data = [vehicle_id, current_date_time];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle has no current share at the moment."
        });
      } else {
        const driver_log_service_id = 3;
        let flag = false;
        for(let i=0;i<results.length;i++){
          if(results[i].service_id === driver_log_service_id){
            flag = true;
            break;
          }
        }
        if(flag){
          let base64 = "";
          if(results[0].image !== null){
             base64 = Buffer.from(results[0].image, "binary").toString("base64");
          }
          res.status(200).json({
            message: "success",
            cust_id: results[0].cust_id,
            company_name: results[0].company_name,
            claim_rate: results[0].claim_rate,
            share_id: results[0].id,
            start_time:results[0].start_time,
            end_time: results[0].end_time,
            company_logo: base64
          });
        }else{
          res.status(200).json({
            message: "The vehicle didn't share its driving log with the company."
          });
        }
      }
    }
  });
  res.locals.connection.end();
};

exports.saveDriveLog = (req, res, next) => {
  const timestamp = new Date().getTime();
  const vehicle_id = req.body.vehicle_id;
  let share_id = req.body.share_id;
  if(share_id === ''){
    share_id = null;
  }
  let customer_id = req.body.customer_id;
  if(customer_id === ''){
    customer_id = null;
  }
  const log_start_time = req.body.log_start_time;
  const log_end_time = req.body.log_end_time;
  let claim_rate = req.body.claim_rate;
  if(claim_rate === ''){
    claim_rate = null;
  }
  const km_travelled = req.body.km_travelled;
  const paused_time = req.body.paused_time;
  const total_travel_time = req.body.total_travel_time;
  const location_logs = req.body.location_logs;

  const sql = "INSERT INTO WC_DRIVER_LOGS (vehicle_id, share_id, customer_id, claim_rate, log_start_date_time, log_stop_date_time, km_travel, paused_times, total_travel_times, location_log, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?);";
  const data = [vehicle_id, share_id, customer_id, claim_rate, log_start_time, log_end_time, km_travelled, paused_time, total_travel_time, location_logs, timestamp];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      res.status(201).json({
        message: "success",
        log_id: results.insertId
      })
    }
  });
  res.locals.connection.end();
};

exports.getRecentLogByVid = (req, res, next) => {
  const vehicle_id = req.body.vehicle_id;

  const sql_0 = "SELECT share_id, customer_id, company_name, image, dl.claim_rate, log_start_date_time, log_stop_date_time, km_travel, paused_times, total_travel_times, CONVERT(location_log USING utf8) AS location_log, timestamp FROM WC_DRIVER_LOGS dl LEFT JOIN WC_CUSTOMER_INFO ci ON dl.customer_id=ci.cust_id LEFT JOIN WC_IMAGE USING (image_id) WHERE vehicle_id = ? AND dl.customer_id IS NOT NULL;";
  const data_0 = [vehicle_id];

  res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      const results_1 = results;
      const sql_1 = "SELECT log_start_date_time, log_stop_date_time, km_travel, paused_times, total_travel_times, CONVERT(location_log USING utf8) AS location_log, timestamp FROM WC_DRIVER_LOGS WHERE vehicle_id = ? AND customer_id IS NULL;";
      res.locals.connection.query(sql_1, data_0, (error, results, fields)=>{
        if(error){
          res.status(404).json({
            message: "database operations failure",
            error: error
          });
        }else{
          const results_2 = results;
          const recent_logs = [];
          if(results_1.length > 0){
            for(let i=0;i<results_1.length;i++){
              let base64 =null;
              if(results_1[i].image !== null){
                base64 = Buffer.from(results_1[i].image, "binary").toString("base64");
              }
              if(results_1[i].share_id === 0){
                results_1[i].share_id = null;
              }
              recent_logs.push({share_id:results_1[i].share_id, customer_id:results_1[i].customer_id, company_name:results_1[i].company_name, image:base64, claim_rate:results_1[i].claim_rate, log_start_date_time: results_1[i].log_start_date_time, log_stop_date_time:results_1[i].log_stop_date_time, km_travel:results_1[i].km_travel, paused_times:results_1[i].paused_times, total_travel_times:results_1[i].total_travel_times, location_log:results_1[i].location_log, timestamp:results_1[i].timestamp});
            }
          }
          if(results_2.length > 0){
            for(let i=0;i<results_2.length;i++){
              recent_logs.push({share_id:null, customer_id:null,company_name:null, image:null, claim_rate:null, log_start_date_time: results_2[i].log_start_date_time, log_stop_date_time:results_2[i].log_stop_date_time, km_travel:results_2[i].km_travel, paused_times:results_2[i].paused_times, total_travel_times:results_2[i].total_travel_times, location_log:results_2[i].location_log, timestamp:results_2[i].timestamp});
            }
          }
          if(recent_logs.length>0){
            res.status(200).json({
              message: "success",
              recent_logs: recent_logs
            })
          }else{
            res.status(404).json({
              message: "The vehicle has no driver logs"
            });
          }
        }
      });
      res.locals.connection.end();
    }
  });
};

exports.getRecentLogByCname = (req, res, next) => {
  const customer_id = req.body.customer_id;
  const vehicle_id = req.body.vehicle_id;

  const sql = "SELECT share_id, customer_id, company_name, image, dl.claim_rate, log_start_date_time, log_stop_date_time, km_travel, paused_times, total_travel_times, CONVERT(location_log USING utf8) AS location_log,timestamp FROM WC_DRIVER_LOGS dl LEFT JOIN WC_CUSTOMER_INFO ci ON dl.customer_id=ci.cust_id LEFT JOIN WC_IMAGE USING (image_id) WHERE customer_id = ? AND vehicle_id=?;";
  const data = [customer_id, vehicle_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(404).json({
          message: "The vehicle has no drive log for the input company"
        });
      } else {
        let return_result = [];
        let company_name = results[0].company_name;
        let customer_id = results[0].customer_id;
        let image = null;
        if(results[0].image !== null){
          image = Buffer.from(results[0].image, "binary").toString("base64");
        }
        let claim_rate = results[0].claim_rate;
        for(let i=0; i< results.length; i++){
          return_result.push({share_id:results[i].share_id, log_start_date_time: results[i].log_start_date_time, log_stop_date_time:results[i].log_stop_date_time, km_travel:results[i].km_travel, paused_times:results[i].paused_times, total_travel_times:results[i].total_travel_times, location_log:results[i].location_log, timestamp:results[i].timestamp});
        }

        res.status(200).json({
          message: "success",
          company_name: company_name,
          customer_id: customer_id,
          image: image,
          claim_rate: claim_rate,
          recent_logs: return_result
        })
      }
    }
  });
  res.locals.connection.end();
};

exports.getClaimsByCompany = (req, res, next) => {
  const customer_id = req.body.customer_id;
  const vehicle_id = req.body.vehicle_id;

  const sql = "SELECT DATE_FORMAT(log_start_date_time,'%Y-%m-%d') date, km_travel, total_travel_times, km_travel * claim_rate AS claim_amount FROM WC_DRIVER_LOGS WHERE customer_id=? AND vehicle_id=?;";
  const data = [customer_id, vehicle_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(404).json({
          message: "The company currently has no claim from this vehicle"
        });
      } else {
        res.status(200).json({
          message: "success",
          claim_list: results
        })
      }
    }
  });
  res.locals.connection.end();
};

exports.getAllDriverLogByUser = (req, res, next)=>{
  const user_id = req.body.user_id;
  const sql = "SELECT dl.id,registration_no,DATE_FORMAT(log_start_date_time,'%Y-%m-%d') AS date,DATE_FORMAT(log_start_date_time,'%H:%i:%s') AS start_time, DATE_FORMAT(log_stop_date_time,'%H:%i:%s') AS end_time,km_travel, company_name, has_sent_before FROM WC_DRIVER_LOGS dl LEFT JOIN WC_VEHICLE USING (vehicle_id) LEFT JOIN WC_CUSTOMER_INFO ci ON dl.customer_id=ci.cust_id WHERE user_id = ? ORDER BY registration_no,date DESC;";
  const data = [user_id];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      result_list = [];
      for(let i=0;i<results.length;i++){
        if(results[i].company_name === null){
          result_list.push(results[i]);
        }
      }
      for(let i=0;i<results.length;i++){
        if(results[i].company_name !== null){
          result_list.push(results[i]);
        }
      }
      res.status(200).json({
        message: "success",
        record_list: result_list
      });
    }
  });
  res.locals.connection.end();
};

exports.getRecordById = (req, res, next)=>{
  const record_id = req.body.record_id;
  const sql = "SELECT registration_no, DATE_FORMAT(log_start_date_time,'%Y-%m-%d') AS date,DATE_FORMAT(log_start_date_time,'%H:%i:%s') AS start_time, DATE_FORMAT(log_stop_date_time,'%H:%i:%s') AS end_time, km_travel, total_travel_times,company_name FROM WC_DRIVER_LOGS dl JOIN WC_VEHICLE USING (vehicle_id) LEFT JOIN WC_CUSTOMER_INFO ci ON dl.customer_id=ci.cust_id WHERE dl.id = ?;";
  const data = [record_id];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      if(results.length>0){
        res.status(200).json({
          message: "success",
          service_id: 3,
          registration_no: results[0].registration_no,
          date: results[0].date,
          start_time: results[0].start_time,
          end_time: results[0].end_time,
          total_km: results[0].km_travel,
          total_time: results[0].total_travel_times,
          shared_with: results[0].company_name
        });
      }else{
        res.status(200).json({
          message: "The record does not exist"
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.getRecordByUserAndRegistrationNo = (req, res, next)=>{
  const user_id = req.body.user_id;
  const registration_no = req.body.registration_no;
  const sql = "SELECT dl.id,registration_no,DATE_FORMAT(log_start_date_time,'%Y-%m-%d') AS date,DATE_FORMAT(log_start_date_time,'%H:%i:%s') AS start_time, DATE_FORMAT(log_stop_date_time,'%H:%i:%s') AS end_time,km_travel, company_name, has_sent_before FROM WC_DRIVER_LOGS dl LEFT JOIN WC_VEHICLE USING (vehicle_id) LEFT JOIN WC_CUSTOMER_INFO ci ON dl.customer_id=ci.cust_id WHERE user_id = ? AND registration_no=? ORDER BY registration_no,date DESC;";
  const data = [user_id, registration_no];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      result_list = [];
      for(let i=0;i<results.length;i++){
        if(results[i].company_name === null){
          result_list.push(results[i]);
        }
      }
      for(let i=0;i<results.length;i++){
        if(results[i].company_name !== null){
          result_list.push(results[i]);
        }
      }
      res.status(200).json({
        message: "success",
        record_list: result_list
      });
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
  //specific to drive logs
  const registration_no = req.body.registration_no;
  const date = req.body.date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const total_km = req.body.total_km;
  const total_time = req.body.total_time;
  const shared_with = req.body.shared_with;

  let sent_date_time = null;
  let email_body = null;
  let email_subject = null;

  //assemble email body
  email_body = "<html><body><table><tr><td>Registration Number</td><td>"+registration_no+"</td></tr><tr><td>Date</td><td>"+date+"</td></tr><tr><td>Start Time</td><td>"+start_time+"</td></tr><tr><td>End Time</td><td>"+end_time+"</td></tr><tr><td>Total Km</td><td>"+total_km+"</td></tr><tr><td>Total Time</td><td>"+total_time+"</td></tr><tr><td>Shared With</td><td>"+shared_with+"</td></tr></table></body></html>";

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

        email_subject = "WISECAR - "+username+" - Driver Log - " + sent_date_time;

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
            res.status(401).json({
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
              }else{
                const email_id = results.insertId;
                const sql_2 = "UPDATE WC_DRIVER_LOGS SET has_sent_before = 1 WHERE id = ?;";
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
