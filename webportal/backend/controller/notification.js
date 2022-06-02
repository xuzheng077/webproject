//registration expiry date, service due date, insurance cover end date, driver license expiry date
//get registration no and the expiry date
exports.getTwoClosestNotification = (req, res, next)=>{
    const user_id = req.body.user_id;
    const current_date = req.body.current_date;

    const sql = "SELECT registration_no, next_service_date AS expiry_date, ABS(DATEDIFF(next_service_date,?)) AS date_diff, 'Next service date' AS type FROM WC_SERVICE_RECORDS LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE user_id = ? HAVING date_diff IS NOT NULL UNION ALL SELECT registration_no, reg_expiry_date AS expiry_date, ABS(DATEDIFF(reg_expiry_date,?)) AS date_diff, 'Registration expiry date' AS type FROM WC_REGISTRATION_RECORD LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE user_id = ? HAVING date_diff IS NOT NULL UNION ALL SELECT registration_no, cover_end_date AS expiry_date, ABS(DATEDIFF(cover_end_date,?)) AS date_diff, 'Insurance cover end date' AS type FROM WC_INSURANCE_RECORD LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE user_id = ? HAVING date_diff IS NOT NULL UNION ALL SELECT registration_no, expiry_date, ABS(DATEDIFF(expiry_date,?)) AS date_diff, 'Driver license expiry date' AS type FROM WC_DRIVERLICENCE_RECORD LEFT JOIN WC_VEHICLE USING (user_id) WHERE user_id = ? HAVING date_diff IS NOT NULL ORDER BY date_diff, registration_no LIMIT 2;";
    const data = [current_date, user_id, current_date, user_id, current_date, user_id, current_date, user_id];
    res.locals.connection.query(sql, data, (error, results, fields)=>{
        if(error){
            res.status(404).json({
                message: "database operations faliure",
                error: error
            });
        }else{
            if(results.length === 0){
                res.status(200).json({
                    message: "There is no recent notifications",
                    results: results
                });
            }else{
                res.status(200).json({
                    message: "success",
                    results: results
                });
            }
        }
    });
    res.locals.connection.end();
};

exports.getNotificationForCalendar = (req, res, next)=>{

    const user_id = req.body.user_id;
    const current_date = req.body.current_date;

    const sql = "SELECT registration_no, next_service_date AS expiry_date, ABS(DATEDIFF(next_service_date,?)) AS date_diff, 'Next service date' AS type FROM WC_SERVICE_RECORDS LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE user_id = ? HAVING date_diff IS NOT NULL UNION ALL SELECT registration_no, reg_expiry_date AS expiry_date, ABS(DATEDIFF(reg_expiry_date,?)) AS date_diff, 'Registration expiry date' AS type FROM WC_REGISTRATION_RECORD LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE user_id = ? HAVING date_diff IS NOT NULL UNION ALL SELECT registration_no, cover_end_date AS expiry_date, ABS(DATEDIFF(cover_end_date, ?)) AS date_diff, 'Insurance cover end date' AS type FROM WC_INSURANCE_RECORD LEFT JOIN WC_VEHICLE USING (vehicle_id) WHERE user_id = ? HAVING date_diff IS NOT NULL UNION ALL SELECT registration_no, MAX(expiry_date) AS expiry_date, ABS(DATEDIFF(expiry_date, ?)) AS date_diff, 'Driver license expiry date' AS type FROM WC_DRIVERLICENCE_RECORD LEFT JOIN WC_VEHICLE USING (user_id) WHERE user_id = ? HAVING date_diff IS NOT NULL ORDER BY expiry_date, registration_no;"
    const data = [current_date, user_id, current_date, user_id, current_date, user_id, current_date, user_id];

    res.locals.connection.query(sql, data, (error, results, fields)=>{
        if(error){
            res.status(404).json({
                message: "database operations faliure",
                error: error
            });
        }else{
            if(results.length === 0){
                res.status(200).json({
                    message: "There is no notifications for this user",
                    results: results
                });
            }else{
                res.status(200).json({
                    message: "success",
                    results: results
                });
            }
        }
    });
    res.locals.connection.end();
};
