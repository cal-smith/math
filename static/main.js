//globals
var socket = io.connect();
function start(){
	elem("chanform").addEventListener("submit", function(event){
		event.stopPropagation();
		event.preventDefault();
		var title = elem("create_title").value;
		var pass = elem("create_pass").value;
		socket.emit("create", {"title":title, "pass":pass});
		socket.on("created", function(data){
			window.location.href = window.location.origin + '/chat/' + data.id;
		});
	});
}
//utility functions. 
function render(elem){
	if (AMnames.length==0) initSymbols();//"symbolizes" math
	var out = document.getElementById(elem);
	AMprocessNode(out);//renders basic math
}

function elem(el){
	return document.getElementById(el);
}
//end utility functions

//kick off the party when the DOM is ready.
document.addEventListener("DOMContentLoaded", function(event) {
	//go go
	start();
});