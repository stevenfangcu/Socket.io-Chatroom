
$(document).ready(function(){
  document.getElementById("home").onclick = function(){
    $(location).attr('href','index.html');
  };
  document.getElementById("news").onclick = function(){
    alert("No current news now, this is just a practice server");
  };
  document.getElementById("contact").onclick = function(){
    alert("Email me at stevenfang.cu@gmail.com");
  };
  var numUsers = 0;
  var users = [];
  if(window.location.href.indexOf("chatRoom") > -1){
    var userName = prompt("What's your name?")||"User";
  }else{
    var userName = "Default";
  }
    var socket = io(); //connect to the server that sent this page
    socket.on('connect', function(){
        socket.emit("intro", userName);
    });
    $('#inputText').keypress(function(ev){
            if(ev.which===13){
                //send message
                socket.emit("message",$(this).val());
                ev.preventDefault(); //if any
                $("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
                $(this).val(""); //empty the input
            }
    });

    socket.on("message",function(data){
        $("#chatLog").append(data+"\n");
        $('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
    });
    // socket to emit all the usernames onto the site
    socket.on("userNames", function(data){
        $("#user").empty();
        for(var i = 0; i < data.length; i++){
            var elements = $("<li></li>");
            elements.html(data[i]);
            elements.dblclick(click);
            users[i] = data[i];
            $("#user").append(elements);
            $("#userIndex").empty();
            $("#userIndex").append("Users Online: ");
            numUsers = data.length;
            $("#userIndex").append(numUsers);
        }
    });
    // striking it onto the screen
    socket.on("strike", function(data){
        var hi = 0;
        if(data.choice == 1){ // to strike it
           $("#user").empty();
           for(var i = 0; i < data.usernames.length; i++){
               var elements = $("<li></li>");
               elements.html(data.usernames[i]);
                elements.dblclick(click);
                for(var x = 0; x < data.blocked.length; x++){
                    if(data.usernames[i] == data.blocked[x]){
                        elements.addClass('blocked');
                       // alert(elements.html() + " has been blocked");
                    }
                }
               $("#user").append(elements);
           }
            alert(data.block + " has been blocked");
        }
        if(data.choice == 2){ // to unstrike it
           $("#user").empty();
           for(var i = 0; i < data.usernames.length; i++){
               var elements = $("<li></li>");
               elements.html(data.usernames[i]);
                elements.dblclick(click);
                for(var x = 0; x < data.blocked.length; x++){
                    if(data.usernames[i] == data.blocked[x]){
                        elements.addClass('blocked');
                        //alert(elements.html() + "asd has been blocked");
                    }
                }
               $("#user").append(elements);
           }
            alert(data.unblocked + " has been unblocked");
        }
    });
    socket.on("updateIndex", function(data){
      $("#userIndex").empty();
      $("#userIndex").append("Users Online: ");
      $("#userIndex").append(data);
    });
    // private messagers
    socket.on("privateMessage", function(data){
        var checker = false;
        for(var i = 0; i < data.blocked.length; i++){
            if(data.blocked[i] == data.username){
                checker = true;
            }
        }
        // if its not blocked
        if(checker == false){
            privateMessage(data.sender, data.username, 1, data.message);
        }else{ // if the person is blocked
            privateMessage(data.sender, data.username, 2, "");
        }
    });
    // double click functionality
    function click(e){
    var userSocket = $(this).html();
    if(e.shiftKey && userSocket != userName){
        blockUser(userSocket, userName); // calls function
    }else if(userSocket != userName){
        privateMessage(userSocket, userName, 0,""); // calls function
    }
    }
    // using the blcokuser
    function blockUser(blocked, blocker){
        var info = {};
        info.blocked = blocked; // user to block
        info.blocker = blocker; // user blocking
        socket.emit("blockUser", info);
    }
    // private messagers
    function privateMessage(rec, sender, check, message){
        if(check == 0){// recieve
            var sendMessage = prompt("what is your message to " + rec);
            if(sendMessage != ""){ // this checks for null
                var info = {};
                info.username = rec; // sets the reciever
                info.message = sendMessage; // the message
                info.sender = sender; // the sender
                socket.emit("privateMessage", info);
            }
        }else if(check == 1){ // recieverd
            var sendMessage = prompt(rec + " said : " + message + ", how would you like to reply?");
            if(sendMessage != ""){
               var info = {};
                info.username = rec; // reciever
                info.message = sendMessage; // message
                info.sender = sender; // sender
                socket.emit("privateMessage", info);
            }
        }
    }
  window.onscroll = function() {myFunction()};

  // Get the navbar
  var navbar = document.getElementById("navbar");

  // Get the offset position of the navbar
  var sticky = navbar.offsetTop;

  // Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
  function myFunction() {
    if (window.pageYOffset >= sticky) {
      navbar.classList.add("sticky")
    } else {
      navbar.classList.remove("sticky");
    }
  }
  var e = document.getElementById('userIndex');
  e.onmouseover = function() {
    if(users.length >= 1){
      $("#userIndex").empty();
        $("#userIndex").append("Names of Users: ");
      for(var x1 = 0; x1 <= users.length; x1++){
        $("#userIndex").append(users[x1]);
        $("#userIndex").append(" ");
      }
    }
  }

  e.onmouseout = function() {
    $("#userIndex").empty();
    $("#userIndex").append("Users Online: ");
    $("#userIndex").append(numUsers);
  }

});
