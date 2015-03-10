var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , async = require("async")
  , _u = require("underscore")
  , moment = require("moment")
var port = process.env.PORT || 8888;
app.listen(port, function() {
  console.log("Listening on " + port);
});  

io.configure(function () {
       io.set("transports", ["xhr-polling"]);
       io.set("polling duration", 10);
       io.set("log level", 1);
   });

///////////   DB Connection
var db = require('./models/schema');
var msgs =  db.collection("messages");
var user = db.collection("user")
//this vars for chat app
var users = {};
var usersocket = {};

function handler (req, res) {
  fs.readFile(__dirname + '/testapis.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var dbfunction = require('./models/functions');

io.sockets.on('connection', function (socket) {
  // To get event by foursquare venue id
  socket.on('getEventsByVenueID',function(data){
      console.log("datat ===== >>" + typeof(data));
      dbfunction.getEventsByVenueID(data.venue_id,function(res){
        socket.emit('getEventsByVenueID',res);
      });
  });
 
  //to check userexist
  socket.on('verifyFoursquareLogin',function(data){
      //find business       
      dbfunction.verifyFoursquareLogin(data,function(res){
        console.log('res ='+res);
        socket.emit('verifyFoursquareLogin',res);
      }); 
  });

  socket.on('getEventById',function(data){
    dbfunction.getEventById(data.event_id,function(res){
        socket.emit('getEventById',res);
      });
  });

  socket.on('updateEventStatus',function(data){
    dbfunction.updateEventStatus(data,function(res){
        socket.emit('updateEventStatus',res);
      });
  });

  socket.on('addCustomer',function(data){
    dbfunction.addCustomer(data,function(res){
        socket.emit('addCustomer',res);
      });
  });
  
  socket.on('getCustomersByVenueId',function(data){
      dbfunction.getCustomersByVenueId(data,function(res){
          socket.emit('getCustomersByVenueId',res);
      });
  });


  // edit customer
  // event : editCustomer 
  // params : id,venue_id,name,email,mobile,office,home,address,city,state,zip
  /*
  socket.on('editCustomer',function(data){
    dbfunction.editCustomer(data,function(res){
        socket.emit('editCustomer',res);
      });
  });
  */
  // Delete customer
  // event : deleteCustomer 
  // params : id , foursquare_token
  // response-success:success
  // response-fail : userNotFound
  socket.on('delCustomer',function(data){
    dbfunction.delCustomer(data,function(res){
        socket.emit('delCustomer',res);
      });
  });

  // Add Employee
  // event : addEmployee
  // params : business_id,venue_id(of venue),foursquare_token,name,email,phone
  // success or employeeExist or inValidBusinessesId
  socket.on('addEmployee',function(data){
    dbfunction.addEmployee(data,function(res){
        socket.emit('addEmployee',res);
    });
  })

  // edit Employee
  // event : editEmployee
  // params : business_id,venue_id(of venue),foursquare_token,name,email,phone,id
  // success or employeeDoesNotExist or inValidBusinessesId
  socket.on('editEmployee',function(data){
    dbfunction.editEmployee(data,function(res){
        socket.emit('editEmployee',res);
    });
  });

  // delete Employee
  // event : delEmployee
  // params : foursquare_token,id
  // success or employeeDoesNotExist or inValidBusinessesId
  socket.on('delEmployee',function(data){
    dbfunction.delEmployee(data,function(res){
        socket.emit('delEmployee',res);
    });
  });

  // get Employee
  // event : getEmployee
  // params : foursquare_token,business_id,venue_id
  // success or employeeDoesNotExist or inValidBusinessesId
  socket.on('getEmployee',function(data){
    dbfunction.getEmployee(data,function(res){
        socket.emit('getEmployee',res);
    });
  });

  // Add Service
  // event : addService
  // params : business_id,venue_id(of venue),foursquare_token,name,duration,price
  // success or serviceExist or inValidBusinessesId
  socket.on('addService',function(data){
    dbfunction.addServices(data,function(res){
        socket.emit('addService',res);
    });
  });  

  // edit Service
  // event : editService
  // params : business_id,venue_id(of venue),foursquare_token,name,duration,price,id
  // success or serviceExist or inValidBusinessesId
  socket.on('editService',function(data){
    dbfunction.editService(data,function(res){
        socket.emit('editService',res);
    });
  });  

  // Del Service
  // event : delService
  // params : business_id,venue_id(of venue),foursquare_token,id
  // success or serviceExist or inValidBusinessesId
  socket.on('delService',function(data){
    dbfunction.delService(data,function(res){
        socket.emit('delService',res);
    });
  });
  //getServices
  //foursquare_token,venue_id
  socket.on('getServices',function(data){
    dbfunction.getServices(data,function(res){
        socket.emit('getServices',res);
    });
  });

  socket.on("addEvent",function(data){
    dbfunction.addEvent(data,function(res){
        socket.emit('addEvent',res);
    });
  });
    // 
    socket.on("updateVenueByID",function(data){
    dbfunction.updateVenueByID(data,function(res){
        socket.emit('updateVenueByID',res);
    });
  });
//getHoursByDay
    socket.on("getHoursByDay",function(data){
    dbfunction.getHoursByDay(data,function(res){
      console.log("GotHoursByDay");
        socket.emit('getHoursByDay',res);
    });
  });

 //send invitation
  socket.on("storeInvitation",function(data){
    dbfunction.storeInvitation(data,function(res){
        socket.emit('storeInvitation',res);
    });
  });
  
  //send notification
  //business_id,msg
  //sendNotifications
  socket.on("sendNotifications",function(data){
    dbfunction.sendNotifications(data,function(res){
        socket.emit('sendNotifications',res);
    });
  }); 

  //get businesses setting
  socket.on("getSetting",function(data){
    dbfunction.getSetting(data,function(res){
        socket.emit('getSetting',res);
    });
  }); 

    //set business settings
  socket.on("setSetting",function(data){
    dbfunction.setSetting(data,function(res){
        socket.emit('setSetting',res);
    });
  }); 
 //business feedback
 //param: accesstoken,content
  socket.on("userfeedback",function(data){
    dbfunction.userfeedback(data,function(res){
        socket.emit('userfeedback',res);
    });
  }); 
  // activate account 
  //param: token 
  socket.on("activateUser",function(data){
    dbfunction.activateUser(data,function(res){
        socket.emit('activateUser',res);
    });
  });
  // deactivate account 
  //param: token 
  socket.on("deactivateUser",function(data){
    dbfunction.deactivateUser(data,function(res){
        socket.emit('deactivateUser',res);
    });
  });



  /// chat app starts here :)
  // args : type,uname,uid
  // type : users / businesses
  socket.on("connectChat",function(data){      
       users[data.uid] = {type:data.type,name:data.uname,uid:data.uid};
       usersocket[data.uid] = socket
       console.log("===>connected");
       socket.emit('connectChat',"success");
    });

  
  // args : to_uid,from_uid,msg,type
  socket.on('sendChat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    console.log(data);
    var timestamp = moment().format(); 
    
    var newmsg = new msgs({   //type has to be b2c for business app
                          type:  "b2c",//from.type+"2"+to.type, // b2c or c2b                      
                          from: data.from_uid,
                          to: data.to_uid,
                          msg : data.msg,
                          timestamp : timestamp                    
                        });
    // check if user is online if yes send him chat notification else send push notificaiton
    newmsg.save(function(err,msg){    
          if(err){
            console.log(err);
          }
          else{
            var from = users[data.from_uid];
            
            payload = {   //type has to be b2c for business app
                type:  data.type,//from.type+"2"+to.type, // b2c or c2b                      
                from: data.from_uid,
                to: data.to_uid,
                msg : data.msg,
                timestamp : timestamp,
                name: from.name,
                localId : data.localId,
                "_id":msg._id                          
            }    
            socket.emit('sendChat',payload);
            
          if(usersocket[data.to_uid] != undefined){
            var usocket = usersocket[data.to_uid]; 
            usocket.emit('msg', payload);
          }
          else{           
            dbfunction.sendClientNotifications({id:data.to_uid,msg:newmsg},function(data){
              console.log(data);
            });      
          }
        }
      });
  });

  // args : uid
  socket.on("disconnectChat",function(data){
     delete users[data.uid];
     delete usersocket[data.uid];
     console.log("disconnected!!!!!");
     socket.emit('disconnectChat',"success");
  });

  //get messages from user
  //parms: uid,type
  socket.on("getMsgById",function(data){
      var type = data.type;
      var uid = data.uid;
      var msgList = {}
      async.series([
          function(callback){
              var cnt = 0;
              console.log("functiuon 1")
              msgs.find({to:data.uid},function(err,msgs){
                console.log("functiuon in 1")
                  if(err){
                    console.log("functiuon in 1 errr")
                    console.log(err);
                    callback();
                  }
                  else {
                    console.log("functiuon in 1 msg")
                    console.log(msgs)
                    //fetch customer details
                    //if msgs exists
                    console.log("msgss============"+msgs.length+"cnt====="+cnt);
                    if(msgs.length!=0){                          
                          _u.each(msgs,function(e){
                            console.log("msg in from ----"+e.from)                                        
                            
                            user.find({"_id":e.from},function(err,usr){
                                    cnt+=1;
                                    console.log("msgss============"+msgs.length+"cnt====="+cnt);
                                    if(err){
                                      console.log(err);
                                      console.log("callback ")                                      
                                    }
                                    if(usr){
                                      msgList[e.id] = {msg:e,usr:usr}                                      
                                    }
                                    else{
                                      console.log("error");
                                    }
                                    if(msgs.length == cnt){
                                      callback();
                                    }                                          
                              });
                          });
                      }
                      else{
                        callback();
                      }            
                  }
                 
            });
            
          },
          function(callback){
            var cnt = 0;
            console.log("functiuon 2")
            msgs.find({from:data.uid},function(err,msgs){
              console.log("functiuon in 2")
                  if(err){
                    console.log(err);
                      callback();
                  }
                  else{
                    //fetch customer details
                    //if msgs exists
                    
                    if(msgs.length!=0){
                        _u.each(msgs,function(e){
                              
                              user.find({"_id":e.to},function(err,usr){
                                      cnt+=1;
                                      console.log("msgss============"+msgs.length+"cnt====="+cnt);
                                    
                                      if(err){
                                        console.log(err);
                                        //callback();
                                      }
                                      if(usr){
                                        msgList[e.id] = {msg:e,usr:usr}
                                        
                                      }
                                      else{
                                        console.log("error");
                                      }
                                    if(msgs.length == cnt){
                                      callback();
                                    }                                             
                              });                             
                        });
                        
                    }
                    else{
                      callback();
                    }            
                  }
                  
            });
            
          }
        ],function(err){
          console.log("functiuon after")
            if(err){
              console.log("functiuon 1 after")
              socket.emit("getMsgById",err);
            }
            else{
              console.log("functiuon 2 after")
              socket.emit("getMsgById",msgList);
            }
        });
  });
  
  //get messages from user
  //parms: uid,type
  socket.on("getUnreadCount",function(data){
      var type = data.type;
      var uid = data.uid;
      var msgList = {}
      
      var cnt = 0;
      
      msgs.find({to:data.uid,deleted:false},function(err,msgs){
        console.log("functiuon in 1")
          if(err){
            console.log("functiuon in 1 errr")
            console.log(err);
    
          }
          else {
            console.log("functiuon in 1 msg")
            console.log(msgs)
            //fetch customer details
            //if msgs exists
            console.log("msgss============"+msgs.length+"cnt====="+cnt);
            if(msgs.length!=0){                          
                  _u.each(msgs,function(e){
                    console.log("msg in from ----"+e.from)                                        
                    
                    user.findOne({"_id":e.from},function(err,usr){
                            cnt+=1;
                            console.log("msgss============"+msgs.length+"cnt====="+cnt);
                            if(err){
                              console.log(err);
                              console.log("callback ")                                      
                            }
                            if(usr){
                              // if msg is in list then increase coutner or put msg to list
                              console.log("user_id=="+usr._id);
                              if(msgList[usr._id] == undefined){
                                var userObj = {
                                      name : usr.name,
                                      uid : usr._id,
                                      pic_url : usr.picture.data.url,
                                      address : usr.settings.address,
                                      city  : usr.settings.city,
                                      state : usr.settings.state,
                                      zip :usr.settings.zip,
                                      emailId :usr.email,
                                      phone :usr.settings.phone                                      
                                }
                                msgList[usr._id] = {msgcount:0,user:userObj} 
                              } 
                              else{
                                  //increase the counter
                                   var msgobj = msgList[usr._id] ;
                                   // in 
                                   if(e.seen == "0"){
                                      msgobj.unseen_msgcount += 1 ;
                                    }
                                    msgobj.msgcount += 1 ;
                                    msgList[usr._id] = msgobj ;
                              }                                    
                            }
                            else{
                              console.log("error");
                            }
                            if(msgs.length == cnt){
                              socket.emit("getUnreadCount",msgList);
                            }                                          
                      });
                  });
              }
              else{
                socket.emit("getUnreadCount",msgList);
              }            
          }
         
    });  
  });// getUnreadCount ends

  //mark seen for msgs
  //provide list of args : msg_ids
  socket.on("markSeen",function(data){
        console.log(data.msg_ids);
        console.log(typeof(data.msg_ids));
        msgs.update({ "_id":{$in:data.msg_ids}}, { $set: { seen: "1" } }, { multi: true }, function (err, numberAffected, raw) {
          if (err)
            console.log(err);
          socket.emit("markSeen","success");
          console.log('The number of updated documents was %d', numberAffected);
        }); 
  });// getUnreadCount ends

   // get session msgs getSessionMsgs
  // args : u1,u2,from,to
  socket.on("getSessionMsgs",function(data){
        console.log(data);
        // check this to paginate
        if(data.offset == undefined){        
          msgs.find({ $or: [ { to:data.u1,from:data.u2},{ to:data.u2,from:data.u1} ],deleted:false }).limit(20).sort( { timestamp: -1 } ).exec(function (err,msgs) {
            if (err)
              console.log(err);
            socket.emit("getSessionMsgs",msgs);
          }); 
        }
        else{
          msgs.find({ $or: [ { to:data.u1,from:data.u2},{ to:data.u2,from:data.u1} ],deleted:false}).skip(data.offset).limit(20).sort( { timestamp: -1 } ).exec(function (err,msgs) {
            if (err)
              console.log(err);
            socket.emit("getSessionMsgs",msgs);
          }); 
        }
  });// getUnreadCount ends

     // get session msgs deleteMsg
  // args : msgid
  socket.on("deleteMsg",function(data){
        msgs.update({ "_id":{$in:data.msg_ids}}, { $set: { deleted: true } }, { multi: true }, function (err, numberAffected, raw) {
          if (err)
            console.log(err);
          socket.emit("deleteMsg",{"deleted":data.msg_ids});
          console.log('The number of updated documents was %d', numberAffected);
        });    
  });// getUnreadCount ends

  socket.on("query",function(data){
    
  });

});