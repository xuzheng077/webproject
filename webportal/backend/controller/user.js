const jwt = require("jsonwebtoken");
const crypto = require("crypto");

exports.registerUser = (req, res, next) => {

  const email = req.body.email;
  const username = req.body.user_name;
  //const password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  const password = req.body.password;
  var new_image_id;

  if (req.files) {
    //insert image table
    //onsole.log("111");
    //console.log(req.files.logo);
    const sql = "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
    const data = [req.files.logo.mimetype, req.files.logo.data];

    res.locals.connection.query(sql, data, (error, results, fields) => {
      if (error) {
        return res.status(500).json({
          message: "failure",
          error: error
        });
      } else {
        new_image_id = results.insertId;
        //console.log("new image id: "+new_image_id);
        const sql_1 = "INSERT INTO WC_USER (user_name, First_name, Last_name, Date_of_birth, Address_line1, Address_line2, Postcode, state_id, Country_id,email_address, image_id, password) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);";
        const data_1 = [req.body.user_name, req.body.first_name, req.body.last_name, req.body.date_of_birth, req.body.address_line1, req.body.address_line2, req.body.postcode, req.body.state, req.body.country, req.body.email, new_image_id, password];

        res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
          if (error) {
            //console.log("error: "+error);
            res.status(401).json({
              message: "failure",
              error: error
            });
          } else {
            //console.log(2222);
            res.status(201).json({
              message: "success",
              username: username,
              email: email,
              user_id: results.insertId,
            });
          }
        });
        res.locals.connection.end();
      }
    });
  } else {
    const sql_1 =
      "INSERT INTO WC_USER (user_name, First_name, Last_name, Date_of_birth, Address_line1, Address_line2, Postcode, state_id, Country_id,email_address, password) VALUES (?,?,?,?,?,?,?,?,?,?,?);";
    const data_1 = [
      req.body.user_name,
      req.body.first_name,
      req.body.last_name,
      req.body.date_of_birth,
      req.body.address_line1,
      req.body.address_line2,
      req.body.postcode,
      req.body.state,
      req.body.country,
      req.body.email,
      password
    ];

    res.locals.connection.query(sql_1, data_1, (error, results, fields) => {
      if (error) {
        res.status(500).json({
          message: "failure",
          error: error
        });
      } else {
        res.status(201).json({
          message: "success",
          email: email,
          user_id: results.insertId
        });
      }
    });
    res.locals.connection.end();
  }
};

exports.loginUser = (req, res, next) => {
  const username = req.body.user_name;
  //const password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  const password = req.body.password;
  //customer does not exist or pass does not match

  const sql = "SELECT user_id, password FROM WC_USER WHERE user_name = ?";
  const data = [username];
  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      res.status(401).json({
        message: "database operations failure",
        error: error,
      });
    } else {
      if (results.length === 0) {
        res.status(401).json({
          message: "This username is not registered",
        });
      } else {
        if (password === results[0].password) {
          const token = jwt.sign(
            { username: username },
            "the_key_should_be_longer_str",
            { expiresIn: "24h" }
          );
          res.status(201).json({
            message: "success",
            token: token,
            expiresIn: 2592000,
            user_id: results[0].user_id,
          });
        } else {
          res.status(401).json({
            message: "The password does not match",
          });
        }
      }
    }
  });
  res.locals.connection.end();
};

//return image, email, username
exports.getUserInfo = (req, res, next) => {
  const user_id = req.params.userId;

  const sql = "SELECT user_name, email_address, image FROM WC_USER LEFT JOIN WC_IMAGE USING (image_id) WHERE user_id = ?;";
  const data = [user_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      return res.status(401).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(401).json({
          message: "The user does not exist",
        });
      } else {
        if (results[0].image === null) {
          res.status(200).json({
            message: "success",
            user_name: results[0].user_name,
            email_address: results[0].email_address
          });
        } else {
          const base64 = Buffer.from(results[0].image, "binary").toString(
            "base64"
          );
          res.status(200).json({
            message: "success",
            user_name: results[0].user_name,
            email_address: results[0].email_address,
            logo: base64
          });
        }
      }
    }
  });
  res.locals.connection.end();
};

exports.updateUserProfile = (req, res, next)=>{
  const user_id = req.body.user_id;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email_address = req.body.email_address;
  const password = req.body.password;

  if(req.files){
    const sql = "INSERT INTO WC_IMAGE (image_type, image) VALUES (?,?);";
    const data = [req.files.logo.mimetype, req.files.logo.data];
    res.locals.connection.query(sql, data, (error, results, fields)=>{
      if (error) {
        res.status(401).json({
          message: "failure",
          error: error
        });
      }else{
        let new_image_id = results.insertId;
        //console.log("new image id: "+new_image_id);
        const sql_0 = "UPDATE WC_USER SET First_name=?, Last_name=?, email_address=?, image_id=?, password=? WHERE user_id=?;";
        const data_0 = [first_name, last_name, email_address, new_image_id, password, user_id];

        res.locals.connection.query(sql_0, data_0, (error, results, fields) => {
          if (error) {
            //console.log("error: "+error);
            res.status(401).json({
              message: "database operations failure",
              error: error
            });
          } else {
            //console.log(2222);
            res.status(201).json({
              message: "success"
            });
          }
        });
        res.locals.connection.end();
      }
    });
  }else{
    const sql_1 = "UPDATE WC_USER SET First_name=?, Last_name=?, email_address=?, password=? WHERE user_id=?;";
    const data_1 = [first_name, last_name, email_address, password, user_id];
    res.locals.connection.query(sql_1, data_1, (error, results, fields)=>{
      if (error) {
        res.status(401).json({
          message: "database operations failure",
          error: error
        });
      }else{
        res.status(201).json({
          message: "success"
        });
      }
    });
    res.locals.connection.end();
  }
};

//get user id
//return image, first name, last name, email, password
exports.getProfile = (req, res, next) => {
  const user_id = req.body.user_id;

  const sql = "SELECT First_name, Last_name, password, email_address, image FROM WC_USER LEFT JOIN WC_IMAGE USING (image_id) WHERE user_id = ?;";
  const data = [user_id];

  res.locals.connection.query(sql, data, (error, results, fields) => {
    if (error) {
      return res.status(401).json({
        message: "database operations failure",
        error: error
      });
    } else {
      if (results.length === 0) {
        res.status(401).json({
          message: "The user does not exist",
        });
      } else {
        if (results[0].image === null) {
          res.status(200).json({
            message: "success",
            first_name: results[0].First_name,
            last_name: results[0].Last_name,
            email_address: results[0].email_address,
            password: results[0].password,
            logo:""
          });
        } else {
          const base64 = Buffer.from(results[0].image, "binary").toString("base64");
          res.status(200).json({
            message: "success",
            first_name: results[0].First_name,
            last_name: results[0].Last_name,
            email_address: results[0].email_address,
            password: results[0].password,
            logo: base64
          });
        }
      }
    }
  });
  res.locals.connection.end();
};
