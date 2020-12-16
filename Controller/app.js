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

const express = require('express'); //Express router
const { Validator, ValidationError } = require("express-json-validator-middleware"); //AJV Validation Library
const fs = require('fs'); //Filestream 
const multer = require('multer'); //Multer for Image Uploading
var storage = multer.diskStorage({ //Image path config
	destination: function (req, file, callback) {
		callback(null, `${__dirname}/../tmp/images/`);
	},
	filename: function (req, file, callback) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + ".jpg";
		callback(null, file.fieldname + '-' + uniqueSuffix);
	}
});
var upload = multer({
	storage: storage, //Image File config
	fileFilter: (req, file, callback) => {
		if (file.mimetype !== 'image/jpeg') { //Only allow jpg files to be uplaoded
			return callback(new Error('File uploaded is not .jpg image file'), false);
		}
		callback(null, true);
	},
	limits: {
		fileSize: 1000000, //Maximum 1MB(1000000 Byte) files to be uploaded
		files: 1 //Maximum one files to be uploaded
	}
});

//Models
var users = require('../model/users_p');
var categories = require('../model/categories_p');
var games = require('../model/game_p');
var reviews = require('../model/reviews_p');

//JWT authentication
var tokenAuth = require('../auth/tokenAuth');

var app = express();
const { validate } = new Validator();

// const bodyParser = require('body-parser');
// const urlencodedParser = bodyParser.urlencoded({extended:false});
// app.use(urlencodedParser); //attach body-parser middelware to decode x-www-form-urlencoded to req.body 
// app.use(express.json()); //parse req.body to json data

//Middleware for data parsing and stored into req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//admin
// Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Niwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjA4MTMxNDY4LCJleHAiOjE2MDgyMTc4Njh9.6Xh4jyPSK0jFX6vvEk-IPkSWVNNdGBXaLARPPKxrTiQ

//Users Table
//question 1: get all user
app.get("/users/", tokenAuth.verifyToken, (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
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

//question 2: insert new user
var userSchema = {
	type: "object",
	required: ["username", "email", "type", "password","profile_pic_url"],
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
		type: {
			type: "string",
			maxLength: 8,
			minLength: 5
		},
		profile_pic_url: {
			type: "string",
			maxLength: 45
		}
	},
};
app.post("/users/", tokenAuth.verifyToken, validate({ body: userSchema }), (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	users.createUser(req.body, (err, insertId) => {
		if (err) {
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
			});
			return;
		}
		res.status(201).send({ "User_id": insertId });
	});
});

//question 3: get user with specific id
app.get("/users/:id", tokenAuth.verifyToken, (req, res) => {
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
			res.status(404).send({
				"Result": "Not Found",
				"Message": "user does not exists. Please try other user."
			});
			return;
		}
		res.status(200).send(user);
	});
});

//Advance Feature 3: User login
var userLoginSchema = {
	type: "object",
	required: ["email", "password"],
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
app.post("/users/login", validate({ body: userLoginSchema }), (req, res) => {
	users.userLogin(req.body, (err, user) => {
		if (err) {
			if (err.errCode == 401) {
				return res.status(401).send({
					"Result": "Unauthorized",
					"Message": err.message
				});

			}
			return res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
		} else {
			return res.status(200)
				.header({
					Authorization: `Bearer ${user.token}`
				}).send(`Welcome ${user.username}!`);
		}
	});
});

//Category Table
//question 4: insert new category
var categorySchema = {
	type: "object",
	required: ["catname", "description"],
	properties: {
		catname: {
			type: "string",
			maxLength: 45,
			minLength: 1
		},
		description: {
			type: "string",
			maxLength: 512,
			minLength: 1
		}
	}
};
app.post("/category/", tokenAuth.verifyToken, validate({ body: categorySchema }), (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	categories.createCategory(req.body, (err) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The category name provided already exists"
				});
				return;
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		res.status(204).send();
	});
});

//question 5: update category
app.put("/category/:cat_id", tokenAuth.verifyToken, validate({ body: categorySchema }), (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
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
					"Message": "The category name provided already exists. Please try other category name"
				});
				return;
			}
			if (err.errno === 404) {
				res.status(404).send({
					"Result": "Not Found",
					"Message": "Category id does not exists. Please try other category"
				});
				return;
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		res.status(204).send();
	});
});

//Game Table
//question 6: Used to add a new game to the database.
var gameSchema = {
	type: "object",
	required: ["title", "description", "price", "platform", "year", "categories"],
	properties: {
		title: {
			type: "string",
			maxLength: 45,
			minLength: 1
		},
		description: {
			type: "string",
			maxLength: 512,
			minLength: 1
		},
		price: {
			type: "number",
		},
		platform: {
			type: "string",
			maxLength: 45,
			minLength: 1
		},
		year: {
			type: "number"
		},
		categories: {
			type: "array",
			items: { type: "number" },
			minItems: 1,
			additionalItems: true
		}
	}
};
app.post("/game/", tokenAuth.verifyToken, validate({ body: gameSchema }), (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	games.createGame(req.body, (err, gameid) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The game name provided already exists"
				});
				return;
			}
			if (err.errno === 1452) {
				return res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The categories does not exist"
				});
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		return res.status(201).send({
			"gameid": gameid
		});
	});
});

//question 7: get games based on platform
app.get("/games/:platform", (req, res) => {
	var platform = req.params.platform;
	games.readGamesByPlatform(platform, (err, games) => {
		if (err) {
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		if (games.length === 0) {
			res.status(404).send({
				"Result": "Not Found",
				"Message": "Game Platform is not found. Please try other platform."
			});
			return;
		}
		res.status(200).send(games);
	});
});

// question 8 delete game based on game id
app.delete("/game/:id", tokenAuth.verifyToken, (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	var gameId = parseInt(req.params.id);
	if (isNaN(gameId)) {
		res.status(400).send({
			"Result": "Bad Request",
			"Message": "Category id is not an Integer."
		});
		return;
	}

	games.deleteGame(gameId, (err, affectedRows) => {
		if (err) {
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		if (affectedRows === 0) {
			res.status(404).send({
				"Result": "Not Found",
				"Message": "GameID is not found. Please try other ID."
			});
			return;
		}
		res.status(204).send();
	});
});

//question 9: update game
app.put("/game/:id", tokenAuth.verifyToken, validate({ body: gameSchema }), (req, res) => {
	if(req.role !== "Admin"){ //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result":"Unauthorized",
			"Message":"This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	const gameId = parseInt(req.params.id);
	if (isNaN(gameId)) {
		res.status(400).send();
		return;
	}

	games.updateGames(gameId, req.body, (err) => {
		if (err) {
			if (err.errno === 1452) {
				return res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The categories does not exist"
				});
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		res.status(204).send();
	});
});

//Review Table
//question 10 add a new review to the database for given user and game
var reviewSchema = {
	type: "object",
	required: ["content", "rating"],
	properties: {
		content: {
			type: "string",
			minLength: 1,
			maxLength: 512
		},
		rating: {
			type: "number",
			minimum: 0,
			maximum: 5
		}
	}
};
app.post("/user/:uid/game/:gid/review/", tokenAuth.verifyToken, validate({ body: reviewSchema }), (req, res) => {
	var content = req.body.content;
	const userId = parseInt(req.params.uid);
	if (isNaN(userId)) {
		res.status(400).send({
			"Result": "Bad Request",
			"Message": "user id is not an Integer."
		});
		return;
	}
	const gameId = parseInt(req.params.gid);
	if (isNaN(gameId)) {
		res.status(400).send({
			"Result": "Bad Request",
			"Message": "game id is not an Integer."
		});
		return;
	}
	reviews.createReview(gameId, userId, review, (err, data) => {
		if (err) {
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		res.status(200).send(data);
	});
});

//question 11 get review based on game id
app.get("/game/:id/review", (req, res) => {
	var gameId = req.params.id;
	if (isNaN(gameId)) {
		res.status(400).send({
			"Result": "Bad Request",
			"Message": "game id is not an Integer."
		});
		return;
	}
	reviews.readReviews(gameId, (err, data) => {
		if (err) {
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		if (data.length === 0) {
			res.status(404).send({
				"Result": "Not Found",
				"Message": "Reviews for this game does not exists."
			});
			return;
		}
		res.status(200).send(data);
	});
});


//Advance Feature 1: Upload & Retrival of Images
app.post("/upload", upload.single('pic'), (req, res) => {
	res.send();
});
app.get("/pic", (req, res) => {
	var filename = req.body.name;
	var path = `${__dirname}/../tmp/images/` + filename;
	fs.readFile(path, (err, data) => {
		if (err) {
			console.error(err);
			if (err.errno === -4058) {
				return res.status(404).send({
					"Result": "Not Found",
					"Message": "The image or path cannot be found. Please try other Image."
				});
			}
			return res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
		}
		res.contentType('image/jpeg').send(data);
	});
});


//Error Handling
//JSON validation Error Handling Middleware
app.use(validationErrorMiddleware);
function validationErrorMiddleware(err, req, res, next) {
	if (res.headersSent) {
		return next(err);
	}

	const isValidationError = err instanceof ValidationError;
	if (!isValidationError) {
		return next(err);
	}

	res.status(400).send({
		"Result": "Bad Request",
		"Message": `${err.validationErrors.body[0].dataPath.slice(1)} ${err.validationErrors.body[0].message}`
	});

	next();
}
app.use(imageUploadingErrorMiddleware);
function imageUploadingErrorMiddleware(err, req, res, next) {
	if (res.headersSent) {
		return next(err);
	}
	const isMulterError = err instanceof multer.MulterError;
	if (!isMulterError) {
		return next(err);
	}

	res.status(400).send({
		"Result": "Bad Request",
		"Message": err.message
	});

	next();
}
app.use(unknownErrorHandling);
function unknownErrorHandling(err, req, res, next) {
	console.error(err);
	if (res.headersSent) {
		return next(err);
	}
	if (err.message) {
		return res.status(500).send({
			"Result": "Internal Error",
			"Message": err.message
		});
	}
	res.status(500).send({
		"Result": "Internal Error",
		"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
	});
}

module.exports = app;
