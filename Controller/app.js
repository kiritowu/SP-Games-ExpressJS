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

var users = require('../model/users_p');
var categories = require('../model/categories_p');
var games = require('../model/game_p');
var reviews = require('../model/reviews_p');

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

app.post("/users/", validate({ body: userSchema }), (req, res) => {
	///VALIDATE USER INPUT???////
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
			res.status(404).send({
				"Result": "Not Found",
				"Message": "user does not exists. Please try other user."
			});
			return;
		}
		res.status(200).send(user);
	});
});
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
app.post("/category/", validate({ body: categorySchema }), (req, res) => {
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
app.put("/category/:cat_id", validate({ body: categorySchema }), (req, res) => {
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
//question 6 onwards
//question 6: Used to add a new game to the database.
// app.post("/game", (req, res) => {


// 	var title = req.body.title;
// 	var description = req.body.description;
// 	var price = req.body.price;
// 	var platform = req.body.platform;
// 	var year = req.body.year;
// 	var categories = req.body.categories;
// 	var cats = categories.split(",");
// 	console.log(categories);
// 	console.log(typeof (categories));

// 	model.post_game(title, description, price, platform, year, (err, data) => {
// 		if (err) {
// 			res.status(500).send();
// 			return;
// 		}
// 		model.get_id(title, (err, id) => {
// 			if (err) {
// 				res.status(500).send({ "Result": "Internal Error" });
// 				return;
// 			}
// 			var gameId = id[0].game_id;
// 			console.log(gameId);
// 			//update the category of the game in the game_category_map one 
// 			// when do postman request categories is sent as categories : 2,3 
// 			// then slice string to make array 
// 			for (var i = 0; i < cats.length; i++) {
// 				model.post_category(gameId, cats[i], (err, data) => {
// 					if (err) {
// 						res.status(500).send({ "Result": "Internal Error" });
// 						return;
// 					}

// 				});
// 			}
// 			model.get_updatedListing(title, (err, data) => {
// 				if (err) {
// 					res.status(500).send({ "Result": "Internal Error" });
// 					return;
// 				}
// 				res.status(200).send(data);
// 			});


// 		});
// 	});

// });
var gameSchema={
	type: "object",
	required: ["title", "description", "price", "platform", "year", "categories"],
	properties: {
		title:{
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
			items: {type: "number"},
			minItems: 1,
			additionalItems: true
		}
	}
};
app.post("/game/", validate({ body: gameSchema }), (req, res) => {
	games.createGame(req.body, (err, gameid) => {
		if (err) {
			if (err.errno === 1062){
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

//question 7 
//get games based on platform
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
		if(games.length === 0){
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
app.delete("/game/:id", (req, res) => {
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
		if (affectedRows === 0){
			res.status(404).send({
				"Result": "Not Found",
				"Message": "GameID is not found. Please try other ID."
			});
			return;
		}
		res.status(204).send();
	});
});

//question 9 update game
// can update the title description year title n price
// app.put("/game/:id", (req, res) => {
// 	var description = req.body.description;
// 	var price = req.body.price;
// 	var platform = req.body.platform;
// 	var year = req.body.year;
// 	var title = req.body.title;
// 	const gameId = parseInt(req.params.id);
// 	var categories = req.body.categories;
// 	var cats = categories.split(",");
// 	if (isNaN(gameId)) {
// 		res.status(400).send();
// 		return;
// 	}

// 	model.update_game(description, price, platform, year, title, gameId, (err) => {
// 		if (err) {
// 			res.status(500).send({ "Result": "Internal Error" });
// 			return;
// 		}
// 		//run the update cat given the length of the category array
// 		for (var i = 0; i < cats.length; i++) {
// 			model.post_category(gameId, cats[i], (err) => {
// 				if (err) {
// 					res.status(500).send({ "Result": "Internal Error" });
// 					return;
// 				}
// 			});
// 		}
// 		res.status(200).send("succesful update");
// 		//used 200 to see if succesful anot
// 	});
// });
app.put("/game/:id", validate({ body: gameSchema }), (req, res) => {
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
				"Result": "Not Found",
				"Message": "GameID is not found. Please try other ID."
			});
			return;
		}
		res.status(204).send();
	});
});


//question 10 add a new review to the database for given user and game
var reviewSchema = {
	type : "object",
	required: ["content", "rating"],
	properties: {
		content:{
			type : "string",
			minLength: 1,
			maxLength: 512
		},
		rating:{
			type: "number",
			minimum: 0,
			maximum: 5
		}
	}
};
app.post("/user/:uid/game/:gid/review/", validate({ body: reviewSchema }), (req, res) => {
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
				"Result": "Not Found",
				"Message": "GameID is not found. Please try other ID."
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
				"Result": "Not Found",
				"Message": "GameID is not found. Please try other ID."
			});
			return;
		}
		if(data.length === 0){
			res.status(404).send({
				"Result": "Not Found",
				"Message": "Reviews for this game does not exists."
			});
			return;
		}
		res.status(200).send(data);
	});
});

//JSON validation Error Handling Middleware
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
		"Result": "Bad Request",
		"Message": `${error.validationErrors.body[0].dataPath.slice(1)} ${error.validationErrors.body[0].message}`
	});

	next();
}
module.exports = app;
