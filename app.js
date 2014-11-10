var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var redis = require('redis');
client = redis.createClient();
var async = require('async');
/*
tmp deploy notes
merge branch to master (openshift->master || heroku -> master)
depoly as git push heroku || openshift (master)
what a mess
*/

client.keys("*_users", function(err, obj){
	client.del(obj, function(err, del){
		console.info("deleted %d room user records", del);
	});
});

client.keys("*_rooms", function(err, obj){
	client.del(obj, function(err, del){
		console.info("deleted %d user room records", del);
	});
});

app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat/:var', function(req, res){
	res.sendFile(__dirname + '/chat.html');
});

var chat = io.of('/chat').on('connection', function(socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('nick', function(name){
		client.hmset(socket.id, {"nick":name}, function(){
			socket.emit('ready');
		});
	});

	socket.on('sub', function(data){
		socket.join(data.room);
		client.sadd(data.room+"_users", socket.id);
		client.sadd(socket.id+"_rooms", data.room);
		client.hgetall(socket.id, function(err, obj){
			client.hgetall(data.room, function(err, room){
				socket.broadcast.to(data.room).emit('sys', {'msg':'user '+ obj.nick +' joined', 'title':room.title});
				socket.emit('sys', {'title':room.title});
			});
		});
	});
	
	//im thinking users and title might want to be namespaced under sys and called as fns...that might make more sense
	socket.on('users', function(data){
		client.smembers(data.room+"_users", function(err, obj){
			async.map(obj, function(x, c){
				client.hgetall(x, function(err, users){
					c(null, users.nick);
				});
			}, function(err, result){
				socket.emit('sys', {'users':result});
			});		
		});		
	});

	socket.on('title', function(data){
		client.hmset(data.room, {"title":data.title});
		socket.broadcast.to(data.room).emit('sys', {'title':data.title});
	});

	socket.on('sys', function(data){
		//for client sys msgs
	});

	socket.on('message', function(data){
		socket.broadcast.to(data.room).emit('message', data);
	});

	socket.on('disconnect', function(data){
		console.log(data);
		client.hgetall(socket.id, function(err, obj){
			client.smembers(socket.id+"_rooms", function(err, rooms){
				async.each(rooms, function(x, c){
					client.srem(x+"_users", socket.id);
					client.srem(socket.id+"_rooms", x);
					socket.broadcast.to(x).emit('sys', {'msg': 'user '+ obj.nick +' left'});
					c();
				}, function(err){
					//the only issue is if the node process goes down, the rooms arent wiped
				});
			});
		});
	})
});

io.sockets.on('connection', function(socket) {
	socket.on('create', function(data){
		var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (Date.now() + Math.random()*16)%16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
		client.hmset(id, {"title":data.title});
		//client.sadd(id+"_users")
		//after we create an id, we should store it and the title/pass. then when someone connects to /chat/:id we fetch the id and data associated with it which will allow us to validate the pass, and set a nice title
		//data.title
		//data.pass
		socket.emit('created', {"id":id});
  });
});
//process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  ||
//var ip = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1' || 'localhost';
//server.listen(port, ip, function() {
var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
	console.log("Listening on " + port);
});
