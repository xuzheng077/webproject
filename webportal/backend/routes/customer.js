const express = require("express");

const router = express.Router();

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg'
}

const customerController = require('../controller/customer');

//const multiparty = require("connect-multiparty");

//var multipartMiddleware = multiparty();


// const storage = multer.diskStorage({
//   destination: (req, file, cb)=>{
//     const isValid = MIME_TYPE_MAP[file.mimetype];
//     let error = new Error("Invalid Mime Type");
//     if(isValid){
//       error = null;
//     }
//     cb(error, "backend/images");
//   },
//   filename: (req, file, cb) => {
//     const name = file.originalname.toLowerCase().split(' ').join('-');
//     const ext = MIME_TYPE_MAP[file.mimetype];
//     cb(null, name + '-' + Date.now() + '.' + ext);
//   }
// });


// router.get('/', (req, res, next) => {
// 	res.locals.connection.query('SELECT * from users', function (error, results, fields) {
// 		if (error) throw error;
// 		res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
// 	});
// });

//router.post('', multer({storage:storage}).single("logo"), ()=>{})
router.post('/register',customerController.registerCustomer);

//add check-auth middleware here, refer to course notes 116
router.post('/login',customerController.loginCustomer);

router.get('/:custId', customerController.getCustomerInfo);
router.get('/customer/list', customerController.getAllCustomers);

module.exports = router;
