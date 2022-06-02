exports.getCountries = (req, res, next)=>{

  const sql = 'SELECT * FROM WC_COUNTRY;';

  res.locals.connection.query(sql, (error, results, fields) => {
    if (error) {
      res.status(500).json({
        message: "failure",
        error: error
      });
    }else{
      res.status(200).json({
        message: "success",
        response: results
      });
    }
  });
  res.locals.connection.end();
};
