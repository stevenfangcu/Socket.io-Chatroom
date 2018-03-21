
var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var file = "index.html"
var mime = require('mime-types');
var url = require('url');
var path = require('path');


var clients = []; // array of users

http.listen(3000);
const ROOT = "./public_html";
console.log("Chat server listening on port 3000");

io.on("connection", function(socket){
	console.log("Got a connection");
	var username;
	socket.on("intro",function(data){ // user intro
    if(data != "Default"){
  		socket.username = data; // attaches the username(data) to the socket
          socket.blocked = []; // attaches an array which will consist the amount of blocked users
  		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
  		socket.emit("message","Welcome, "+socket.username+".");// emites the user

          clients.push(socket);//add the socket to the clients array
    }
    var obj = getUsernames(); // names of the users
    console.log(obj + " are in the chat");
    io.emit("userNames" , obj);//emit obj with event "userList"
	});

	socket.on("message", function(data){
		console.log("got message: "+data);
		//socket.broadcast.emit("message",timestamp()+", "+username+": "+data);
        // for loop to emit all the messages
		for(var i = 0; i < clients.length; i++){
            var blocked = false;
            if(clients[i].username != socket.username){
                for(var x = 0; x < clients[i].blocked.length; x++){
                    if(clients[i].blocked[x] == socket.username){
                        blocked = true;
                        break;
                    }
                }
            }
            // if its blocked
            if(blocked == false && clients[i].username != socket.username){
                clients[i].emit("message",timestamp()+", "+socket.username+": "+data);
            }
        }
	});
    // disconnect function where it ends and modifities the chat
	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
        for(var i = 0; i < clients.length; i++){// splicing it from the user list
            if(clients[i].username == socket.username){
               clients.splice(i,1);
            }
        }
        var filler = getUsernames();
        io.emit("userNames", filler);
        console.log(getUsernames());
        var numberUsers = clients.length;
        io.emit("updateIndex", numberUsers);
	   });
    // private messages
	socket.on("privateMessage", function(data){
        for(var i = 0; i < clients.length; i++){
            if(data.username == clients[i].username){
                var sendMesesage = clients[i];
                data.blocked = getBlocked(data.sender);
                console.log("username is : " + sendMesesage.username);
            }
        }
        sendMesesage.emit("privateMessage",data);
    });
    socket.on("blockUser", function(data){ // blocks the user
        var block = false;
        var counter = 0;
            for(var x = 0; x < clients.length; x++){
                if(data.blocker == clients[x].username){
                    for(var y = 0; y < clients[x].blocked.length; y++){
                        //clients[x].blocked.push(data.blocked);
                        if(clients[x].blocked[y] == data.blocked){
                            block = true;
                            counter = y;
                            console.log(block);
                        }
                    }
                    if(block == true){ // already blocked, therefore unblock
                        console.log(data.blocked + " has been unblocked");
                        clients[x].blocked.splice(counter,1);
                        console.log(clients[x].blocked);
                        var xd = {};
                        xd.blocked = getBlocked(clients[x]);
                        xd.usernames = getUsernames();
                        xd.unblocked = data.blocked;
                        xd.choice = 2;
                        clients[x].emit("strike", xd);
                    }
                    if(block == false){
                        console.log(data.blocked + " has been blocked");
                        clients[x].blocked.push(data.blocked);
                        var xd = {};
                        xd.blocked = getBlocked(clients[x]);
                        xd.usernames = getUsernames();
                        xd.block = data.blocked;
                        xd.choice = 1;
                        clients[x].emit("strike", xd);
                    }
                }
            }
    });
});
// function to get the blockedusers
function getBlocked(user){
    var blocked = [];
    var slot = user;
    for(var x = 0; x < clients.length; x++){
        if(clients[x].username == user){
            slot = clients[x];
        }
    }
    for(var i = 0; i < slot.blocked.length; i++){
        blocked.push(slot.blocked[i]);
    }
        return blocked;
}
// functio to get the usernames
function getUsernames(){
    var users = [];
    for(var i=0;i<clients.length;i++){
        users.push(clients[i].username);
    }
    return users;
}

function timestamp(){
	return new Date().toLocaleTimeString();
}


function handler(req,res){
  var urlObj = url.parse(req.url,true);
	var query  = urlObj.query;
	var filename = ROOT+urlObj.pathname;
	   //the callback sequence for static serving...
		fs.stat(filename,function(err, stats){
			if(err){   //try and open the file and handle the error, handle the error
				respondErr(err);
			}else{
				if(stats.isDirectory())	filename+="/index.html";
				fs.readFile(filename,"utf8",function(err, data){
					if(err)respondErr(err);
					else respond(200,data);
				});
			}
		});
	//locally defined helper function
	//serves 404 files
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
			if(err)respond(500,err.message);
			else respond(404,data);
		});
	}

	//locally defined helper function
	//responds in error, and outputs to the console
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}
	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}
};
