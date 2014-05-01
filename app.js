var app = require("express")();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
  console.log("Listening on " + port);
});