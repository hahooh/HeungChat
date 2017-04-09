// load config file
const fs = require('fs');

module.exports.db = function() {

	// load config data
	let dbconfig = fs.readFileSync(__dirname+'/../config/dbconfig.json', 'utf8');	
	
	const mysql = require('mysql');
	const conn = mysql.createConnection(JSON.parse(dbconfig));
	conn.connect();
	
	console.log('db connection compeleted');
	
	return conn;
}

module.exports.dbsession = function() {
		
	// load & set session
	const session = require('express-session');

	// load mysql mysqlstore
	const mysqlstore = require('express-mysql-session')(session);
	
	
	// load config data
	let session_config = JSON.parse(fs.readFileSync(__dirname+'/../config/mysql-session.json', 'utf8'));
	let dbconfig = JSON.parse(fs.readFileSync(__dirname+'/../config/dbconfig.json', 'utf8'));
	
	let sessionStore = new mysqlstore(dbconfig);
	
	session_config.store = sessionStore;
	
	// config session
	return session(session_config);
}