var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var db = require("./models/schema");

app.listen(8081);

function handler (req, res) {
  fs.readFile(__dirname + '/chatClient.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var users = {};
var usersocket = {};

io.sockets.on('connection', function (socket) {

      socket.emit("ack",{'msg' : "Welcome to server !"});

      socket.on("connect",function(data){
             users[data.uid] = {type:data.type,name:data.uname,uid:data.uid};
             usersocket[data.uid] = socket
             socket.broadcast.emit('connect',{users:users});
          });

      // when the client emits 'sendchat', this listens and executes
      // args : to_uid,from_uid,msg
      socket.on('sendchat', function (data) {
          // we tell the client to execute 'updatechat' with 2 parameters
          usocket = usersocket[data.to_uid];
          from = data.from_uid;
          console.log("from="+from)
          usocket.emit('msg', {msg: data.msg,from:from});

      });


      // when the client emits 'adduser', this listens and executes
      socket.on('adduser', function(username){
          // we store the username in the socket session for this client
          socket.username = username;
          // add the client's username to the global list
          usernames[username] = username;
          // echo to client they've connected
          socket.emit('updatechat', 'SERVER', 'you have connected');
          // echo globally (all clients) that a person has connected
          socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
          // update the list of users in chat, client-side
          io.sockets.emit('updateusers', usernames);
      });

      // when the user disconnects.. perform this
      socket.on('disconnect', function(){
          // remove the username from global usernames list
          console.log("===============================DISCONNECTED");
          try{
                delete usernames[socket.username];
                // update list of users in chat, client-side
                io.sockets.emit('updateusers', usernames);
          }
          catch(err){
                console.log("not logged in!")
          }
          // echo globally that this client has left
          socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has         disconnected');
      });
});