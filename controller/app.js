//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+


const express = require('express'); //Express router
const cookieParser = require('cookie-parser');
const errorHandler = require("./error_handling");
const axios = require('axios');
const api = require('./api');

//JWT authentication
var tokenAuth = require('../auth/tokenAuth');
var users = require('../model/users_p');
/*
The following notation indicates the Accessibility of each Endpoint

(**) -- Can only be Accessed by Providing Admin JWT
(*)  -- Can only be Accessed by Providing Admin or Customer JWT
()   -- Can be Accessed by Public 
*/
var methodOverride = require('method-override'); // Overriding Methods to aid the lack of PUT and DELET on browser
var app = express();

//Middleware for data parsing and stored into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Middleware for parsing cookies into req.cookies
app.use(cookieParser());
//Middleware for identigying Jwt from cookies, if no cookies are found, type is set to Public
app.use(tokenAuth.verifyToken);
//Override POST method to PUT or DELTE where applicable
app.use(methodOverride('_method'));
//Ejs To Render HTML Pages
app.set('view engine', 'ejs');

//Public Endpoints
app.get('/', (req, res, next) => {
	var games;
	axios.get('http://localhost:8081/api/search',{ 
		withCredentials: true
	}).then((response)=>{
		games = response.data.games;
		data = {
			'title': 'SP Games',
			'path': req.path,
			'type': req.type ? req.type : "Public",
			'games': games,
			'update': req.type == "Admin" ? true : false //Showing Update Game Buttons if Admin
		};
		res.render('pages/index.ejs', data);
	}).catch(next);
	
});
app.get('/login', (req, res) => {
	data = {
		'title': 'SP Games | Login',
		'path': req.path,
		'type': req.type ? req.type : "Public",
		'unauthorized': false
	};
	res.render('pages/login.ejs', data);
});
app.post('/login', (req, res, next) => {
	users.userLogin(req.body, (err, user) => {
		if (err) {
			if (err.errCode == 401) {
				data = {
					'title': 'SP Games | Login',
					'path': req.path,
					'type': req.type ? req.type : "Public",
					'unauthorized': true,
					'message': err.message
				};
				res.render('pages/login.ejs', data);
			}
			return next({
				"status": 500,
				"statusMessage": {
					"Result": "Internal Error",
					"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
				}
			});
		} else {
			return res.status(200)
				.cookie('authcookie', user.token, { maxAge: 1.08e+7, path: '/' })  //Cache the header for 86400s (24 Hour)
				.redirect(`/`);
		}
	});
});
app.get('/logout', (req, res) => {
	if (req.cookies.authcookie) {
		return res.clearCookie("authcookie").redirect('/');
	}
	res.redirect('/');
});
app.get('/search', async (req, res, next) => {
	var games;
	var platforms;
	try {
		response = await axios.get('http://localhost:8081/api/search', {
			params: req.query,
			withCredentials: true,
		});
		games = response.data.games;
		platforms = response.data.platform;
	} catch (err) {
		return next(err);
	}
	data = {
		'title': 'SP Games | Search',
		'path': req.path,
		'type': req.type ? req.type : "Public",
		'games': games,
		'platforms': platforms.map(platform => { return platform.platform; }), //Unique platforms
		'query': req.query,
		'update': req.type == "Admin" ? true : false //Showing Update Game Buttons if Admin
	};
	res.render('pages/search', data);
});
app.get('/game/:gameID', async (req, res, next) => {
	const gameID = parseInt(req.params.gameID);
	if (isNaN(gameID)) {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": "Game id is not an Integer."
			}
		});
	}
	var games = [];
	var reviews = [];
	var user = [];
	
	axios.get(`http://localhost:8081/api/search/?id=${gameID}`, {
		withCredentials: true,
	}).then((response) => {
		games = response.data.games;
		return axios.get(`http://localhost:8081/api/game/${gameID}/review`, {
			withCredentials: true
		});
	}).catch((err) => {
		if (err.response.status !== 404) {
			next(err);
		}
		return axios.get(`http://localhost:8081/api/game/${gameID}/review`, {
			withCredentials: true
		});
	}).then((response) => {
		reviews = response.data;
		if (req.user_id) {
			return axios.get(`http://localhost:8081/api/users/${req.user_id}`, {
				withCredentials: true
			});
		}
		return;
	}).catch((err) => {
		if (err.response.status !== 404) {
			next(err);
		}
		if (req.user_id) {
			return axios.get(`http://localhost:8081/api/users/${req.user_id}`, {
				withCredentials: true
			});
		}
		return;
	}).then((response) => {
		if (response) {
			user = response.data;
		}
		var data = {
			'title': games[0]? `SP Games | ${games[0].title}`:`SP Games | Not Found`,
			'path': req.path,
			'type': req.type ? req.type : "Public",
			'uid': req.user_id ? req.user_id : -1,
			'gid': gameID,
			'game': games[0],
			'user': user[0],
			'reviews': reviews
		};
		res.render('pages/game.ejs', data);
	}).catch(next);
});

//Admin Classified Endpoints
app.get('/admin', (req, res, next) => {
	if (req.type !== 'Admin') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is Admin classified Action. Please Log In with Admin Account!"
			}
		});
	}
	var games = [];
	var user = [];
	axios.get('http://localhost:8081/api/search', {
		withCredentials: true,
	}).then((response) => {
		if (response) {
			games = response.data;
		}
		return axios.get(`http://localhost:8081/api/users/${req.user_id}`, {
			withCredentials: true
		}).then((response) => {
			user = response.data;
			data = {
				'title': 'SP Games | Login',
				'path': req.path,
				'type': req.type ? req.type : "Public",
				'games': games.games,
				'user': user[0] ? user[0] : 'Admin',
			};
			res.render('pages/admin', data);
		}).catch(next);
	});
});
app.get('/admin/game/new', (req, res, next) => {
	if (req.type !== 'Admin') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is Admin classified Action. Please Log In with Admin Account!"
			}
		});
	}
	var categories = [];
	var platforms = [];

	axios.get('http://localhost:8081/api/category', {
		withCredentials: true,
		headers: {
			Cookie: `authcookie= ${req.cookies.authcookie};`
		}
	}).then((response) => {
		categories = response.data;
		return axios.get('http://localhost:8081/api/search', { withCredentials: true });
	}).then(response => {
		platforms = response.data.platform;
		data = {
			'title': 'SP Games | New Game',
			'path': req.path,
			'type': req.type ? req.type : "Public",
			'categories': categories,
			'platforms': platforms,
			'update': false,
			'game': undefined
		};
		res.render('pages/game_form', data);
	}).catch(next);
});
app.get('/admin/game/:gameID/update', (req, res, next) => {
	if (req.type !== 'Admin') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is Admin classified Action. Please Log In with Admin Account!"
			}
		});
	}
	var game = [];
	var categories = [];
	var platforms = [];
	
	const gameID = parseInt(req.params.gameID);
	if (isNaN(gameID)) {
		next({
			"Result": "Bad Request",
			"Message": "Game id is Not an Integer."
		});
		return;
	}
	axios.get(`http://localhost:8081/api/search/?id=${gameID}`, {
		withCredentials: true
	}).then((response) => {
		game = response.data.games;
		platforms = response.data.platform;
		return axios.get('http://localhost:8081/api/category', {
			withCredentials: true,
			headers: {
				Cookie: `authcookie= ${req.cookies.authcookie};`
			}
		});
	}).then(response => {
		categories = response.data;
		data = {
			'title': game[0]?`SP Games | ${game[0].title} Update`:`SP Games | Not Found`,
			'path': req.path,
			'type': req.type ? req.type : "Public",
			'categories': categories,
			'platforms': platforms,
			'update': true,
			'game': game[0]
		};
		res.render('pages/game_form', data);
	}).catch(next);
});
app.get('/admin/category/new', (req, res, next) => {
	if (req.type !== 'Admin') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is Admin classified Action. Please Log In with Admin Account!"
			}
		});
	}
	data = {
		'title': 'SP Games | New Category',
		'path': req.path,
		'type': req.type ? req.type : "Public",
		'category':undefined,
		'update':false,
	};
	res.render('pages/category_form', data);
});
app.get('/admin/category/update', (req, res, next) => {
	var categories = [];
	if (req.type !== 'Admin') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is Admin classified Action. Please Log In with Admin Account!"
			}
		});
	}
	axios.get('http://localhost:8081/api/category')
		.then((response) => {
			categories = response.data;
			data = {
				'title': 'SP Games | Update Category',
				'path': req.path,
				'type': req.type ? req.type : "Public",
				'categories': categories
			};
			res.render('pages/categories', data);
		}).catch(next);
});
app.get('/admin/category/:catID/update', (req, res, next) => {
	var category = [];
	if (req.type !== 'Admin') {
		return next({
			"status": 403,
			"statusMessage": {
				"Result": "Forbidden",
				"Message": "This is Admin classified Action. Please Log In with Admin Account!"
			}
		});
	}
	const catID = parseInt(req.params.catID);
	if (isNaN(catID)) {
		next({
			"Result": "Bad Request",
			"Message": "Cat id is Not an Integer."
		});
		return;
	}
	axios.get('http://localhost:8081/api/category')
		.then((response) => {
			category = response.data.filter(c => c.cat_id == catID)[0];
			data = {
				'title': 'SP Games | Update Category',
				'path': req.path,
				'type': req.type ? req.type : "Public",
				'category': category,
				'update':true
			};
			res.render('pages/category_form', data);
		}).catch(next);
});
//Public Assets (CSS)
app.use(express.static('public'));

//APIs
app.use('/api', api);

//Error Handling
app.use(...errorHandler);

//404 Not Found Page
app.use((req, res) => {
	res.status(404).render('pages/error', {
		'title': 'SP Games | Login',
		'path': req.path,
		'type': req.type ? req.type : "Public",
		"Result": "Not Found",
		"Message": "You were trying to visit a page that doesn't even exist? How cute.",
		"pic":"/assets/images/how_cute_404.png"
	});
});
module.exports = app;
