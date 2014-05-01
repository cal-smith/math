var express = require("express");
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('nick', function(name){
  	socket.set('nick', name, function(){
  		socket.emit('ready');
  	});
  });
  socket.on('message', function(data){
  	console.log(data.my);
  	//socket.broadcast.emit(data);
  	socket.emit('message', data);
  	/*socket.get('nick', function(err, name){
  		//yes
  	});*/
  });
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
  console.log("Listening on " + port);
});