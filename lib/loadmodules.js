// load pug template engine
module.exports.pug = function(app) {
	// load pug
	const pug = require('pug');
	
	// config pug
	app.set('view engine', 'pug');
	app.set('pug', './views');
	
	// make html look pretty
	app.locals.pretty = true;
}

// load cookie parser
module.exports.cookie = function(app) {
	// load & set cookieParser
	const cookieParser = require('cookie-parser');
	app.use(cookieParser('some key'));
}

// load body parser
module.exports.bodyparser = function(app) {
	// load & set bodyParser
	const bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({extended:false}));
}

// load express
module.exports.express = function() {
	const express = require('express');
	return express();
}

// load bcrypt for password hashing
module.exports.bcrypt = function() {
	const bcrypt = require('bcrypt-nodejs');
	const saltRounds = 10;
	const salt = bcrypt.genSaltSync(saltRounds);
	return {bcrypt:bcrypt, salt: salt};
}