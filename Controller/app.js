//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+
//.---------------.---------------.
//| Name          | Li Yifan      |
//:---------------+---------------:
//| Class         | DAAA/FT/1B/01 |
//:---------------+---------------:
//| Admission No. | 2011860       |
//'---------------'---------------'

var express = require('express');
const { Validator, ValidationError } = require("express-json-validator-middleware");

var users = require('../model/users');
var categories = require('../model/categories');
var tokenAuth = require('../auth/tokenAuth');

var app = express();
const { validate } = new Validator();
// //PICK ONE USE BODY PARSET OR DONT USE BODY PARSER WILL GET SAME RESULT
// const bodyParser = require('body-parser');
// const urlencodedParser = bodyParser.urlencoded({extended:false});
// app.use(urlencodedParser); //attach body-parser middelware to decode x-www-form-urlencoded to req.body 
// app.use(express.json()); //parse req.body to json data

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Users Table
app.get("/users/", (req, res) => {
	users.getAllUsers((err, users) => {
		if (err) {
			res.status(500).send({ 
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
			});
			return;
		}
		res.status(200).send(users);
	});
});
var userSchema = {
	type: "object",
	required: ["username", "email", "type", "password"],
	properties: {
		username: {
			type: "string",
			maxLength: 20,
			minLength: 1
		},
		email: {
			type: "string",
			format: "email",
			maxLength: 45,
			minLength: 1,
		},
		password: {
			type: "string",
			minLength: 6,
			maxLength: 20,
		},
		type:{
			type: "string",
			maxLength: 8,
			minLength: 5
		},
		profile_pic_url:{
			type: "string",
			maxLength: 45
		}
	},
};

app.post("/users/", validate({body: userSchema}), (req, res) => {
	///VALIDATE USER INPUT???////
	users.createUser(req.body, (err, insertId) => {
		if (err) {
			res.status(500).send({ 
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
			});
			return;
		}
		res.status(201).send({"User_id" : insertId});
	});
});
app.get("/users/:id", (req, res) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) {
		res.status(400).send({ 
			"Result": "Bad Request",
			"Message": "User id is not an Integer."
		});
		return;
	}

	users.getUserWithID(id, (err, user) => {
		if (err) {
			res.status(500).send({ 
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
			});
			return;
		}
		if (user.length === 0) {
			res.status(404).send();
			return;
		}
		res.status(200).send(user);
	});
});
var userLoginSchema = {
	type: "object",
	required: ["email","password"],
	properties: {
		email: {
			type: "string",
			format: "email",
			maxLength: 45,
			minLength: 1,
		},
		password: {
			type: "string",
			minLength: 6,
			maxLength: 20,
		}
	}
};
app.post("/users/login", validate({body : userLoginSchema}) , (req,res)=>{
	users.userLogin(req.body,(err,user)=>{
		if(err){
			if(err.errCode == 401){
				res.status(401).send({ 
					"Result": "Unauthorized",
					"Message": "Please Enter the Correct Email or Password"
				});
				return;
			}
			res.status(500).send({ 
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		res.status(200)
		.header({
			Authorization : `Bearer ${user.token}`
		}).send(`Welcome ${user.username}!`);
	});
});

//Category Table
var categorySchema = {
	type : "object",
	required : ["catname", "description"],
	properties : {
		catname : {
			type : "string",
			maxLength : 45,
			minLength : 1
		},
		description : {
			type : "string",
			maxLength : 512,
			minLength : 1
		}
	}
};
app.post("/category/", validate({body : categorySchema }) , (req, res) => {
	categories.createCategory(req.body, (err) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({ 
					"Result": "Unprocessable Entity", 
					"Message": "The category name provided already exists" 
				});
				return;
			}
			res.status(500).send(err);
			return;
		}
		res.status(204).send();
	});
});
app.put("/category/:cat_id", validate({body : categorySchema }) ,(req, res) => {
	const cat_id = parseInt(req.params.cat_id);
	if (isNaN(cat_id)) {
		res.status(400).send({ 
			"Result": "Bad Request",
			"Message": "Category id is not an Integer."
		});
		return;
	}

	categories.updateCategory(cat_id, req.body, (err) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({ 
					"Result": "Unprocessable Entity", 
					"Message": "The category name provided already exists." 
				});
				return;
			}
			if (err.errno === 404) {
				res.status(404).send({ 
					"Result": "Not Found", 
					"Message": "Category id does not exists." 
				});
				return;
			}
			res.status(500).send();
			return;
		}
		res.status(204).send();
	});
});

app.use(validationErrorMiddleware);
function validationErrorMiddleware(error, req, res, next) {
	if (res.headersSent) {
		return next(error);
	}

	const isValidationError = error instanceof ValidationError;
	if (!isValidationError) {
		return next(error);
	}

	res.status(400).send({
		"Result" : "Bad Request",
		"Message": `${error.validationErrors.body[0].dataPath.slice(1)} ${error.validationErrors.body[0].message}`
	});

	next();
}

module.exports = app;