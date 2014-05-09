var express = require("express");
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/chat/:var', function(req, res){
	res.sendfile(__dirname + '/chat.html');
});

var chat = io.of('/chat').on('connection', function(socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('nick', function(name){
		socket.set('nick', name, function(){
			socket.emit('ready');
		});
	});

	socket.on('sub', function(data){
		socket.join(data.room);
		socket.get('nick', function (err, name) {
			socket.broadcast.to(data.room).emit('sys', {'msg':'user '+ name +' joined'});
		});
	});
	
	socket.on('users', function(data){
		var user = io.of('/chat').clients(data.room);
		var users = [];
		for (var i = 0; i < user.length; i++) {
			users.push(user[i].store.data);
		}
		socket.emit('sys', {'users':users})
	});

	socket.on('message', function(data){
		socket.broadcast.to(data.room).emit('message', data);
	});

	socket.on('disconnect', function(){
		socket.get('nick', function(err, name){
			room = io.sockets.manager.roomClients[socket.id];
			console.log(room);
			for (var room in room) {
				room = room.substr(1);
				socket.broadcast.to(room).emit('sys', {'msg': 'user '+ name +' left'});
			}
		});
	})
});

io.sockets.on('connection', function(socket) {
	socket.on('create', function(data){
		var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (Date.now() + Math.random()*16)%16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
		//after we create an id, we should store it and the title/pass. then when someone connects to /chat/:id we fetch the id and data associated with it which will allow us to validate the pass, and set a nice title
		//data.title
		//data.pass
		socket.emit('created', {"id":id});
  });
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
  console.log("Listening on " + port);
});