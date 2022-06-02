//return image, email, username
exports.getServices = (req, res, next) => {

  const sql = "SELECT service_id, service_name FROM WC_SERVICES;";

  res.locals.connection.query(sql, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(404).json({
          message: "The service list is not available"
        });
      } else {
        res.status(200).json({
          message: "success",
          service_list: results
        })
      }
    }
  });
  res.locals.connection.end();
};

exports.getServiceByVid = (req, res, next) => {
  const vehicle_id = req.params.vid;
  const sql = "SELECT service_id, service_name, is_active, svc_expiry_date FROM WC_SVC_VEHICLE_MAP JOIN WC_SERVICES USING (service_id) WHERE vehicle_id = ? and is_active=1;";
  const data = [vehicle_id];

  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    }else{
      if(results.length === 0){
        res.status(404).json({
          message: "This vehicle does not have any services"
        });
      }else{
        res.status(200).json({
          message: "success",
          service_list: results
        })
      }
    }
  });
  res.locals.connection.end();
};

exports.getServiceByUid = (req, res, next) =>{
  const user_id = req.body.user_id;

  const sql = "SELECT DISTINCT service_id, service_name  FROM WC_VEHICLE LEFT JOIN WC_SVC_VEHICLE_MAP USING (VEHICLE_ID) LEFT JOIN WC_SERVICES USING (service_id) WHERE user_id = ? AND is_active=1 ORDER BY service_id;";
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
        service_list: results
      })
    }
  });
  res.locals.connection.end();
};
