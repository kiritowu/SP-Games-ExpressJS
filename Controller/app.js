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
var users = require('../model/users');
var categories = require('../model/categories');

var app = express();
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
app.post("/users/", (req, res) => {
	///VALIDATE USER INPUT???////
	users.createUser(req.body, (err, insertId) => {
		if (err) {
			res.status(500).send({ 
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
			});
			return;
		}
		res.status(201).send(insertId);
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
//Category Table
app.post("/category/", (req, res) => {
	///VALIDATE USER INPUT???////
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
app.put("/category/:cat_id", (req, res) => {
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

module.exports = app;