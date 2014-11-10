//globals
function start(){
	elem('login').addEventListener("submit", function(event){
		event.stopPropagation();
		event.preventDefault();
		var pass = elem("pass").value;
		var room = window.location.pathname.slice(6);
		//what i want: ajax.post('/chat/room/login', {'url': 'vars', 'password':pass}, function (data) {stuff})
		//what i have..for now
		ajax.send({verb: 'POST', url:"localhost:5000/chat/"+ room, "url_var":{"pass":pass}, json:true}, function(data){
			window.data = data;
			if (data.success) {
				window.location.href = window.location.origin + "/chat/"+ data.success;
			}
		});
	});
}

function elem(el){
	return document.getElementById(el);
}


//kick off the party when the DOM is ready.
document.addEventListener("DOMContentLoaded", function(event) {
	//go go
	start();
});