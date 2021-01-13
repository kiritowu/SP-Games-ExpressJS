//Error Handling
//JSON validation Error Handling Middleware
const { ValidationError } = require("express-json-validator-middleware"); //AJV Error Handling
const multer = require('multer'); //Multer for Image Uploading

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

module.exports=[validationErrorMiddleware, imageUploadingErrorMiddleware, unknownErrorHandling];