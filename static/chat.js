//globals
"use strict";
var nick,
chat_init = false;
var chan = io.connect(window.location.origin+'/chat');
var room = window.location.pathname.slice(6);
function start(){
	elem("nickform").addEventListener("submit", function(event){
		event.stopPropagation();
		event.preventDefault();
		nick = elem("nick").value;
		chan.emit('nick', nick);
		elem("overlay").classList.add("hide");
		chat.start();
	});
}

//this is nasty and seriously insecure. in the future everyone will log in with (fb,g+,reddit,twitter,yourmom) to ensure the person you add is who they say they are. mimmicing irc is nice, but really isnt what this is about.
var chat = {
	start : function(){
		chat_init = true;
		console.log(chat_init)
		if (typeof nick != "undefined" && chat_init === true) {
			chan.emit('sub', {"room":room});
			chan.emit('users', {"room":room});
			chan.on('news', function (data) {
				console.log(data);
			});
			chan.on('sys', function(data){
				if (data.users){
					var message = 'users connected: ';
					for (var i = 0; i < data.users.length; i++) {
						message += data.users[i].nick+', ';
					}
					chat.sysmsg(message);
				} else if(data.msg){
					chat.sysmsg(data.msg);
				}
			});

			chan.on('message', function(data){
				console.log("hmm");
				if (chat_init === true){
					console.log(data);
					var time = new Date();
					time = time.toLocaleTimeString('en-US', {hour:"numeric", minute:"numeric"});
					elem("log").insertAdjacentHTML('beforeend', '<span class="message them"><span class="time">' + time +'</span><span class="nick">'+ data.nick +': </span><span class="message_txt">'+ data.msg + '</span></span>');
					render("log");
					scroll();
				}
			});
		}
	},
	sendmessage : function(msg){
		if (typeof nick != "undefined" && chat_init === true) {
			chan.emit('message', {'msg': msg, 'nick':nick, 'room':room});
			var time = new Date();
			time = time.toLocaleTimeString('en-US', {hour:"numeric", minute:"numeric"});
			elem("log").insertAdjacentHTML('beforeend', '<span class="message you"><span class="time">' + time +'</span><span class="nick">'+ nick +': </span><span class="message_txt">'+ msg + '</span></span>');
			render("log");
			scroll();
		}
	},
	sysmsg : function(msg){
		elem("log").insertAdjacentHTML('beforeend', '<span class="message sys"><span class="nick">sys: </span><span class="message_txt">'+ msg + '</span></span>');
		scroll();
	}
};

//utility functions. 
function math(event){
	if (AMnames.length==0) initSymbols();//"symbolizes" math
	var input = document.getElementById("in").value;
	var out = document.getElementById("out");
	if (event.keyCode === 13 && event.shiftKey === false) {
		input = input.replace(/\n/g, '<br>');
		elem("out").innerHTML = "";
		elem("in").value = "";
		chat.sendmessage(input);
		return false;
	} else{
		input = input.replace(/\n/g, '<br>');
		out.innerHTML = input;
		AMprocessNode(out);
	}
}

function render(elem){
	if (AMnames.length==0) initSymbols();//"symbolizes" math
	var out = document.getElementById(elem);
	AMprocessNode(out);//renders basic math
}

function elem(el){
	return document.getElementById(el);
}
function scroll(){
	var scroll = elem("log").scrollHeight - elem("log").offsetHeight;
	var scrolltop = elem("log").scrollTop;
	if (scrolltop < scroll - 100 && scroll > 100) {
	} else{
		elem("log").scrollTop = scroll;
	}
}
//end utility functions

//kick off the party when the DOM is ready.
document.addEventListener("DOMContentLoaded", function(event) {
	//and now a bunch of render calls so the basic help doesnt look SUPER DUMB
	render("demo_eq");
	render("demo_sy");
	//go go
	start();
});