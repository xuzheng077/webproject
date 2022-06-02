var config = require("../config");
const backend_url = config.backend_url;

exports.checkSharedInfo = (req, res, next) => {
  //const cust_id = req.body.cust_id;
  const vehicle_id = req.body.vehicle_id;
  //const shareOnAndOff = req.body.share; // 1 or 0
  const date = req.body.date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;

  const recurring = req.body.recurring; // 1 or 0
  var recurring_end_date;
  var recurring_days;

  if (recurring === "1") {
    recurring_end_date = req.body.recurring_end_date;
    recurring_days = req.body.recurring_days;
  }
  const service_visibility = req.body.service_visibility; // 1 or 0
  var visible_service_ids;
  if (service_visibility === "1") {
    visible_service_ids = req.body.visible_service_ids;
  }

  if (recurring === "0") {
    //identify whether the car is being shared
    const sql_1 =
      "SELECT COUNT(*) AS count FROM WC_VSHARE_MAP m JOIN WC_VEHICLE_SHARE s on m.share_id=s.id WHERE ((start_time > ? AND start_time < ?) OR (start_time <= ? AND end_time >= ?) OR (end_time > ? AND end_time < ?) OR (start_time >= ? AND end_time <= ?)) AND vehicle_id = ? AND is_active = 1;";
    const data_1 = [
      date + " " + start_time,
      date + " " + end_time,
      date + " " + start_time,
      date + " " + end_time,
      date + " " + start_time,
      date + " " + end_time,
      date + " " + start_time,
      date + " " + end_time,
      vehicle_id
    ];
    res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
      if (error) {
        res.status(401).json({
          message: "Cannot reach database to validate the inputs",
          error: error,
        });
      } else {
        if (results[0].count > 0) {
          res.status(401).json({
            message: "The vehicle is currently being shared with a company",
          });
        } else {
          res.status(201).json({
            message: "validated",
          });
        }
      }
    });
    res.locals.connection.end();
  } else {
    //recurring is true
    const date_list = [];
    const date_array = getAll(date, recurring_end_date);

    for (let i = 0; i < date_array.length; i++) {
      for (let j = 0; j < recurring_days.length; j++) {
        //sunday is 0
        if (date_array[i].split(" ")[0] === recurring_days[j]) {
          date_list.push([
            date_array[i].split(" ")[1] + " " + start_time,
            date_array[i].split(" ")[1] + " " + end_time,
          ]);
        }
      }
    }
    const sql_2 = getUnionSQL(date_list, vehicle_id);
    res.locals.connection.query(sql_2, (error, results, fields) => {
      if (error) {
        if (error.errno === 1065) {
          return res.status(401).json({
            message:
              "The recurring days are not included in the recurring interval",
          });
        }
        res.status(401).json({
          message: "Cannot reach database to validate the inputs",
          error: error,
        });
      } else {
        if (results.length > 0) {
          for (let i = 0; i < results.length; i++) {
            if (results[i].count > 0) {
              return res.status(201).json({
                message: "The vehicle is currently being shared with a company",
              });
            }
          }
          res.status(201).json({
            message: "validated",
          });
        } else {
          res.status(201).json({
            message: "validated",
          });
        }
      }
    });
    res.locals.connection.end();
  }
};

exports.insertShareInfo = (req, res, next) => {
  const cust_id = req.body.cust_id;
  const vehicle_id = req.body.vehicle_id;
  const shareOnAndOff = req.body.share; // 1 or 0
  const date = req.body.date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;

  const recurring = req.body.recurring; // 1 or 0
  var recurring_end_date = null;
  var recurring_days = null;

  if (recurring === "1") {
    recurring_end_date = req.body.recurring_end_date;
    recurring_days = req.body.recurring_days;
  }
  const service_visibility = req.body.service_visibility; // 1 or 0
  var visible_service_ids = null;
  if (service_visibility === "1") {
    visible_service_ids = req.body.visible_service_ids;
  }

  const sql_0 =
    "INSERT INTO WC_VEHICLE_SHARE (cust_id,vehicle_id,share_active,recurring_flag,recurring_end_date,recurring_days) VALUES (?, ?, ?, ?, ?, ?);";
  const data_0 = [
    cust_id,
    vehicle_id,
    shareOnAndOff,
    recurring,
    recurring_end_date,
    recurring_days,
  ];

  res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
    if (error) {
      return res.status(401).json({
        message: "database operations failure",
        error: error,
      });
    } else {
      const share_id = results.insertId;

      //recurring is true
      if (recurring === "1") {
        const date_list = [];
        const date_array = getAll(date, recurring_end_date);

        date_list.push([
          share_id,
          date_array[0].split(" ")[1] + " " + start_time,
          date_array[0].split(" ")[1] + " " + end_time,
          shareOnAndOff,
        ]);

        for (let i = 1; i < date_array.length; i++) {
          for (let j = 0; j < recurring_days.length; j++) {
            //sunday is 0
            if (date_array[i].split(" ")[0] === recurring_days[j]) {
              date_list.push([
                share_id,
                date_array[i].split(" ")[1] + " " + start_time,
                date_array[i].split(" ")[1] + " " + end_time,
                shareOnAndOff,
              ]);
            }
          }
        }

        const sql_1 =
          "INSERT INTO WC_VSHARE_MAP (share_id, start_time, end_time, is_active) VALUES ?;";
        const data_1 = date_list;
        res.locals.connection.query(
          sql_1,
          [data_1],
          (error, results, fields) => {
            if (error) {
              res.status(401).json({
                message: "database operations failure",
                error: error,
              });
            } else {
              //if visible
              if (service_visibility === "1") {
                const sql_2 =
                  "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
                const data_2 = [parseInt(vehicle_id), parseInt(share_id)];
                res.locals.connection.query(
                  sql_2,
                  data_2,
                  (error, results, fields) => {
                    if (error) {
                      res.status(401).json({
                        message: "database operations failure",
                        error: error,
                      });
                    } else {
                      if (results.length === 0) {
                        //return directly
                        res.status(201).json({
                          message: "success",
                          share_id: share_id,
                        });
                      } else {
                        const sql_3 =
                          "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                        var data_3 = [];
                        for (let j = 0; j < results.length; j++) {
                          let visibleflag = false;
                          for (let i = 0; i < visible_service_ids.length; i++) {
                            if (
                              results[j].service_id ===
                              parseInt(visible_service_ids[i])
                            ) {
                              visibleflag = true;
                            }
                          }
                          data_3.push([
                            share_id,
                            results[j].service_id,
                            visibleflag,
                          ]);
                        }
                        res.locals.connection.query(sql_3,[data_3],(error, results, fields) => {
                            if (error) {
                              res.status(401).json({
                                message: "database operations failure",
                                error: error,
                              });
                            } else {
                              res.status(201).json({
                                message: "success",
                                share_id: share_id,
                              });
                            }
                          }
                        );
                        res.locals.connection.end();
                      }
                    }
                  }
                );
              } else {
                //insert all active service, set all to invisible
                const sql_4 =
                  "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
                const data_4 = [parseInt(vehicle_id), parseInt(share_id)];
                res.locals.connection.query(
                  sql_4,
                  data_4,
                  (error, results, fields) => {
                    if (error) {
                      res.status(401).json({
                        message: "database operations failure",
                        error: error,
                      });
                    } else {
                      if (results.length === 0) {
                        //return directly
                        res.status(201).json({
                          message: "success",
                          share_id: share_id
                        });
                      } else {
                        const sql_5 =
                          "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                        var data_5 = [];
                        for (let j = 0; j < results.length; j++) {
                          let visibleflag = false;
                          data_5.push([
                            share_id,
                            results[j].service_id,
                            visibleflag,
                          ]);
                        }
                        res.locals.connection.query(
                          sql_5,
                          [data_5],
                          (error, results, fields) => {
                            if (error) {
                              res.status(401).json({
                                message: "database operations failure",
                                error: error,
                              });
                            } else {
                              res.status(201).json({
                                message: "success",
                                share_id: share_id,
                              });
                            }
                          }
                        );
                        res.locals.connection.end();
                      }
                    }
                  }
                );
              }
            }
          }
        );
      } else {
        //insert one day
        const sql_6 =
          "INSERT INTO WC_VSHARE_MAP (share_id, start_time, end_time, is_active) VALUES (?,?,?,?);";
        const data_6 = [
          share_id,
          date + " " + start_time,
          date + " " + end_time,
          shareOnAndOff,
        ];
        res.locals.connection.query(sql_6, data_6, (error, results, fields) => {
          if (error) {
            res.status(401).json({
              message: "database operations failure",
              error: error,
            });
          } else {
            //if visible
            if (service_visibility === "1") {
              const sql_7 =
                "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
              const data_7 = [parseInt(vehicle_id), parseInt(share_id)];
              res.locals.connection.query(
                sql_7,
                data_7,
                (error, results, fields) => {
                  if (error) {
                    res.status(401).json({
                      message: "database operations failure",
                      error: error,
                    });
                  } else {
                    if (results.length === 0) {
                      //return directly
                      res.status(201).json({
                        message: "success",
                        share_id: share_id,
                      });
                    } else {
                      const sql_8 =
                        "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                      var data_8 = [];
                      for (let j = 0; j < results.length; j++) {
                        let visibleflag = false;
                        for (let i = 0; i < visible_service_ids.length; i++) {
                          if (
                            results[j].service_id ===
                            parseInt(visible_service_ids[i])
                          ) {
                            visibleflag = true;
                          }
                        }
                        data_8.push([
                          share_id,
                          results[j].service_id,
                          visibleflag,
                        ]);
                      }
                      res.locals.connection.query(sql_8,[data_8],(error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error,
                            });
                          } else {
                            res.status(201).json({
                              message: "success",
                              share_id: share_id,
                            });
                          }
                        }
                      );
                      res.locals.connection.end();
                    }
                  }
                }
              );
            } else {
              //insert all active service, set all to invisible
              const sql_9 =
                "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
              const data_9 = [parseInt(vehicle_id), parseInt(share_id)];
              res.locals.connection.query(
                sql_9,
                data_9,
                (error, results, fields) => {
                  if (error) {
                    res.status(401).json({
                      message: "database operations failure",
                      error: error,
                    });
                  } else {
                    if (results.length === 0) {
                      //return directly
                      res.status(201).json({
                        message: "success",
                        share_id: share_id,
                      });
                    } else {
                      const sql_10 =
                        "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                      var data_10 = [];
                      for (let j = 0; j < results.length; j++) {
                        let visibleflag = false;
                        data_10.push([
                          share_id,
                          results[j].service_id,
                          visibleflag,
                        ]);
                      }
                      res.locals.connection.query(
                        sql_10,
                        [data_10],
                        (error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error,
                            });
                          } else {
                            res.status(201).json({
                              message: "success",
                              share_id: share_id,
                            });
                          }
                        }
                      );
                      res.locals.connection.end();
                    }
                  }
                }
              );
            }
          }
        });
      }
    }
  });
};

exports.updateShareInfo = (req, res, next) => {
  const share_id = req.body.share_id;
  const cur_date = new Date();
  const year = cur_date.getFullYear();
  const month = cur_date.getMonth() + 1;
  const day = cur_date.getDate();
  const cur_date_formatted = year + "-" + month + "-" + day;

  const mode = req.body.mode; //0 active to inactive 1 others
  //console.log(1+" "+mode);

  const cust_id = req.body.cust_id;
  const vehicle_id = req.body.vehicle_id;
  const shareOnAndOff = req.body.share;
  const date = req.body.date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const recurring = req.body.recurring;
  var recurring_end_date = null;
  var recurring_days = null;
  if (recurring === "1") {
    recurring_end_date = req.body.recurring_end_date;
    recurring_days = req.body.recurring_days;
  }
  const service_visibility = req.body.service_visibility;
  var visible_service_ids = null;
  if (service_visibility === "1") {
    visible_service_ids = req.body.visible_service_ids;
  }

  //use share_id, get recurring
  //WC_VEHICLE_SHARE: set share_active to 0, set expire_date to cur_date_formatted according to share_id
  //WC_VSHARE_MAP: set is_active to 0, according to share_id
  //WC_SHARE_SVC_MAP: no change
  //insert a new record

  const sql = "UPDATE WC_VEHICLE_SHARE vs, WC_VSHARE_MAP vm SET vs.share_active=0,vs.expire_date=?,vm.is_active=0 WHERE vs.id=? AND vm.share_id=?;";
  const data = [cur_date_formatted, share_id, share_id];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(401).json({
        message: "database update failure",
        error: error
      });
    } else {
      //console.log(mode);
      if (parseInt(mode) === 0) {
        res.locals.connection.end();
        res.status(401).json({
          message: "success",
          share_id_inactivated: share_id,
        });
      } else {
        //insert a new one
        const sql_0 = "INSERT INTO WC_VEHICLE_SHARE (cust_id,vehicle_id,share_active,recurring_flag,recurring_end_date,recurring_days) VALUES (?, ?, ?, ?, ?, ?);";
        const data_0 = [cust_id, vehicle_id, shareOnAndOff, recurring, recurring_end_date, recurring_days];

        res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
          if (error) {
            return res.status(401).json({
              message: "database operations failure",
              error: error
            });
          } else {
            const new_share_id = results.insertId;

            //recurring is true
            if (recurring === "1") {
              const date_list = [];
              const date_array = getAll(date, recurring_end_date);

              for (let i = 0; i < date_array.length; i++) {
                for (let j = 0; j < recurring_days.length; j++) {
                  //sunday is 0
                  if (date_array[i].split(" ")[0] === recurring_days[j]) {
                    date_list.push([new_share_id, date_array[i].split(" ")[1] + " " + start_time, date_array[i].split(" ")[1] + " " + end_time, shareOnAndOff]);
                  }
                }
              }

              const sql_1 = "INSERT INTO WC_VSHARE_MAP (share_id, start_time, end_time, is_active) VALUES ?;";
              const data_1 = date_list;
              res.locals.connection.query(sql_1,[data_1],(error, results, fields) => {
                  if (error) {
                    res.status(401).json({
                      message: "database operations failure",
                      error: error
                    });
                  } else {
                    //if visible
                    if (service_visibility === "1") {
                      const sql_2 = "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
                      const data_2 = [parseInt(vehicle_id), parseInt(new_share_id)];
                      res.locals.connection.query(sql_2, data_2, (error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            if (results.length === 0) {
                              //return directly
                              res.status(201).json({
                                message: "success",
                                new_share_id: new_share_id
                              });
                            } else {
                              const sql_3 = "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                              var data_3 = [];
                              for (let j = 0; j < results.length; j++) {
                                let visibleflag = false;
                                for (let i = 0;i < visible_service_ids.length;i++) {
                                  if (results[j].service_id === parseInt(visible_service_ids[i])) {
                                    visibleflag = true;
                                  }
                                }
                                data_3.push([new_share_id,results[j].service_id,visibleflag]);
                              }
                              res.locals.connection.query(sql_3,[data_3],(error, results, fields) => {
                                  if (error) {
                                    res.status(401).json({
                                      message: "database operations failure",
                                      error: error
                                    });
                                  } else {
                                    res.status(201).json({
                                      message: "success",
                                      new_share_id: new_share_id
                                    });
                                  }
                                }
                              );
                              res.locals.connection.end();
                            }
                          }
                        }
                      );
                    } else {
                      //insert all active service, set all to invisible
                      const sql_4 ="SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
                      const data_4 = [parseInt(vehicle_id),parseInt(new_share_id)];
                      res.locals.connection.query(sql_4,data_4,(error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error
                            });
                          } else {
                            if (results.length === 0) {
                              //return directly
                              res.status(201).json({
                                message: "success",
                                new_share_id: new_share_id
                              });
                            } else {
                              const sql_5 ="INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                              var data_5 = [];
                              for (let j = 0; j < results.length; j++) {
                                let visibleflag = false;
                                data_5.push([new_share_id,results[j].service_id,visibleflag]);
                              }
                              res.locals.connection.query(sql_5,[data_5],(error, results, fields) => {
                                  if (error) {
                                    res.status(401).json({
                                      message: "database operations failure",
                                      error: error
                                    });
                                  } else {
                                    res.status(201).json({
                                      message: "success",
                                      new_share_id: new_share_id
                                    });
                                  }
                                }
                              );
                              res.locals.connection.end();
                            }
                          }
                        }
                      );
                    }
                  }
                }
              );
            } else {
              //insert one day
              const sql_6 =
                "INSERT INTO WC_VSHARE_MAP (share_id, start_time, end_time, is_active) VALUES (?,?,?,?);";
              const data_6 = [
                new_share_id,
                date + " " + start_time,
                date + " " + end_time,
                shareOnAndOff,
              ];
              res.locals.connection.query(
                sql_6,
                data_6,
                (error, results, fields) => {
                  if (error) {
                    res.status(401).json({
                      message: "database operations failure",
                      error: error,
                    });
                  } else {
                    //if visible
                    if (service_visibility === "1") {
                      const sql_7 =
                        "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
                      const data_7 = [
                        parseInt(vehicle_id),
                        parseInt(new_share_id),
                      ];
                      res.locals.connection.query(
                        sql_7,
                        data_7,
                        (error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error,
                            });
                          } else {
                            if (results.length === 0) {
                              //return directly
                              res.status(201).json({
                                message: "success",
                                new_share_id: new_share_id,
                              });
                            } else {
                              const sql_8 =
                                "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                              var data_8 = [];
                              for (let j = 0; j < results.length; j++) {
                                let visibleflag = false;
                                for (let i = 0;i < visible_service_ids.length;i++) {
                                  if (
                                    results[j].service_id ===
                                    parseInt(visible_service_ids[i])
                                  ) {
                                    visibleflag = true;
                                  }
                                }
                                data_8.push([
                                  new_share_id,
                                  results[j].service_id,
                                  visibleflag,
                                ]);
                              }
                              res.locals.connection.query(
                                sql_8,
                                [data_8],
                                (error, results, fields) => {
                                  if (error) {
                                    res.status(401).json({
                                      message: "database operations failure",
                                      error: error,
                                    });
                                  } else {
                                    res.status(201).json({
                                      message: "success",
                                      new_share_id: new_share_id,
                                    });
                                  }
                                }
                              );
                              res.locals.connection.end();
                            }
                          }
                        }
                      );
                    } else {
                      //insert all active service, set all to invisible
                      const sql_9 =
                        "SELECT service_id FROM WC_VEHICLE_SHARE s JOIN WC_SVC_VEHICLE_MAP m ON s.vehicle_id=m.vehicle_id WHERE m.vehicle_id = ? AND is_active = 1 AND s.id=?;";
                      const data_9 = [
                        parseInt(vehicle_id),
                        parseInt(new_share_id),
                      ];
                      res.locals.connection.query(
                        sql_9,
                        data_9,
                        (error, results, fields) => {
                          if (error) {
                            res.status(401).json({
                              message: "database operations failure",
                              error: error,
                            });
                          } else {
                            if (results.length === 0) {
                              //return directly
                              res.status(201).json({
                                message: "success",
                                new_share_id: new_share_id,
                              });
                            } else {
                              const sql_10 =
                                "INSERT INTO WC_SHARE_SVC_MAP (share_id, service_id, is_active) VALUES ?;";
                              var data_10 = [];
                              for (let j = 0; j < results.length; j++) {
                                let visibleflag = false;
                                data_10.push([
                                  new_share_id,
                                  results[j].service_id,
                                  visibleflag,
                                ]);
                              }
                              res.locals.connection.query(
                                sql_10,
                                [data_10],
                                (error, results, fields) => {
                                  if (error) {
                                    res.status(401).json({
                                      message: "database operations failure",
                                      error: error,
                                    });
                                  } else {
                                    res.status(201).json({
                                      message: "success",
                                      new_share_id: new_share_id,
                                    });
                                  }
                                }
                              );
                              res.locals.connection.end();
                            }
                          }
                        }
                      );
                    }
                  }
                }
              );
            }
          }
        });
      }
    }
  });
};

exports.sharedCompanyList = (req, res, next) => {
  //use vehicle_id
  //return list of cust_id,company_name,date+start_time, date+end_time
  //return only active ones
  const vehicle_id = req.params.vid;
  const sql =
    "SELECT s.id, recurring_flag, recurring_end_date,recurring_days,cust_id,company_name, start_time, end_time, share_active FROM WC_VEHICLE_SHARE s JOIN WC_CUSTOMER_INFO USING (cust_id) JOIN WC_VSHARE_MAP vm ON s.id=vm.share_id WHERE vehicle_id=?;";
  const data = [vehicle_id];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "failed to fetch company list",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle has no active sharing",
          result: results
        });
      } else {
        const return_results = [];
        const ids = [];
        for (let i = 0; i < results.length; i++) {
          if (ids.indexOf(results[i].id) !== -1) {
            continue;
          } else {
            ids.push(results[i].id);
          }
          if (results[i].recurring_flag === 1) {
            return_results.push({
              share_id: results[i].id,
              recurring_flag: results[i].recurring_flag,
              recurring_end_date: results[i].recurring_end_date.split(" ")[0],
              recurring_days: results[i].recurring_days,
              cust_id: results[i].cust_id,
              company_name: results[i].company_name,
              start_time: results[i].start_time.split(" ")[1],
              end_time: results[i].end_time.split(" ")[1],
              share_active: results[i].share_active
            });
          } else {
            return_results.push({
              share_id: results[i].id,
              recurring_flag: results[i].recurring_flag,
              cust_id: results[i].cust_id,
              company_name: results[i].company_name,
              date: results[i].start_time.split(" ")[0],
              start_time: results[i].start_time.split(" ")[1],
              end_time: results[i].end_time.split(" ")[1],
              share_active: results[i].share_active
            });
          }
        }
        res.status(200).json({
          message: "success",
          result: return_results
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.sharedVehicleList = (req, res, next) => {
  const cust_id = req.params.cid;
  const sql =
    "SELECT s.id, recurring_flag, recurring_end_date,recurring_days,vehicle_id,registration_no,user_id,user_name, start_time, end_time FROM WC_VEHICLE_SHARE s JOIN WC_VEHICLE USING (vehicle_id) JOIN WC_USER USING (user_id) JOIN WC_VSHARE_MAP vm ON s.id=vm.share_id WHERE cust_id=?;";
  const data = [cust_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "failed to fetch vehicle list",
        error: error,
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The company has no sharing records",
          result: results,
        });
      } else {
        const return_results = [];
        const ids = [];
        for (let i = 0; i < results.length; i++) {
          if (ids.indexOf(results[i].id) !== -1) {
            continue;
          } else {
            ids.push(results[i].id);
          }
          if (results[i].recurring_flag === 1) {
            return_results.push({
              share_id: results[i].id,
              recurring_flag: results[i].recurring_flag,
              recurring_end_date: results[i].recurring_end_date.split(" ")[0],
              recurring_days: results[i].recurring_days,
              user_id: results[i].user_id,
              user_name: results[i].user_name,
              registration_no: results[i].registration_no,
              date: results[i].start_time.split(" ")[0],
              start_time: results[i].start_time.split(" ")[1],
              end_time: results[i].end_time.split(" ")[1],
            });
          } else {
            return_results.push({
              share_id: results[i].id,
              recurring_flag: results[i].recurring_flag,
              recurring_end_date: "",
              recurring_days: "",
              user_id: results[i].user_id,
              user_name: results[i].user_name,
              registration_no: results[i].registration_no,
              date: results[i].start_time.split(" ")[0],
              start_time: results[i].start_time.split(" ")[1],
              end_time: results[i].end_time.split(" ")[1],
            });
          }
        }
        res.status(200).json({
          message: "success",
          result: return_results,
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.detailedShareApp = (req, res, next) => {
  const share_id = req.params.sid;
  const sql =
    "SELECT cust_id,company_name,share_active,start_time,end_time,recurring_flag,recurring_end_date, recurring_days,service_id,service_name,ssm.is_active FROM WC_VEHICLE_SHARE vs JOIN WC_CUSTOMER_INFO USING (cust_id) JOIN WC_VSHARE_MAP vm ON vm.share_id = vs.id LEFT JOIN WC_SHARE_SVC_MAP ssm ON ssm.share_id=vs.id LEFT JOIN WC_SERVICES USING (service_id) WHERE vs.id=?;";
  const data = [share_id];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "failed to fetch sharing details",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The sharing record does not exist",
          result: results
        });
      } else {
        const cust_id = results[0].cust_id;
        const company_name = results[0].company_name;
        const share_active = results[0].share_active;

        const recurring = results[0].recurring_flag;
        const recurring_days = results[0].recurring_days;
        var recurring_end_date = null;
        if(results[0].recurring_end_date !== null){
          recurring_end_date = results[0].recurring_end_date.split(" ")[0];
        }

        const date = results[0].start_time.split(" ")[0];

        const start_time = results[0].start_time.split(" ")[1];
        const end_time = results[0].end_time.split(" ")[1];

        var service_visibility = 1;
        const service_list = [];
        const ids = [];
        for (let i = 0; i < results.length; i++) {
          if (ids.indexOf(results[i].service_id) !== -1) {
            continue;
          } else {
            ids.push(results[i].service_id);
          }
          service_list.push({
            service_id: results[i].service_id,
            service_name: results[i].service_name,
            is_visible: results[i].is_active,
          });
        }

        if(service_list[0].service_id === null){
          service_visibility = 0;
          service_list.length = 0;
        }

        const result = {
          cust_id: cust_id,
          company_name: company_name,
          share_active: share_active,
          recurring_flag: recurring,
          recurring_days: recurring_days,
          recurring_end_date: recurring_end_date,
          date: date,
          start_time: start_time,
          end_time: end_time,
          service_visibility: service_visibility,
          service_list: service_list
        };

        res.status(200).json({
          message: "success",
          result: result
        });
      }
    }
  });
  res.locals.connection.end();
};

//get all dates
function getAll(begin, end) {
  if (!begin || !end) {
    return false;
  }

  Date.prototype.format = function () {
    var s = "";
    var weekday = this.getDay();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    s += weekday + " ";
    s += this.getFullYear() + "-";
    s += month + "-";
    s += day;
    return s;
  };
  var ab = begin.split("-");
  var ae = end.split("-");
  var db = new Date();
  db.setUTCFullYear(ab[0], ab[1] - 1, ab[2]);
  var de = new Date();
  de.setUTCFullYear(ae[0], ae[1] - 1, ae[2]);
  var unixDb = db.getTime();
  var unixDe = de.getTime();
  var arr = [];
  for (var k = unixDb; k <= unixDe; ) {
    arr.push(new Date(parseInt(k)).format());
    k = k + 24 * 60 * 60 * 1000;
  }
  return arr;
}

function getInClause(service_ids) {
  let result = service_ids[0];
  for (let i = 1; i < service_ids.length; i++) {
    result = result + "," + service_ids[i];
  }
  return result;
}

function getUnionSQL(dates, vehicle_id) {
  var sql = "";

  for (let i = 0; i < dates.length; i++) {
    let sub_sql =
      "SELECT COUNT(*) AS count FROM WC_VSHARE_MAP m JOIN WC_VEHICLE_SHARE s on m.share_id=s.id WHERE ((start_time > '" +
      dates[i][0] +
      "' AND start_time < '" +
      dates[i][1] +
      "') OR (start_time <= '" +
      dates[i][0] +
      "' AND end_time >= '" +
      dates[i][1] +
      "') OR (end_time > '" +
      dates[i][0] +
      "' AND end_time < '" +
      dates[i][1] +
      "') OR (start_time >= '" +
      dates[i][0] +
      "' AND end_time <= '" +
      dates[i][1] +
      "')) AND vehicle_id = " +
      vehicle_id +
      " AND is_active = 1";
    sql += sub_sql;
    if (i < dates.length - 1) {
      sql += " UNION ALL ";
    }
  }
  sql += ";";
  return sql;
}

exports.webDetailUser = (req, res, next)=>{
  const user_id = req.body.user_id;
  const current_date = req.body.current_date;
  const sql = "SELECT user_name, email_address, image,licence_no,expiry_date, DATEDIFF(expiry_date,?) AS days_remaining FROM WC_USER LEFT JOIN WC_IMAGE USING (image_id) LEFT JOIN WC_DRIVERLICENCE_RECORD USING (user_id) WHERE user_id = ?;";
  const data = [current_date, user_id];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The user does not exist",
        });
      } else {
        const base64 = Buffer.from(results[0].image).toString('base64');
        res.status(200).json({
          message: "success",
          user_name: results[0].user_name,
          email_address: results[0].email_address,
          image: base64,
          license_no: results[0].licence_no,
          expiry_date: results[0].expiry_date,
          days_remaining: results[0].days_remaining
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.webDetailVehicle = (req, res, next)=>{
  const registration_no = req.body.registration_no;
  const sql = "SELECT make_name, model_name FROM WC_VEHICLE LEFT JOIN WC_VEHICLE_MAKE USING (make_id) LEFT JOIN WC_VEHICLE_MODEL USING (model_id) WHERE registration_no=?;";
  const data = [registration_no];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle does not exist"
        });
      } else {
        res.status(200).json({
          message: "success",
          make_name: results[0].make_name,
          model_name: results[0].model_name
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.webDetailRegistrationImage = (req, res, next)=>{
  const user_id = req.body.user_id;
  const cust_id = req.body.cust_id;
  const sql = "SELECT DISTINCT registration_no, image FROM WC_VEHICLE_SHARE LEFT JOIN WC_VEHICLE USING (vehicle_id) LEFT JOIN WC_IMAGE USING (image_id) WHERE cust_id=? AND user_id=?;";
  const data = [cust_id, user_id];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle does not exist",
          result: results
        });
      } else {
        for(let i=0;i<results.length;i++){
          results[i].image = Buffer.from(results[i].image).toString('base64');
        }
        res.status(200).json({
          message: "success",
          result: results
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.webDetailService = (req, res, next)=>{
  const registration_no = req.body.registration_no;

  const sql = "SELECT id, MAX(service_date) AS last_service_date FROM WC_SERVICE_RECORDS LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE registration_no = ?;";
  const data = [registration_no];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle does not exist",
          result: results
        });
      } else {
        const record_id = results[0].id;
        const last_service_date = results[0].last_service_date
        const sql_1 = "SELECT id FROM WC_SVCREC_DOC_MAP WHERE service_rec_id = ? AND record_timestamp=(SELECT MAX(record_timestamp) FROM WC_SVCREC_DOC_MAP WHERE service_rec_id=?);";
        const data_1 = [record_id, record_id];
        res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
          if (error) {
            res.status(404).json({
              message: "database operations error",
              error: error
            });
          }else{
            let url = "";
            if (results.length === 0) {
              url = backend_url+"/api/v1/servicerecords/appfilepreview/null";
            }else{
              url = backend_url+"/api/v1/servicerecords/appfilepreview/"+results[0].id;
            }
            res.status(200).json({
              message: "success",
              last_service_date: last_service_date,
              file_url: url
            });
          }
        });
        res.locals.connection.end();
      }
    }
  });
};

exports.webDetailRegistration = (req, res, next)=>{

  const registration_no = req.body.registration_no;

  const sql = "SELECT id,MAX(reg_expiry_date) AS expiry_date FROM WC_REGISTRATION_RECORD LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE registration_no = ?;";
  const data = [registration_no];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle does not exist",
          result: results
        });
      } else {
        res.status(200).json({
          message: "success",
          expiry_date: results[0].expiry_date,
          registration_rec_id: results[0].id
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.webSetRegistrationReminder = (req, res, next)=>{
  const registration_rec_id = req.body.registration_rec_id;
  const sql = "UPDATE WC_REGISTRATION_RECORD SET reg_reminder=1 WHERE id=?;";
  const data=[registration_rec_id];
  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
        if(results.affectedRows == 1){
          res.status(200).json({
            message: "success"
          });
        }else{
          res.status(200).json({
            message: "failure"
          });
        }
    }
  });
  res.locals.connection.end();
};

exports.webDetailInsurance = (req, res, next)=>{
  const registration_no = req.body.registration_no;

  const sql = "SELECT id, cover_type, MAX(cover_end_date) AS end_date FROM WC_INSURANCE_RECORD LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE registration_no = ?;";
  const data = [registration_no];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(200).json({
          message: "The vehicle does not exist",
          result: results
        });
      } else {
        const record_id = results[0].id;
        const cover_type = results[0].cover_type;
        const end_date = results[0].end_date;
        const sql_1 = "SELECT id FROM WC_INSURANCEREC_DOC_MAP WHERE insurance_rec_id = ? AND record_timestamp=(SELECT MAX(record_timestamp) FROM WC_INSURANCEREC_DOC_MAP WHERE insurance_rec_id=?);";
        const data_1 = [record_id, record_id];
        res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
          if (error) {
            res.status(404).json({
              message: "database operations error",
              error: error
            });
          }else{
            let url = "";
            if (results.length === 0) {
              url = backend_url+"/api/v1/registrationrecords/appfilepreview/null";
            }else{
              url = backend_url+"/api/v1/registrationrecords/appfilepreview/"+results[0].id;
            }
            res.status(200).json({
              message: "success",
              cover_type: cover_type,
              end_date: end_date,
              file_url: url
            });
          }
        });
        res.locals.connection.end();
      }
    }
  });
};

exports.webDetailClaim = (req, res, next)=>{
  const cust_id = req.body.cust_id;
  const registration_no = req.body.registration_no;
  const sql = "SELECT DATE_FORMAT(log_start_date_time, '%Y-%m-%d') AS date, SUM(km_travel) AS total_km, SUM(total_travel_times) AS total_time, SUM(km_travel)*claim_rate AS claim_amount FROM WC_DRIVER_LOGS LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE registration_no=? AND customer_id=? GROUP BY DATE_FORMAT(log_start_date_time, '%Y-%m-%d');";
  const data = [registration_no, cust_id];
  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if (error) {
      res.status(404).json({
        message: "database operations error",
        error: error
      });
      res.locals.connection.end();
    }else{
      const result = results; //date, total_km, total_time, claim_amount
      const sql_1 = "SELECT MAX(pr.id) AS parking_rec_id, date FROM WC_VEHICLE LEFT JOIN WC_PARKING_RECORD pr USING (vehicle_id) WHERE registration_no=? AND shared_company_id=?;";
      const data_1 = [registration_no, cust_id];
      res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
        for(let i=0;i<result.length;i++){
          result[i].parking_rec_id = null;
          result[i].fuel_rec_id = null;
        }
        if (error) {
          res.status(200).json({
            message: "success",
            result: result
          });
          res.locals.connection.end();
        }else{
          if(results.length==0){
            res.status(200).json({
              message: "success",
              result: result
            });
          }else{
            const parking_rec_id = results[0].parking_rec_id;
            const parking_date = results[0].date;
            for(let i=0;i<result.length;i++){
              if(result[i].date == parking_date){
                result[i].parking_rec_id = parking_rec_id;
              }
            }
          }
          const sql_2 = "SELECT MAX(fr.id) AS fuel_rec_id, date FROM WC_VEHICLE LEFT JOIN WC_FUEL_RECORD fr USING (vehicle_id)  WHERE registration_no=? AND shared_company_id=?;";
          const data_2 = [registration_no, cust_id];
          res.locals.connection.query(sql_2, data_2, (error, results, fields)=>{
            if (error) {
              res.status(200).json({
                message: "success",
                result: result
              });
            }else{
              if(results.length==0){
                res.status(200).json({
                  message: "success",
                  result: result
                });
              }else{
                const fuel_rec_id = results[0].fuel_rec_id;
                const fuel_date = results[0].date;
                for(let i=0;i<result.length;i++){
                  if(result[i].date == fuel_date){
                    result[i].fuel_rec_id = fuel_rec_id;
                  }
                }
                res.status(200).json({
                  message: "success",
                  result: result
                });
              }
            }
          });
          res.locals.connection.end();
        }
      });
    }
  });
};

exports.webDatailParkingReceipt = (req, res, next)=>{
  const parking_rec_id = req.body.parking_rec_id;
  const sql = "SELECT id FROM WC_PARKINGREC_DOC_MAP WHERE parking_rec_id = ? AND record_timestamp= (SELECT MAX(record_timestamp) FROM WC_PARKINGREC_DOC_MAP WHERE parking_rec_id=?);";
  const data = [parking_rec_id, parking_rec_id];
  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error:error
      });
    }else{
      let url = backend_url+"/api/v1/parkingreceipts/appfilepreview/";
      if(results.length == 0){
        res.status(200).json({
          message: "success",
          file_url: url+"null"
        });
      }else{
        const doc_id = results[0].id;
        res.status(200).json({
          message: "success",
          file_url: url+doc_id
        });
      }
    }
  });
  res.locals.connection.end();
};

exports.webDetailFuelReceipt = (req, res, next)=>{
  const fuel_rec_id = req.body.fuel_rec_id;
  const sql = "SELECT id FROM WC_FUELREC_DOC_MAP WHERE fuel_rec_id = ? AND record_timestamp= (SELECT MAX(record_timestamp) FROM WC_FUELREC_DOC_MAP WHERE fuel_rec_id=?);";
  const data = [fuel_rec_id, fuel_rec_id];
  res.locals.connection.query(sql, data, (error, results, fields)=>{
    if(error){
      res.status(404).json({
        message: "database operations failure",
        error:error
      });
    }else{
      let url = backend_url+"/api/v1/fuelreceipts/appfilepreview/";
      if(results.length == 0){
        res.status(200).json({
          message: "success",
          file_url: url+"null"
        });
      }else{
        const doc_id = results[0].id;
        res.status(200).json({
          message: "success",
          file_url: url+doc_id
        });
      }
    }
  });
  res.locals.connection.end();
};
