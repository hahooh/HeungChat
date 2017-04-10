// load module module
const loadmodules = require('./lib/loadmodules.js');

// load express
const app = loadmodules.express();

// load socket io and set socket io
const http = require('http').Server(app);
const io = require('socket.io')(http);

// for route
//const router = express.Router();

// load and set pug
loadmodules.pug(app);

// load & set bodyParser
loadmodules.bodyparser(app);

// load & set cookieParser
loadmodules.cookie(app);

// for db related
const db = require('./lib/db.js');

// load & set mysql connection
const conn = db.db();

// load & set session
const session = db.dbsession();
app.use(session);

// bcrypt for password hashing
const result = loadmodules.bcrypt();
const bcrypt = result.bcrypt;
const salt = result.salt;

function is_online(userId) {
	return users.indexOf(userId) > 0? true : false;
}

// user did not login
function is_login(req) {
	return req.session.login;
}

// login firtst
function login_first(req, res) {
	if(!is_login(req)) {
		res.redirect('/');
	}
	console.log(is_login(req));
}

app.get('/', function(req, res) {
	
	let registered = req.session.registered;
	let loginfail = req.session.loginfail;
	
	if(req.session.registered)
		delete req.session.registered;
	
	if(req.session.loginfail)
		delete req.session.loginfail;
	
	res.render('login', {registered: registered, loginfail: loginfail});
});

app.get('/user', function(req, res) {
	
	// check if login
	login_first(req,res);
	
	let chatcreated = req.session.chatroomcreated;
	if(req.session.chatroomcreated)
		delete req.session.chatroomcreated
	
	let chatroomfailed = req.session.chatroomfailed;
	if(req.session.chatroomfailed)
		delete req.session.chatroomfailed
	
	conn.query('SELECT chatroom FROM users where id='+req.session.userId, function(err, user) {
		let chatrooms = [];
		if(user[0].chatroom) {
			chatrooms = user[0].chatroom.split(',');

			let sql_query = 'SELECT * FROM chatrooms where ';
			for(let index = 0; index < chatrooms.length-1; index++) {
				if(chatrooms[index] != '') {
					sql_query+= ('id='+chatrooms[index]+' or ');
				}
			}

			if(chatrooms[chatrooms.length-1] != '') {
				sql_query+= ('id='+chatrooms[chatrooms.length-1]);
			}

			conn.query(sql_query, function(error, rows) {
				if(error) throw error
				res.render('user', {
					userId: req.session.userId,
					chatcreated: chatcreated,
					chatroomfailed: chatroomfailed,
					chatrooms: rows
				});
			});
		} else {
			res.render('user', {
					userId: req.session.userId,
					chatcreated: chatcreated,
					chatroomfailed: chatroomfailed,
					chatrooms: false
				});
		}
	});
});

app.get('/createchatroom', function(req, res) {
	
	// check if login
	login_first(req,res);
	
	conn.query('SELECT * FROM users where id!='+req.session.userId, function(err, rows) {
		if(err) throw err
		res.render('createchatroom', {users: rows});
	});
});

app.get('/chatroom/:chatroomid', function(req, res) {
	
	// check if login
	login_first(req,res);
	
	// get first 20 msgs from chat
	let sql_query = 'SELECT email, msg, created FROM chat, users WHERE chat.chatroomid='+req.params.chatroomid+" and users.id=chat.userid ORDER BY created DESC LIMIT 10";
	
	conn.query(sql_query, function(error, rows) {
		console.log('row fetched');
		res.render('chatroom', {
			room: req.params.chatroomid,
			userId: req.session.userId,
			msgs: rows,
			email: req.session.userEmail
		});
	});
});

app.post('/createchatroom', function(req, res) {
		
	if(req.body.users && req.body.title) {
				
		let members_array = req.body.users;		
		let members_string = '';
		if(typeof(members_array) == "string") {
			members_string = members_array+','+req.session.userId;
		} else {
			req.body.users.forEach(function(el) {
				members_string += el+",";
			});
		}

		let title = req.body.title;

		conn.query(
			'INSERT INTO chatrooms (users, title) VALUES (?,?)', [members_string, title], 
			function(err, result) {
				if(err) throw err
				
				let update_query = 'UPDATE users SET chatroom=\'';
				
				conn.query('SELECT chatroom FROM users WHERE id='+req.session.userId, function(er, user) {
					
					if(user[0].chatroom) {
						update_query+=(user[0].chatroom+','+result.insertId+"\' where users.id="+req.session.userId);
					} else {
						update_query+=(result.insertId+"\' where users.id="+req.session.userId);
					}

					conn.query(update_query, function(error, result2) {
							if(error) throw error

							req.session.chatroomcreated = true;
							res.redirect('/user');

						});
				});
		});	
	} else {
		
		req.session.chatroomfailed = true;
		res.redirect('/user');
	}
	
});

app.post('/login', function(req, res) {
	const email = req.body.email;
	
	// get user id from db
	conn.query('SELECT * FROM users WHERE email=?', [email], function(err, result) {
		if(err) throw err
		
		if(result.length > 0) {
			// varify password			
			if(bcrypt.compareSync(req.body.password, result[0].password)) {					
				
				console.log(result);
				
				req.session.userId = result[0].id;
				req.session.userEmail = email;
				req.session.login = true;

				res.redirect('/user');
				
			} else {
				// login failed
				req.session.loginfail = true;
				res.redirect('/');
			}
			
		} else {
			// login failed
			
			console.log('chat room did not created');
			
			req.session.loginfail = true;
			res.redirect('/');			
		}
		
	});
	
});

app.post('/register', function(req, res) {
	const email = req.body.email;
	const password = bcrypt.hashSync(req.body.password, salt);
	
	conn.query(
		'INSERT INTO users (email, password, chatroom) VALUES (?,?,?)', [email, password, ''], function(err, result) {
			if(err) throw err
			
			console.log("registered successfully");
			req.session.registered = 'true';

			res.redirect('/');
	});
});

// typing list
let nowType = [];

// users in the chat room
let users = {};

io.on('connection', function(socket) {
	
	socket.on('online', function(userId) {
		console.log(userId+" is online");
		socket.join(userId+"userId");
	});
	
	socket.on('disconnect', function(req) {
		if(users[socket.id]) {
			if(users[socket.id].typing) {
				nowType.splice(nowType.indexOf(users[socket.id].typing), 1);
				io.sockets.to(users[socket.id].chatroomid).emit('who is typing', '');
			}
			socket.leave(users[socket.id].chatroomid);
			console.log(socket.id+'is leaving chatroom '+users[socket.id].chatroomid);
			delete users[socket.id];
		}
	});
	
	socket.on('load more msgs', function(userid, chatroomid, offset) {
		let sql_query = 'SELECT email, msg, created FROM chat, users WHERE chat.chatroomid='+chatroomid+" and users.id=chat.userid ORDER BY created DESC LIMIT "+offset+','+10;
		conn.query(sql_query, function(error, rows) {
			socket.join(userid+"userId").emit('more msgs', rows);
		});
	});
	
	// editting chatroom
	socket.on('editting msg', function(email, room) {
		users[socket.id].typing = email;
		nowType.push(email);
		io.sockets.to(room).emit('who is typing', email+" is typing now");
	});
	
	socket.on('done typing', function(email, room) {
		nowType.splice(nowType.indexOf(email), 1);
		delete users[socket.id].typing;
		if(nowType.length == 0) {
			io.sockets.to(room).emit('who is typing', '');
		} else {
			io.sockets.to(room).emit('who is typing', nowType[0]+" is typing now");
		}
		console.log(nowType);
	});
	
	// create chat room
	socket.on('joinroom', function(chatroomid) {
		users[socket.id] = {};
		users[socket.id].chatroomid = chatroomid;
		
		console.log(users);
		
		socket.join(chatroomid);
				
		conn.query('SELECT * FROM chatrooms WHERE id='+chatroomid, function(err, result) {
			if(err) throw err
			let members = result[0].users.split(',');
			members.forEach(function(el) {
				if(el != '') {
					
					conn.query('SELECT chatroom FROM users WHERE id='+el, function(error, user) {
						if(error) throw error
						
						let sql_query = 'UPDATE users SET chatroom=\'';
						if(user[0].chatroom) {
							if(user[0].chatroom.split(',').indexOf(''+chatroomid) < 0) {
								sql_query += user[0].chatroom+','+chatroomid+"\' WHERE users.id="+el;
						
								conn.query(sql_query, function(er, re) {
									if(er) throw er
									console.log('chatroom is created for '+el);

									socket.broadcast.to(el+'userId').emit('new chatroom', chatroomid, result[0].title);


								});	
							}
						} else {
							sql_query += chatroomid+"\' WHERE users.id="+el;
							
							conn.query(sql_query, function(er, re) {
								if(er) throw er
								console.log('chatroom is created for '+el);

								socket.broadcast.to(el+'userId').emit('new chatroom', chatroomid, result[0].title);

							});	
						}
						
					});
				}
			});
		});
	});
	
	socket.on('chat', function(email, userid, chatroomid, msg) {
		// send msg to everyone in chatroomid includeing the sender
		io.sockets.to(chatroomid).emit('chat', email, msg);
		
		let sql_query = 'INSERT INTO chat (userid, chatroomid, msg, created) VALUE (?,?,?,now())';
		conn.query(sql_query, [userid, chatroomid, msg], function(err, result) {
			if(err) throw err;
			console.log('msg stored');
		});
	});
	
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});