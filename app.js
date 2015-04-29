var express = require('express');
var app = express();
var session = require('express-session');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redis = require('redis');
var async = require('async');

var redishost = process.env.OPENSHIFT_REDIS_HOST || '127.0.0.1';
var redisport = process.env.OPENSHIFT_REDIS_PORT || 6379;
var client = redis.createClient(redisport, redishost);
if (process.env.REDIS_PASSWORD) {
	client.auth(process.env.REDIS_PASSWORD, function() {
		console.log('redis connected');
	});
}
app.use(session({resave: true, saveUninitialized: true, secret: 'math!'}));

//wipe the _users and _rooms tmp keys
client.keys("*_users", function (err, obj) {
	client.del(obj, function(err, del){
		console.info("deleted %d room user records", del);
	});
});

client.keys("*_rooms", function (err, obj) {
	client.del(obj, function(err, del){
		console.info("deleted %d user room records", del);
	});
});

app.use(express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat/:room', function (req, res) {
	client.hgetall(req.params.room, function(err, obj){
		if (obj.pass && req.session[req.params.room] !== true) {
			res.redirect('/chat/'+ req.params.room +'/login');
		} else {
			res.sendFile(__dirname + '/chat.html');
		}
	});
});

app.get('/chat/:room/login', function (req, res) {
	res.sendFile(__dirname + '/login.html');
});

app.post('/chat/:room/login', function (req, res) {
	client.hgetall(req.params.room, function(err, obj){
		//bcrypt this shit
		if (obj == null) {
			res.json({'error':'bad room'});
		} else {
			if (obj.pass === req.query.pass) {
				req.session[req.params.room] = true;
				res.json({'success':req.params.room});
			} else {
				res.json({'error':'wrong password'});
			}
		}
	});
});

var chat = io.of('/chat').on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('nick', function(name){
		client.hmset(socket.id, {"nick":name}, function () {
			socket.emit('ready');
		});
	});

	socket.on('sub', function (data) {
		socket.join(data.room);
		client.sadd(data.room+"_users", socket.id);
		client.sadd(socket.id+"_rooms", data.room);
		client.hgetall(socket.id, function (err, obj) {
			if (obj == null) {
				console.log("no nick@", socket.id);
				socket.emit('error', "no nick set");
			} else {
				client.hgetall(data.room, function (err, room) {
					if (room == null) {
						client.hmset(data.room, {"title":'Math!'});
						socket.broadcast.to(data.room).emit('sys', {'msg':'user '+ obj.nick +' joined'});
						socket.emit('sys', {'title':'Math!'});
					} else {
						socket.broadcast.to(data.room).emit('sys', {'msg':'user '+ obj.nick +' joined'});
						socket.emit('sys', {'title':room.title});
					}
				});
			}
		});
	});
	
	//im thinking users and title might want to be namespaced under sys and called as fns...that might make more sense
	socket.on('users', function (data) {
		client.smembers(data.room+"_users", function (err, obj) {
			async.map(obj, function(x, c){
				client.hgetall(x, function (err, users) {
					c(null, users.nick);
				});
			}, function(err, result){
				socket.emit('sys', {'users':result});
			});		
		});		
	});

	socket.on('title', function (data) {
		client.hmset(data.room, {"title":data.title});
		socket.broadcast.to(data.room).emit('sys', {'title':data.title});
	});

	socket.on('sys', function (data) {
		//for client sys msgs
	});

	socket.on('message', function (data) {
		socket.broadcast.to(data.room).emit('message', data);
	});

	socket.on('disconnect', function (data) {
		client.hgetall(socket.id, function (err, obj) {
			client.smembers(socket.id+"_rooms", function (err, rooms) {
				async.each(rooms, function(x, c){
					client.srem(x+"_users", socket.id);
					client.srem(socket.id+"_rooms", x);
					socket.broadcast.to(x).emit('sys', {'msg': 'user '+ obj.nick +' left'});
					c();
				}, function(err){
					console.error(err);
				});
			});
		});
	})
});

io.sockets.on('connection', function (socket) {
	socket.on('create', function(data){
		var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (Date.now() + Math.random()*16)%16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
		client.hmset(id, {"title":data.title, 'pass':data.pass});
		//data.pass
		socket.emit('created', {"id":id});
  });
});
var port = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  || 5000;
var ip = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1' || 'localhost';
server.listen(port, ip, function() {
	console.log("Listening on " + port);
});
