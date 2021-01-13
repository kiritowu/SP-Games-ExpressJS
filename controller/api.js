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
//Express 
const express = require('express'); 
//AJV Validation Library
const { Validator } = require("express-json-validator-middleware"); 
const { validate } = new Validator();
//Filestream 
const fs = require('fs');
const multer = require('multer'); //Multer for Image Uploading
var storage = multer.diskStorage({ //Image path config
	destination: function (req, file, callback) {
		callback(null, `${__dirname}/../tmp/images/`);
	},
	filename: function (req, file, callback) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + ".jpg";
		const fileName = file.fieldname + '-' + uniqueSuffix;
		req.fileName = fileName;
		callback(null, fileName);
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
//JWT authentication
var tokenAuth = require('../auth/tokenAuth');
//Backend Models
var users = require('../model/users_p');
var categories = require('../model/categories_p');
var games = require('../model/game_p');
var reviews = require('../model/reviews_p');

/*
The following notation indicates the Accessibility of each Endpoint

(**) -- Can only be Accessed by Providing Admin JWT
(*)  -- Can only be Accessed by Providing Admin or Customer JWT
()   -- Can be Accessed by Public 
*/

var router = express.Router();
router.get("/users/", tokenAuth.verifyToken, (req, res) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
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

		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(200).send(users); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//() Question 2: Insert new user + Advance Feature 1.1: Upload of Profile Picture
var userSchema = {
	consumes: ['multipart/form-data'],
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
		type: {
			type: "string",
			maxLength: 8,
			minLength: 5
		}
	},
};
var userField = [
	{ name: "username", maxCount: 1 }, 
	{ name: "email", maxCount: 1 }, 
	{ name: "type", maxCount: 1 }, 
	{ name: "password", maxCount: 1 }, 
	{ name: "profile-pic", maxCount: 1 }
]; //For uplaod multipart/form data
// when do postman request use form data to send all datas including text and file(profile picture)

router.post("/users/", upload.fields(userField), validate({ body: userSchema }), (req, res) => {
	if (req.fileName) {
		req.body.profile_pic_url = `/users/pic/${req.fileName}`;
	} else {
		req.body.profile_pic_url = `/users/pic/default.jpg`;
	}
	users.createUser(req.body, (err, user) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The username or email provided already exists. Please try other username or email."
				});
				return;
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
			});
			return;
		}
		tokenAuth.generateToken(user.insertId, user.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(201).send({ "User_id": user.insertId }); //Cache the header for 86400s (24 Hour).send(users);
			}).catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//(*) Question 3: Get user with specific id
router.get("/users/:id", tokenAuth.verifyToken, (req, res) => {
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
				"Message": "User Does Not Exists. Please Try other User."
			});
			return;
		}
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(200).send(user); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});

	});
});

//() Advance Feature 1.2: Retrieval of User's Profile Picture based on FileName
router.get("/users/pic/:picName", (req, res) => {
	var picName = req.params.picName;
	var path = `${__dirname}/../tmp/images/profile-pic/` + picName;
	fs.readFile(path, (err, data) => {
		if (err) {
			console.error(err);
			if (err.errno === -2) {
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

//() Advance Feature 3: User Login
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
router.post("/users/login", validate({ body: userLoginSchema }), (req, res) => {
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
				}).set('Cache-control', 'private, max-age=86400') //Cache the header for 86400s (24 Hour)
				.send(`Welcome ${user.username}!`);
		}
	});
});


//Category Table
//(**) Question 4: Insert new category
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
router.post("/category/", tokenAuth.verifyToken, validate({ body: categorySchema }), (req, res) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	categories.createCategory(req.body, (err) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The Category Name Provided already Exists. Please try other Category Name."
				});
				return;
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(204).send(); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//(**) Question 5: Update category
router.put("/category/:cat_id", tokenAuth.verifyToken, validate({ body: categorySchema }), (req, res) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
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
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(204).send(); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//Game Table
//(**) Question 6: Used to add a new game to the database.
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

router.post("/game/", tokenAuth.verifyToken, validate({ body: gameSchema }), (req, res) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
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
					"Message": "The categories does not exist.",
					"Inserted_game_id": err.Inserted_game_id
				});
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(201).send({
					"gameid": gameid
				}); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

// Advance Feature 1.1: Upload of Game pic
var gameField = [
	{ name: "title", maxCount: 1 }, 
	{ name: "game-pic", maxCount: 1 }
]; //For uplaod multipart/form data
// when do postman request use form data to send all datas including text and file(profile picture)
router.post('/game/upload', tokenAuth.verifyToken, upload.fields(gameField), (req,res)=>{
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	if (req.fileName) {
		game_pic_url = `/game/pic/${req.fileName}`;
	} else {
		game_pic_url = `/game/pic/default.jpg`;
	}
	games.uploadGamePic(game_pic_url, req.body, (err, affectedRows)=>{
		if(err) {
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		if(affectedRows == 0){
			res.status(404).send({
				"Result": "Not Found",
				"Message": "game title is not found. Please try other game title."
			});
			return;
		}
		return res.status(201).send();
	});
});

// Advance Feature 1.1: Retrieval of Game pic
router.get('/game/pic/:filename', (req,res)=>{
	var filename = req.params.filename;
	var path = `${__dirname}/../tmp/images/game-pic/` + filename;
	fs.readFile(path, (err, data) => {
		if (err) {
			console.error(err);
			if (err.errno === -2) {
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


//() Question 7: get games based on platform
router.get("/games/:platform", (req, res) => {
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

//(**) Question 8 delete game based on game id
router.delete("/game/:id", tokenAuth.verifyToken, (req, res) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
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
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(204).send(); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//(**) Question 9: update game
router.put("/game/:id", tokenAuth.verifyToken, validate({ body: gameSchema }), (req, res) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		res.status(403).send({
			"Result": "Unauthorized",
			"Message": "This is an admin classified action. Please login with an Admin account."
		});
		return;
	}
	const gameId = parseInt(req.params.id);
	if (isNaN(gameId)) {
		res.status(400).send();
		return;
	}

	games.updateGames(gameId, req.body, (err, affectedRows) => {
		if (err) {
			if (err.errno === 1062) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The game name provided already exists"
				});
				return;
			}
			if (err.errno === 1452) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The categories does not exist."
				});
				return;
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(204).send(); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//Review Table
//(*) Question 10: add a new review to the database for given user and game
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
router.post("/user/:uid/game/:gid/review/", tokenAuth.verifyToken, validate({ body: reviewSchema }), (req, res) => {
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
	reviews.createReview(gameId, userId, req.body, (err, reviewID) => {
		if (err) {
			if (err.errno == 1452) {
				res.status(422).send({
					"Result": "Unprocessable Entity",
					"Message": "The Game or User does not exist."
				});
				return;
			}
			res.status(500).send({
				"Result": "Internal Error",
				"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
			});
			return;
		}
		tokenAuth.generateToken(req.user_id, req.type) //Refresh the token for another 24 Hour
			.then(token => {
				res.header({
					Authorization: `Bearer ${token}` //Include Bearer JWT as header
				}).set('Cache-control', 'private, max-age=86400').status(201).send({ "reviewid": reviewID }); //Cache the header for 86400s (24 Hour).send(users);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).send({
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				});
			});
	});
});

//() Question 11 get review based on game id
router.get("/game/:id/review", (req, res) => {
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



module.exports = router;
