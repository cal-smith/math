//globals
function start(){
	elem('login').addEventListener("submit", function(event){
		event.stopPropagation();
		event.preventDefault();
		var pass = elem("pass").value;
		var room = window.location.pathname.slice(6);
		ajax.postJSON(window.location.origin + "/chat/" + room).vars({"pass":pass}).send(function(data){
			console.log(data)
			if (data.success) {
				window.location.href = window.location.origin + "/chat/" + data.success;
			}
			if (data.error) {
				elem('error').classList.remove("hide");
				elem('error').textContent = data.error;
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