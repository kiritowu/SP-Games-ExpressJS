//Error Handling
//JSON validation Error Handling Middleware
const { ValidationError } = require("express-json-validator-middleware"); //AJV Error Handling
const { MulterError } = require('multer'); //Multer for Image Uploading

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

function imageUploadingErrorMiddleware(err, req, res, next) {
	if (res.headersSent) {
		return next(err);
	}
	if (err.message == 'File uploaded is not .jpg image file') {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": err.message
			}
		});
	}
	const isMulterError = err instanceof MulterError;
	if (!isMulterError) {
		return next(err);
	}
	else {
		return next({
			"status": 400,
			"statusMessage": {
				"Result": "Bad Request",
				"Message": err.message
			}
		});
	}
}

function unknownErrorHandling(err, req, res, next) {
	console.error(err);
	if (res.headersSent) {
		return next(err);
	}
	if (err.response) {
		try {
			err = err.response.data;
		} catch {
		}
	}
	var status = err.status ? err.status : 500;
	if (err.statusMessage) {
		return res.status(status).render('pages/error', {
			'title': 'SP Games | Login',
			'path': req.path,
			'type': req.type ? req.type : "Public",
			"Result": err.statusMessage.Result,
			"Message": err.statusMessage.Message,
			"pic":undefined
		});
	}
	res.status(status).render('pages/error', {
		'title': 'SP Games | Login',
		'path': req.path,
		'type': req.type ? req.type : "Public",
		"Result": "Internal Error",
		"Message": "An Unknown Error have occured. Please contact our Admin for further assistance."
	});
}

module.exports = [validationErrorMiddleware, imageUploadingErrorMiddleware, unknownErrorHandling];