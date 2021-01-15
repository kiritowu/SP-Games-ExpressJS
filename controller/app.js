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
const cookieParser = require('cookie-parser')
const errorHandler = require("./error_handling");
const api = require('./api');

//JWT authentication
var tokenAuth = require('../auth/tokenAuth');

/*
The following notation indicates the Accessibility of each Endpoint

(**) -- Can only be Accessed by Providing Admin JWT
(*)  -- Can only be Accessed by Providing Admin or Customer JWT
()   -- Can be Accessed by Public 
*/

var app = express();

//Middleware for data parsing and stored into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Middleware for parsing cookies into req.cookies
app.use(cookieParser());

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
	if(req.cookies.authcookie){
		tokenAuth.checkToken(req, res, req.cookies.authcookie);
	} 
	data = {
		'title':'SP Games',
		'path':req.path,
		'type': req.type? req.type: "Public",
	};
	res.render('pages/index.ejs', data);
});
app.get('/login', (req,res) => {
	if(req.cookies.authcookie){
		tokenAuth.checkToken(req, res, req.cookies.authcookie);
	}
	data = {
		'title':'SP Games | Login',
		'path': req.path,
		'type': req.type? req.type: "Public",
	};
	res.render('pages/login.ejs', data);
});
app.get('/logout', (req,res) => {
	if(req.cookies.authcookie){
		return res.clearCookie("authcookie").redirect('/');
	}
	res.redirect('/')
});


//Public Assets (CSS)
app.use(express.static('public'));

//APIs
app.use('/api', api);

//Error Handling
app.use(...errorHandler);

module.exports = app;
