exports.addVehicle = (req, res, next) => {
  //all fields: registration, make, model, description, service(array), image(optional)
  //insert make, get make_id
  const make_name = req.body.make;
  const model_name = req.body.model;
  const services = req.body.services;

  var dd = new Date();
  dd.setDate(dd.getDate() + 30);
  var y = dd.getFullYear();
  var m = dd.getMonth() + 1 < 10 ? "0" + (dd.getMonth() + 1) : dd.getMonth() + 1;
  var d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate();
  expiryDate = y + "-" + m + "-" + d;

  const sql = "INSERT IGNORE INTO WC_VEHICLE_MAKE (make_name) VALUES (?);";
  const data = [make_name];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      return res.status(401).json({
        message: "database operations failure",
        error: error
      });
    } else {
      //insert model, make_id, model_name,type_id, get model_id
      var make_id = results.insertId;
      //console.log(make_id);
      if (make_id === 0) {
        const sql_extra = "SELECT make_id FROM WC_VEHICLE_MAKE WHERE make_name = ?;";
        const data_extra = [make_name];
        //console.log(make_name);
        res.locals.connection.query(sql_extra, data_extra, (error, results, fields) => {
            if (error) {
              return res.status(401).json({
                message: "database operations failure",
                error: error
              });
            } else {
              make_id = results[0].make_id;
              const type_id = 1; //dummy data
              const sql_1 = "INSERT IGNORE INTO WC_VEHICLE_MODEL (make_id, model_name, type_id) VALUES (?,?,?)";
              const data_1 = [make_id, model_name, type_id];
              res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
                  if (error) {
                    return res.status(401).json({
                      message: "database operations failure",
                      error: error
                    });
                  } else {
                    var model_id = results.insertId;
                    //console.log(model_id);
                    if (model_id === 0) {
                      const sql_extra_1 = "SELECT model_id FROM WC_VEHICLE_MODEL WHERE model_name = ?;";
                      const data_extra_1 = [model_name];
                      res.locals.connection.query(sql_extra_1, data_extra_1, (error, results, fields) => {
                          if (error) {
                            return res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            //console.log(results);
                            model_id = results[0].model_id;
                            if (req.files) {
                              //insert image,get image_id
                              const sql_2 = "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
                              const data_2 = [req.files.logo.mimetype, req.files.logo.data];
                              //console.log(req.files);
                              res.locals.connection.query(sql_2, data_2, (error, results, fields) => {
                                  if (error) {
                                    // console.log(111);
                                    return res.status(401).json({
                                      message: "database operations failure",
                                      error: error
                                    });
                                  } else {
                                    // console.log(222);
                                    // console.log(results.insertId);
                                    //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                                    var new_image_id = results.insertId;
                                    const sql_3 =
                                      "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description, image_id) VALUES (?,?,?,?,?,?);";
                                    const data_3 = [req.body.registration_no, make_id, model_id, req.body.user_id, req.body.description,new_image_id];

                                    res.locals.connection.query(sql_3,data_3,(error, results, fields) => {
                                        if (error) {
                                          return res.status(401).json({
                                            message:"database operations failure",
                                            error: error
                                          });
                                        } else {
                                          var vehicle_id = results.insertId;
                                          //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                                          const sql_4 =
                                            "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                                          const data_4 = [];

                                          for (let i = 0;i < services.length;i++) {
                                            data_4.push([vehicle_id,parseInt(services[i]),true,expiryDate]);
                                          }

                                          res.locals.connection.query(sql_4,[data_4],(error, results, fields) => {
                                              if (error) {
                                                return res.status(401).json({
                                                  message:"database operations failure",
                                                  error: error
                                                });
                                              } else {
                                                res.status(201).json({
                                                  message: "success",
                                                  vehicle_id: vehicle_id
                                                });
                                              }
                                            }
                                          );
                                          res.locals.connection.end();
                                        }
                                      }
                                    );
                                  }
                                }
                              );
                              //res.locals.connection.end();
                            } else {
                              //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                              const sql_5 =
                                "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description) VALUES (?,?,?,?,?);";
                              const data_5 = [
                                req.body.registration_no,
                                make_id,
                                model_id,
                                req.body.user_id,
                                req.body.description
                              ];
                              //console.log(data_5);
                              res.locals.connection.query(
                                sql_5,
                                data_5,
                                (error, results, fields) => {
                                  if (error) {
                                    return res.status(401).json({
                                      message: "database operations failure",
                                      error: error
                                    });
                                  } else {
                                    var vehicle_id = results.insertId;
                                    //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                                    const sql_6 =
                                      "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                                    const data_6 = [];

                                    for (let i = 0; i < services.length; i++) {
                                      data_6.push([
                                        vehicle_id,
                                        parseInt(services[i]),
                                        true,
                                        expiryDate
                                      ]);
                                    }

                                    res.locals.connection.query(
                                      sql_6,
                                      [data_6],
                                      (error, results, fields) => {
                                        if (error) {
                                          return res.status(401).json({
                                            message:
                                              "database operations failure",
                                            error: error,
                                          });
                                        } else {
                                          res.status(201).json({
                                            message: "success",
                                            vehicle_id: vehicle_id
                                          });
                                        }
                                      }
                                    );
                                    res.locals.connection.end();
                                  }
                                }
                              );
                            }
                          }
                        }
                      );
                    } else {
                      if (req.files) {
                        //insert image,get image_id
                        const sql_2 =
                          "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
                        const data_2 = [req.files.logo.mimetype,req.files.logo.data];
                        res.locals.connection.query(sql_2, data_2,(error, results, fields) => {
                            if (error) {
                              res.status(401).json({
                                message: "database operations failure",
                                error: error
                              });
                            } else {
                              //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                              var new_image_id = results.insertId;
                              const sql_3 = "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description,image_id) VALUES (?,?,?,?,?,?);";
                              const data_3 = [req.body.registration_no,make_id,model_id,req.body.user_id,req.body.description,new_image_id];

                              res.locals.connection.query(
                                sql_3,
                                data_3,
                                (error, results, fields) => {
                                  if (error) {
                                    res.status(401).json({
                                      message: "database operations failure",
                                      error: error
                                    });
                                  } else {
                                    var vehicle_id = results.insertId;
                                    //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                                    const sql_4 =
                                      "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                                    const data_4 = [];

                                    for (let i = 0; i < services.length; i++) {
                                      data_4.push([
                                        vehicle_id,
                                        parseInt(services[i]),
                                        true,
                                        expiryDate
                                      ]);
                                    }

                                    res.locals.connection.query(
                                      sql_4,
                                      [data_4],
                                      (error, results, fields) => {
                                        if (error) {
                                          return res.status(401).json({
                                            message: "database operations failure",
                                            error: error
                                          });
                                        } else {
                                          res.status(201).json({
                                            message: "success",
                                            vehicle_id: vehicle_id
                                          });
                                        }
                                      }
                                    );
                                    res.locals.connection.end();
                                  }
                                }
                              );
                            }
                          }
                        );
                        //res.locals.connection.end();
                      } else {
                        //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                        const sql_5 =
                          "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description) VALUES (?,?,?,?,?);";
                        const data_5 = [
                          req.body.registration_no,
                          make_id,
                          model_id,
                          req.body.user_id,
                          req.body.description
                        ];

                        res.locals.connection.query(
                          sql_5,
                          data_5,
                          (error, results, fields) => {
                            if (error) {
                              res.status(401).json({
                                message: "database operations failure",
                                error: error
                              });
                            } else {
                              var vehicle_id = results.insertId;
                              //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                              const sql_6 = "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                              const data_6 = [];
                              for (let i = 0; i < services.length; i++) {
                                data_6.push([
                                  vehicle_id,
                                  parseInt(services[i]),
                                  true,
                                  expiryDate
                                ]);
                              }

                              res.locals.connection.query(sql_6, [data_6], (error, results, fields) => {
                                  if (error) {
                                    return res.status(401).json({
                                      message: "database operations failure",
                                      error: error
                                    });
                                  } else {
                                    res.status(201).json({
                                      message: "success",
                                      vehicle_id: vehicle_id
                                    });
                                  }
                                }
                              );
                              res.locals.connection.end();
                            }
                          }
                        );
                      }
                    }
                  }
                }
              );
            }
          }
        );
      } else {
        const type_id = 1; //dummy data
        const sql_1 = "INSERT IGNORE INTO WC_VEHICLE_MODEL (make_id, model_name, type_id) VALUES (?,?,?)";
        const data_1 = [make_id, model_name, type_id];
        res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
          if (error) {
            return res.status(401).json({
              message: "database operations failure",
              error: error
            });
          } else {
            var model_id = results.insertId;
            //console.log(model_id);
            if (model_id === 0) {
              const sql_extra_1 =
                "SELECT model_id FROM WC_VEHICLE_MODEL WHERE model_name = ?;";
              const data_extra_1 = [model_name];
              res.locals.connection.query(sql_extra_1, data_extra_1, (error, results, fields) => {
                  if (error) {
                    return res.status(401).json({
                      message: "database operations failure",
                      error: error
                    });
                  } else {
                    //console.log(results);
                    model_id = results[0].model_id;
                    if (req.files) {
                      //insert image,get image_id
                      const sql_2 = "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
                      const data_2 = [req.files.logo.mimetype,req.files.logo.data];
                      res.locals.connection.query(sql_2, data_2, (error, results, fields) => {
                          if (error) {
                            return res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                            var new_image_id = results.insertId;
                            const sql_3 = "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description,image_id) VALUES (?,?,?,?,?,?);";
                            const data_3 = [req.body.registration_no, make_id,model_id,req.body.user_id,req.body.description,new_image_id];

                            res.locals.connection.query(sql_3,data_3,(error, results, fields) => {
                                if (error) {
                                  return res.status(401).json({
                                    message: "database operations failure",
                                    error: error
                                  });
                                } else {
                                  var vehicle_id = results.insertId;
                                  //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                                  const sql_4 = "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                                  const data_4 = [];

                                  for (let i = 0; i < services.length; i++) {
                                    data_4.push([vehicle_id, parseInt(services[i]), true, expiryDate]);
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
                                          vehicle_id: vehicle_id
                                        });
                                      }
                                    }
                                  );
                                  res.locals.connection.end();
                                }
                              }
                            );
                          }
                        }
                      );
                      //res.locals.connection.end();
                    } else {
                      //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                      const sql_5 =
                        "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description) VALUES (?,?,?,?,?);";
                      const data_5 = [req.body.registration_no,
                        make_id,
                        model_id,
                        req.body.user_id,
                        req.body.description
                      ];

                      res.locals.connection.query(
                        sql_5,
                        data_5,
                        (error, results, fields) => {
                          if (error) {
                            return res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            var vehicle_id = results.insertId;
                            //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                            const sql_6 =
                              "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                            const data_6 = [];

                            for (let i = 0; i < services.length; i++) {
                              data_6.push([
                                vehicle_id,
                                parseInt(services[i]),
                                true,
                                expiryDate
                              ]);
                            }

                            res.locals.connection.query(
                              sql_6,
                              [data_6],
                              (error, results, fields) => {
                                if (error) {
                                  return res.status(401).json({
                                    message: "database operations failure",
                                    error: error,
                                  });
                                } else {
                                  res.status(201).json({
                                    message: "success",
                                    vehicle_id: vehicle_id
                                  });
                                }
                              }
                            );
                            res.locals.connection.end();
                          }
                        }
                      );
                    }
                  }
                }
              );
            } else {
              if (req.files) {
                //insert image,get image_id
                const sql_2 = "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
                const data_2 = [req.files.logo.mimetype, req.files.logo.data];
                res.locals.connection.query(
                  sql_2,
                  data_2,
                  (error, results, fields) => {
                    if (error) {
                      return res.status(401).json({
                        message: "database operations failure",
                        error: error
                      });
                    } else {
                      //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                      var new_image_id = results.insertId;
                      const sql_3 = "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description,image_id) VALUES (?,?,?,?,?,?);";
                      const data_3 = [
                        req.body.registration_no,
                        make_id,
                        model_id,
                        req.body.user_id,
                        req.body.description,
                        new_image_id
                      ];

                      res.locals.connection.query(
                        sql_3,
                        data_3,
                        (error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            var vehicle_id = results.insertId;
                            //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                            const sql_4 = "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                            const data_4 = [];

                            for (let i = 0; i < services.length; i++) {
                              data_4.push([
                                vehicle_id,
                                parseInt(services[i]),
                                true,
                                expiryDate
                              ]);
                            }

                            res.locals.connection.query(
                              sql_4,
                              [data_4],
                              (error, results, fields) => {
                                if (error) {
                                  return res.status(401).json({
                                    message: "database operations failure",
                                    error: error
                                  });
                                } else {
                                  res.status(201).json({
                                    message: "success",
                                    vehicle_id: vehicle_id
                                  });
                                }
                              }
                            );
                            res.locals.connection.end();
                          }
                        }
                      );
                    }
                  }
                );
                //res.locals.connection.end();
              } else {
                //insert vehicle,registration,make_id,model_id,description,image_id ,get vehicle_id, others left null
                const sql_5 = "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description) VALUES (?,?,?,?,?);";
                const data_5 = [
                  req.body.registration_no,
                  make_id,
                  model_id,
                  req.body.user_id,
                  req.body.description
                ];

                res.locals.connection.query(sql_5,data_5,(error, results, fields) => {
                    if (error) {
                      res.status(401).json({
                        message: "database operations failure",
                        error: error
                      });
                    } else {
                      var vehicle_id = results.insertId;
                      //insert svc_vehicle_map, vehicle_id,service_id, others left null,
                      const sql_6 =
                        "INSERT INTO WC_SVC_VEHICLE_MAP (vehicle_id, service_id, is_active, svc_expiry_date) VALUES ?;";
                      const data_6 = [];

                      for (let i = 0; i < services.length; i++) {
                        data_6.push([vehicle_id,parseInt(services[i]),true,expiryDate]);
                      }

                      res.locals.connection.query(sql_6,[data_6],(error, results, fields) => {
                          if (error) {
                            return res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            res.status(201).json({
                              message: "success",
                              vehicle_id: vehicle_id
                            });
                          }
                        }
                      );
                      res.locals.connection.end();
                    }
                  }
                );
              }
            }
          }
        });
      }
      //res.locals.connection.end();
    }
  });
};

//return registration_no, make_name, model_name,vin_number,service_expire_date(map table),
//expire_date(registration table)
//logo image, service list(id and name)
//description
//user_id
exports.getVehicle = (req, res, next) => {
  const vehicle_id = req.params.vid;
  const sql = "SELECT vehicle_id, registration_no, v.make_id,make_name,model_id model_name, description, user_id, user_name, image FROM WC_VEHICLE v JOIN WC_VEHICLE_MAKE vm ON v.make_id=vm.make_id JOIN WC_VEHICLE_MODEL USING (model_id) JOIN WC_IMAGE USING (image_id) JOIN WC_USER USING (user_id) WHERE vehicle_id = ?;";
  const data = [vehicle_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      return res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(404).json({
          message: "The vehicle does not exist"
        });
      } else {
        const base64 = Buffer.from(results[0].image, "binary").toString("base64");
        res.status(200).json({
          message: "success",
          user_id: results[0].user_id,
          user_name: results[0].user_name,
          vehicle_id: results[0].vehicle_id,
          registration_no: results[0].registration_no,
          make_id: results[0].make_id,
          make_name: results[0].make_name,
          model_id: results[0].model_id,
          model_name: results[0].model_name,
          vin_number: 11111,
          description: results[0].description,
          logo: base64
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.getUserVehicles = (req, res, next) => {
  const user_id = req.params.uid;

  const sql = "SELECT vehicle_id, registration_no, VMAKE.make_id, make_name, VMODEL.model_id, model_name, description, user_id, user_name, image FROM WC_VEHICLE LEFT JOIN WC_VEHICLE_MAKE VMAKE USING (make_id) LEFT JOIN WC_VEHICLE_MODEL VMODEL USING (model_id) LEFT JOIN WC_IMAGE USING (image_id) LEFT JOIN WC_USER USING (user_id) WHERE user_id = ?;";
  const data = [user_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(404).json({
          message: "This user does not have any vehicles"
        });
      } else {
        for(let i=0;i<results.length;i++){
          if(results[i].image !== null){
            results[i].image = Buffer.from(results[i].image, "binary").toString(
              "base64"
            );
          }
        }
        res.status(200).json({
          message: "success",
          vehicle_list: results
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.updateVehicle = (req, res, next) => {
  const vehicle_id = req.params.vid;
  const sql = "INSERT INTO WC_VEHICLE (registration_no, make_id, model_id,user_id, description,image_id) VALUES (?,?,?,?,?,?);";
};

exports.deleteVehicle = (req, res, next) => {
  const vehicle_id = req.params.vid;
  const sql = "DELETE FROM WC_VEHICLE WHERE vehicle_id = ?;";
  const data = [vehicle_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations failure",
        error: error
      });
    } else {
      //console.log(results);
      if (results.affectedRows === 1) {
        res.status(200).json({
          message: "success"
        });
      } else {
        res.status(404).json({
          message: "The vehicle does not exist"
        });
      }
    }
  });
  res.locals.connection.end();
};
