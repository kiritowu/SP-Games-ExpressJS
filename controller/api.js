//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

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
		callback(null, `${__dirname}/../tmp/images/${file.fieldname}/`);
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
			return callback(new Error('File uploaded is not .jpg image file'));
		}
		callback(null, true);
	},
	limits: {
		fileSize: 1000000, //Maximum 1MB(1000000 Byte) files to be uploaded
		files: 1 //Maximum one files to be uploaded
	}
});

//Backend Models
var users = require('../model/users_p');
var categories = require('../model/categories_p');
var games = require('../model/game_p');
var reviews = require('../model/reviews_p');
const tokenAuth = require('../auth/tokenAuth');

/*
The following notation indicates the Accessibility of each Endpoint

(**) -- Can only be Accessed by Providing Admin JWT
(*)  -- Can only be Accessed by Providing Admin or Customer JWT
()   -- Can be Accessed by Public 
*/

var router = express.Router();
//(**) Question 1: Read all Users
router.get("/users/", (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	users.getAllUsers((err, users) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				}
			});

		}
		res.status(200).send(users); //Cache the header for 86400s (24 Hour).send(users);

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
router.post("/users/", upload.fields(userField), validate({ body: userSchema }), (req, res, next) => {
	if (req.fileName) {
		req.body.profile_pic_url = `/users/pic/${req.fileName}`;
	} else {
		req.body.profile_pic_url = `/users/pic/default.jpg`;
	}
	users.createUser(req.body, (err, user) => {
		if (err) {
			if (err.errno === 1062) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The username or email provided already exists. Please try other username or email."
					}
				});
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				}
			});
		}
		res.status(201).send({ "User_id": user.insertId });
	});
});

//(*) Question 3: Get user with specific id
router.get("/users/:id", (req, res, next) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "User id is not an Integer."
			}
		});
	}

	users.getUserWithID(id, (err, user) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				}
			});
		}
		if (user.length === 0) {
			res.status(404).send({
				"Result": "Not Found",
				"Message": "User Does Not Exists. Please Try other User."
			});
			return;
		}
		res.status(200).send(user);
	});
});

//() Advance Feature 1.2: Retrieval of User's Profile Picture based on FileName
router.get("/users/pic/:picName", (req, res, next) => {
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
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
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
router.post("/users/login", validate({ body: userLoginSchema }), (req, res, next) => {
	users.userLogin(req.body, (err, user) => {
		if (err) {
			if (err.errCode == 401) {
				return next({
					"status": 401,
					"statusMessage": {
						"Result": "Unauthorized",
						"Message": err.message
					}
				});

			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		} else {
			return res.status(200)
				.cookie('authcookie', user.token, { maxAge: 1.08e+7, path: '/' })  //Cache the header for 1.08e+7ms (3 Hour)
				.redirect(`/`);
		}
	});
});

//Category Table
//() Get Unique Category
router.get('/category', (req, res, next) => {
	categories.getUniqueCategory((err, categories) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.status(200).send(categories);
	});
});

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
router.post("/category/", validate({ body: categorySchema }), (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	categories.createCategory(req.body, (err) => {
		if (err) {
			if (err.errno === 1062) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The Category Name Provided already Exists. Please try other Category Name."
					}
				});
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.redirect('/admin/category/update');
	});
});

//(**) Question 5: Update category
router.put("/category/:cat_id", validate({ body: categorySchema }), (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	const cat_id = parseInt(req.params.cat_id);
	if (isNaN(cat_id)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Category id is not an Integer."
			}
		});
	}

	categories.updateCategory(cat_id, req.body, (err) => {
		if (err) {
			if (err.errno === 1062) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The category name provided already exists. Please try other category name"
					}
				});
			}
			if (err.errno === 404) {
				res.status(404).send({
					"Result": "Not Found",
					"Message": "Category id does not exists. Please try other category"
				});
				return;
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.redirect('/admin/category/update');

	});
});

//(**) Question 5: Update category
router.delete("/category/:cat_id", (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	const cat_id = parseInt(req.params.cat_id);
	if (isNaN(cat_id)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Category id is not an Integer."
			}
		});
	}

	categories.deleteCategory(cat_id, (err, affectedRows) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		if (affectedRows === 0) {
			return next({
				"status": 404,
				"statusMessage": {
					"Result": "Not Found",
					"Message": "Category is not found. Please try other ID."
				}
			});
		}
		return res.redirect('/admin/category/update');
	});
});

//Game Table
//(**) Question 6: Used to add a new game to the database.
// Advance Feature 1.1: Upload of Game pic
var gameField = [
	{ name: "title", maxCount: 1 },
	{ name: "description", maxCount: 1 },
	{ name: "price", maxCount: 1 },
	{ name: "platform", maxCount: 1 },
	{ name: "year", maxCount: 1 },
	{ name: "categories", maxCount: 1 },
	{ name: "game-pic", maxCount: 1 }
]; //For uplaod multipart/form data
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
			type: "string",
		},
		platform: {
			type: "string",
			maxLength: 45,
			minLength: 1
		},
		year: {
			type: "string"
		},
		categories: {
			type: "array",
			items: { type: "string" },
			minItems: 1,
			additionalItems: true
		}
	}
};
router.post("/game/", upload.fields(gameField), validate({ body: gameSchema }), (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	if (req.body.categories.slice(-1)[0] == '_hidden') {
		req.body.categories.pop();
	}
	if (req.fileName) {
		req.body.game_pic_url = `/game/pic/${req.fileName}`;
	} else {
		req.body.game_pic_url = `/game/pic/default.jpg`;
	}
	games.createGame(req.body, (err, gameid) => {
		if (err) {
			if (err.errno === 1062) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The game name provided already exists"
					}
				});
			}
			if (err.errno === 1452) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The categories does not exist.",
						"Inserted_game_id": err.Inserted_game_id
					}
				});
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.redirect('/search');
	});
});

// Advance Feature 1.1: Retrieval of Game pic
router.get('/game/pic/:filename', (req, res, next) => {
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
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.contentType('image/jpeg').send(data);
	});
});

//() Question 7: get games based on platform
router.get("/games/:platform", (req, res, next) => {
	var platform = req.params.platform;
	games.readGamesByPlatform(platform, (err, games) => {
		if (err) {
			return next({
				"status": 403,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
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
router.delete("/game/:id", (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	var gameId = parseInt(req.params.id);
	if (isNaN(gameId)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Category id is not an Integer."
			}
		});
	}

	games.deleteGame(gameId, (err, affectedRows) => {
		if (err) {
			if (err.errno === -4058) {
				return next({
					"status": 404,
					"statusMessage": {
						"Result": "Not Found",
						"Message": "Game Picture is not available in the database. Please Contact our Admin for further assistance."
					}
				});
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		if (affectedRows === 0) {
			return next({
				"status": 404,
				"statusMessage": {
					"Result": "Not Found",
					"Message": "GameID is not found. Please try other ID."
				}
			});
		}
		res.redirect('/search'); //Cache the header for 86400s (24 Hour).send(users);
	});
});

//(**) Question 9: update game
router.put("/game/:id", upload.fields(gameField), validate({ body: gameSchema }), (req, res, next) => {
	if (req.type !== "Admin") { //Only Admin can access the content or perform the query
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	const gameId = parseInt(req.params.id);
	if (isNaN(gameId)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Game id is not an Integer."
			}
		});
	}
	if (req.body.categories.slice(-1)[0] == '_hidden') {
		req.body.categories.pop();
	}
	if (req.fileName) {
		req.body.game_pic_url = `/game/pic/${req.fileName}`;
	} else {
		req.body.game_pic_url = `/game/pic/default.jpg`;
	}
	games.updateGames(gameId, req.body, (err, affectedRows) => {
		if (err) {
			if (err.errno === 1062) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The game name provided already exists"
					}
				});
			}
			if (err.errno === 1452) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The Game does not exist."
					}
				});
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.redirect(`/game/${gameId}`);
	});
});

// Search Games
router.get('/search', (req, res, next) => {
	games.searchGames(req.query, (err, game) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		games.uniquePlatform((err, platforms) => {
			if (err) {
				return next({
					"status": 500,
					"statusMessage": {
						"Result": "Internal Error",
						"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
					}
				});
			}
			res.status(200).send({
				games: game,
				platform: platforms
			});
		});
	});
});
router.get('/game/:gameID', (req, res, next) => {
	var gameId = parseInt(req.params.gameID);
	if (isNaN(gameId)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Game id is not an Integer."
			}
		});
	}
	games.getGameByID(gameId, (err, game) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		if (game.length === 0) {
			return next({
				"status": 404,
				"statusMessage": {
					"Result": "Not Found",
					"Message": "Game Does Not Exist. Please Try Other Game ID."
				}
			});
		}
		res.status(200).send(game);
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
		}
	}
};
router.post("/user/:uid/game/:gid/review/", validate({ body: reviewSchema }), (req, res, next) => {
	if (req.type == 'Public') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is an admin classified action. Please login with an Admin account."
			}
		});
	}
	if (isNaN(parseInt(req.body.rating)) || parseInt(req.body.rating) > 5 || parseInt(req.body.rating) < 0) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "rating is not an Integer."
			}
		});
	}
	if (req.body.content.trim() == '') {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Content should not be Empty."
			}
		});
	}
	const userId = parseInt(req.params.uid);
	if (isNaN(userId)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "user id is not an Integer."
			}
		});
	}
	const gameId = parseInt(req.params.gid);
	if (isNaN(gameId)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "game id is not an Integer."
			}
		});
	}
	if(userId !== req.user_id){
		return next({
			"status": 401,
			"statusMessage": {
				"Result": "Unauthorized",
				"Message": "ID Sent in Token Does not Match ID Sent in Review. Please Re-Login to solve this problem."
			}
		});
	}
	reviews.createReview(gameId, userId, req.body, (err, reviewID) => {
		if (err) {
			if (err.errno == 1452) {
				return next({
					"status": 422,
					"statusMessage": {
						"Result": "Unprocessable Entity",
						"Message": "The Game or User does not exist."
					}
				});
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
		}
		res.status(201).redirect(`/game/${gameId}`);
	});
});

//() Question 11 get review based on game id
router.get("/game/:id/review", (req, res, next) => {
	var gameId = req.params.id;
	if (isNaN(gameId)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "game id is not an Integer."
			}
		});
	}
	reviews.readReviews(gameId, (err, data) => {
		if (err) {
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please Contact our Admin for further assistance."
				}
			});
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
