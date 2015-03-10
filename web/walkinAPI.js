var app		= require('http').createServer(handler)
  , io		= require('socket.io').listen(app)
  , fs		= require('fs')
  , async	= require("async")
  , _u		= require("underscore")
  , moment	= require("moment")
  , redis	= require('redis')
  , sugar	= require('sugar')

// RedisTOGO Config
/*
var clients		= {}
clients.active	= new Array();
var client = redis.createClient(9812, 'barreleye.redistogo.com');
client.auth("67392bd208e58893030adf704ddc5b44", function(err) {
  if (err) { throw err; }
});

client.on('ready', function () {
  console.log("Walk-in is connected to Redis");
});
*/

var port = process.env.PORT || 8888;
app.listen(port, function() {
  console.log("Listening on " + port);
});  

io.configure(function () {
       io.set("transports", ["xhr-polling"]);
       io.set("polling duration", 10);
       //io.set("connect timeout", 10000);
       //io.set("client timeout", 10000);
       io.set("log level", 1);
   });

///////////   DB Connection
var db = require('./models/schema');

//import schemas for Socket APIs
var msgs          =   db.collection("messages");
var user          =   db.collection("user")
var event         =   db.collection("events")
var feedback      =   db.collection("customerfeedback")
var activity      =   db.collection("activities")
var businesses    =   db.collection("businesses")
// Social APIs
var facebook      = require('facebook-graph');
var Foursquare    = require('foursquareonnode/foursquare'),
  FoursquareKeys  = require('foursquareonnode/key'),
  CLIENT_ID       = FoursquareKeys.CLIENT_ID,
  CLIENT_SECRET   = FoursquareKeys.CLIENT_SECRET,
  REDIRECT_URI    = "",//"http://walkiapp.herokuapp.com/callback",
  ACCESS_TOKEN    = '',
  FoursquareVenue = (require('foursquarevenues'))(FoursquareKeys.CLIENT_ID, FoursquareKeys.CLIENT_SECRET);

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

  // Add Deal
  // event : getBusiness
  // params : venue_id(of venue from FS),venue_name,venue_location{lat,lon},title,start_date,
  // end_date,description,image,use_logo(true/false)
  // success or employeeExist or inValidBusinessesId
  socket.on('addDeal',function(data){
    dbfunction.addDeal(data,function(res){
        socket.emit('addDeal',res);
    });
  })

  // edit Deal
  // event : editEmployee
  // params : business_id,venue_id(of venue),foursquare_token,name,email,phone,id
  // success or employeeDoesNotExist or inValidBusinessesId
  socket.on('editDeal',function(data){
    dbfunction.editDeal(data,function(res){
        socket.emit('editDeal',res);
    });
  });

  // delete Deal
  // event : delEmployee
  // params : foursquare_token,id
  // success or employeeDoesNotExist or inValidBusinessesId
  socket.on('deleteDeal',function(data){
    dbfunction.deleteDeal(data,function(res){
        socket.emit('deleteDeal',res);
    });
  });

  // get Deal
  // event : getDeal
  // params : foursquare_token,business_id,venue_id
  // success or employeeDoesNotExist or inValidBusinessesId
  socket.on('getDeal',function(data){
    dbfunction.getDeal(data,function(res){
        socket.emit('getDeal',res);
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

  //addEventBusiness
  //params : token,name,date,duration,start_time,end_time,status,venue_id,note,user_id,location{city:" ",state:" "},employee_id
  socket.on("addEventBusiness",function(data){
    dbfunction.addEvent(data,function(res){
        socket.emit('addEventBusiness',res);
    });
  });
    // 
    socket.on("updateVenueByID",function(data){
    dbfunction.updateVenueByID(data,function(res){
        socket.emit('updateVenueByID',res);
    });
  });
//getHoursByDay
    socket.on("getHoursByDayBusiness",function(data){
    dbfunction.getHoursByDay(data,function(res){
      console.log("getHoursByDayBusiness");
        socket.emit('getHoursByDayBusiness',res);
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
  socket.on("activateUserBusiness",function(data){
    dbfunction.activateUser(data,function(res){
        socket.emit('activateUserBusiness',res);
    });
  });
  // deactivate account 
  //param: token 
  socket.on("deactivateUserBusiness",function(data){
    dbfunction.deactivateUser(data,function(res){
        socket.emit('deactivateUserBusiness',res);
    });
  });
//////////////////////////////////////////////////////////////////////////////////
////////////////////   Client API               //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


 
    socket.on('set name', function (deviceID) {
      socket.set('nodename', deviceID, function () {
        console.log(deviceID + " is connected.");
        //clients.active[deviceID] = socket.id;
        //client.set(deviceID, socket.id, redis.print);
        //send a secure message back to the client. you can raise an event or whatever....
        io.sockets.socket(socket.id).emit('securemsg', 'I registered your deviceID. Secure Socket ID:' + socket.id);
      });
    });
    
    //{"platform":"ios",
    //"deviceID":"78F7154B-32AC-45A4-B633-7B0FB43A7704",
    //"device_name":"iPhone Simulator",
    //"version":101,"token":"token"}
    /* Users */
    socket.on("verifyFacebookLogin", function(params){

      var graph = new facebook.GraphAPI(params.token);
      console.log(params.deviceID + ' is requesting Facebook Data verification. Token: ' + params.token);
      graph.getObject('me', {'fields' : 'id, first_name, last_name, middle_name, name, locale, timezone, birthday, gender, picture, email, installed, link, location'}, 
    
      function(error, fbdata){
        var res = error || "200";
        
        if(res == "200"){
          console.log("Facebook Connect Succeed");          
          var version = db.collection("version");
          version.findOne({"type":"client","platform":params.platform},function(err,ver){
                if(ver){
                  var version_id = ver.version_id;
                }
                else{
                  var version_id = 0; 
                }
                user.findOne({"id" : fbdata.id}, function ( error, users ){
                    if( error || users == null ) {
                      console.log( "User record NOT found on users collection." );              
                      var tempuser    = fbdata;
                      tempuser.favorites  = [];
                      tempuser.activities = [];
                      tempuser.settings   = {
                          email:  fbdata.email,
                          phone:  "",
                          address:"",
                          city: "",
                          state:  "",
                          zip:  "",
                          notifications:{
                            push: 1,
                            email:  1,
                            sms:  0,
                            alerts: 1,
                            reminder: {
                              number:   1,
                              friendly: "1 hours before"
                            }
                          },
                          version: params.version,
                          status: {
                            number: 1,
                            friendly: 'Active'
                          },
                          devices: [{
                            "device_id":  params.deviceID || "Unknown", 
                            "device_name":  params.device_name || "Unknown", 
                            "ua_token":   params.ua_token || "Unknown"
                          }]
                      };                    
                      var saveuser = new user(tempuser).save(function(err, users){
                        var result = {
                          "data":"User already registered on database",
                          "user": users
                        };                      
                        //notifications.sendNotifications({"user": fbdata, "type": "welcome"});
                        socket.emit("verifyFacebookLogin", {client:result,version:version_id});
                      });
                    }else{
                      var tempuser = fbdata;                   
                      user.findOne({"id" : fbdata.id}, function ( error, users ){
                        var result = {
                        "data":"User already registered on database",
                        "user": users
                        };
                        socket.emit("verifyFacebookLogin", {client:result,version:version_id});
                        users.last_login = +new Date();
                        users.save();
                      });
                  }       
                });
        });//version over
        }else{
          var result = {"data": error};
          socket.emit("verifyFacebookLogin", {client:result,version:version_id});
        }
      });
    });
    
    socket.on('deactivateUser', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOneAndUpdate({ "id": fbdata.id}, {$set: { "settings.status": {number: -1, friendly:"Deactive"}} } ,
          function (err, data){
            if(!err)
              socket.emit('deactivateUser', {"data":"User deactivated!"});
            else
              socket.emit('deactivateUser', {"data": "User cannot be deactivated!"});
          });
        }else{
          socket.emit('deactivateUser', error);
        }
      });
    });
    
    socket.on('activateUser', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOneAndUpdate({ "id": fbdata.id}, {$set: { "settings.status": {number: 1, friendly:"Active"}} } ,
          function (err, data){
            if(!err)
              socket.emit('activateUser', {"data":"User activated!"});
            else
              socket.emit('activateUser', {"data": "User cannot be activated!"});
          });
        }else{
          socket.emit('deactivateUser', error);
        }
      });
    });
    
    socket.on('getFavorites', function(params){

      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
    
        if(!error) {
          user.find({"id": fbdata.id}, function (error, data){
            if(data[0].favorites.length > 0){
              socket.emit('getFavorites', data[0].favorites);
            }else{
              socket.emit('getFavorites', {"data":"empty"});
            }
          }); 
        }else{
          socket.emit('getFavorites', {"data":"error"});
        }
      });
    });
    
    socket.on('addFavorite', function(params){
      var graph = new facebook.GraphAPI(params.token);
      
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
    
        if(!error) {
          user.find({ "id": fbdata.id, "favorites.venue_id": params.business.venue_id}, function (err, data){
            
            if(err || !data.length == 0){
              socket.emit('addFavorite',{"data":"this business is already in favorites list"});
            }else{
              console.log("adding a new favorite busines");

              user.update({id: fbdata.id}, {$push: {favorites: params.business} }, function(err, data){
                socket.emit('addFavorite',  {"data":"favorite added"});
              });
            }
          });
        }else{
          socket.emit('addFavorite', error);
        }
      });
    });
    
    socket.on('deleteFavorite', function(params){
      var graph = new facebook.GraphAPI(params.token);

      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOneAndUpdate({ "id": fbdata.id, "favorites.venue_id": params.venue_id}, 
                      {$unset: {"favorites.$": null}} ,
          function (err, data){
            if(!err)
              socket.emit('deleteFavorite', {"data":"favorite deleted!"});
            else
              socket.emit('deleteFavorite', {"data": err});
          });
        }else{
          socket.emit('deleteFavorite', error);
        }
      });
    });


    /* Events */
    socket.on('getEvents', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOne({'id':fbdata.id},function(err,userobj){
            if(params.status == "" || params.status == undefined)
              {var query = { "user_id": userobj._id, "cstatus.friendly":{$ne:"Deleted"}};}
            else
              {query = { "user_id": userobj._id, "cstatus.friendly": params.status};}
            event.find(query, function (err, data){
              socket.emit("getEvents", data);
            });
          });
        }else{
          socket.emit("getEvents", error);
        }
      });
    });

    socket.on("addEvent", function(params) {
      var graph = new facebook.GraphAPI(params.token);
       console.log("=========addEvent=============")
      graph.getObject('me', {'fields' : 'id, installed,name'}, function(error, fbdata) {
        FoursquareVenue.getVenue(params, function (err,res) {
          user.findOne({id:fbdata.id},function(err,user){
            var tempevent = params;
            tempevent.user_id = user._id;
            tempevent.note = params.note,
            tempevent.bstatus = params.status,
            tempevent.cstatus = params.status,
            tempevent.service_id = params.service_id,
            tempevent.employee_id = params.employee_id,
            tempevent.venue_location = res.response.venue.location;
            console.log("======================")
            console.log(fbdata.name);
            if(!error) {
              var saveuser = new event(tempevent).save(function(err,evt){
                dbfunction.addActivity(user._id, params.venue_id, "new-event", "You scheduled a new appointment with " + 
                        params.name + "",1, "event",evt._id);
                socket.emit("addEvent", {"data":"event saved"});
                // send notificiton
                businesses.findOne({ venues: { $elemMatch: { "foursquare_id" : params.venue_id } } },function(err,business){
                  if(err){
                    console.log(err);
                  }
                  else if(business){
                    var msgData = {
                      msg : fbdata.name+' wants to schedule an appointment at '+params.name+' on '+ params.date.day+'/'+ params.date.month+'/'+ params.date.year+" at "+params.start_time ,
                      business_id : business._id
                    };
                    dbfunction.sendBusinessNotifications(msgData,function(res){
                      console.log(res);
                    });  
                  }
                  else{
                    console.log("NotFound");
                  }
                });
              });   
            }else{
              socket.emit("addEvent", error);
            }
          });
        });
      });
    });

    socket.on('cancelEvent', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed,name'}, function(error, fbdata) {
        if(!error) {
          user.findOne({id:fbdata.id},function(err,user){
            event.findOneAndUpdate({ "user_id": user._id, "_id": params.event_id },
                         {$set:{"cstatus.number":-1, "cstatus.friendly":"Cancelled","bstatus.number":-1, "bstatus.friendly":"Cancelled"}}, 
            function (err, data){
              // console.log(data || error);
              socket.emit("cancelEvent", {"data":"Event cancelled successfully."});
                // send notificiton
                businesses.findOne({ venues: { $elemMatch: { "foursquare_id" : data.venue_id } } },function(err,business){
                  if(err){
                    console.log(err);
                  }
                  else if(business){
                    var msgData = {
                      msg : fbdata.name+' cancelled an appointment at '+data.name+' which is on '+ data.date.day+'/'+ data.date.month+'/'+ data.date.year+" at "+data.start_time ,
                      business_id : business._id
                    };
                    dbfunction.sendBusinessNotifications(msgData,function(res){
                      console.log(res);
                    });
                    dbfunction.addActivity(user._id, data.venue_id, "new-event", "You cancelled appointment with " + 
                        data.name + "",1, "event",params.event_id);  
                  }
                  else{
                    console.log("NotFound");
                  }
                });
            });
          });
        }else{
          socket.emit("cancelEvent", {"data":"Event cancelled successfully."});
        }
      });
    });
  
    socket.on('deleteEvent', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOne({id:fbdata.id},function(err,user){
            event.findOneAndUpdate({ "user_id": user._id, "_id": params.event_id },
                         {$set:{"cstatus.number":-2, "cstatus.friendly":"Deleted"}}, 
            function (err, data){
              // console.log(data || error);
              //dbfunction.addActivity(user._id, data.venue_id, "new-event", "You cancelled appointment with " + 
              //          data.name + "",1, "event",params.event_id );
              activity.remove({"details.event_id":params.event_id},function(err){
                if(err)
                  console.log(err)
                else
                  console.log("activity deleted!")
              });
              socket.emit("deleteEvent", {"data":"Event deleted successfully."});
            });
          });
        }else{
          socket.emit("deleteEvent", {"data":"Event deleted Failed."});
        }
      });
    });
    
    /* Businesses */
    socket.on('searchBusiness', function(params) {
      FoursquareVenue.getVenues(params, function(error, data) {
        if (!error) { 
            var venues  = JSON.parse(JSON.stringify(data.response.venues));
        venues    = venues.map(function (v) {
        
          var y     = {};
          y.venue_id  = v.id;
          y.name    = v.name;
          y.city    = (v.location.city || "Unknown").titleize();
          y.state   = v.location.state || "Unknown";
          y._id     = "0";
          y.location = {
            "lon":v.location.lng,
            "lat":v.location.lat
          };
          y.distance   = Math.round(v.location.distance * 0.00062137 * Math.pow(10, 2)) / Math.pow(10, 2);
          y.categories = v.categories;
          
          return y;
        });
        
        var venue = {query: params.query, venues: venues};
        socket.emit('searchBusiness', venue);
      }else{
        socket.emit('searchBusiness', error);
      }
      // console.log(venues || error);
      });
    });
    
    socket.on('getBusinessByVenueID', function(params) {
      FoursquareVenue.getVenue(params, function(error, data) {
          if (!error) {
              var venue = JSON.parse(JSON.stringify(data.response));
              var follow = db.collection("follow"); 
              var gotIt = false;
              var followed = false;
              businesses.find({},function(err,business){
                  // check if user following the venue
                  follow.findOne({user_id:params.user_id,venue_id:params.venue_id},function(err,ufollow){
                       if(ufollow){
                          followed = true;                    
                       }
                       else{
                          followed = false;
                        }
                  
                        var venue_id = params.venue_id
                        if(err){
                            console.log(err);
                        }
                        else{                    
                          var num_business = business.length;
                          if(business.length > 0){
                            async.forEach(business,function(business,outerCall){
                                async.forEach(business.venues,function(v,callback){                            
                                    if(v.foursquare_id == venue_id && gotIt == false){                                                                    
                                      socket.emit('getBusinessByVenueID', {venue:venue.venue,business:{name:business.firstname+" "+business.lastname,id:business._id,email:business.email,followed:followed}});
                                      gotIt = true;
                                    }                        
                                    else{
                                      callback();
                                    }
                                  },function(err){
                                    outerCall();
                                });                          
                            },function(err){
                              console.log("final");
                              socket.emit('getBusinessByVenueID', {venue:venue.venue,business_id:0,followed:followed});    
                            });
                          }
                          else{
                            socket.emit('getBusinessByVenueID', {venue:venue.venue,business_id:0,followed:followed});
                          }
                        }
                  });
              });              
          }else{
            socket.emit('getBusinessByVenueID', error);
          }
      });
    }); 
    
    socket.on('getTipsByVenueID', function(params) {
      FoursquareVenue.getTips(params, function(error, data) {
          if (!error) {
              var tips = JSON.parse(JSON.stringify(data.response));

              tips  = tips.tips.items.map(function (v) {
            var y   = {};
            y.text  = v.text;
            y.user  = v.user.firstName || "" + ' ' + v.user.lastName || "";
            return y;
          });
              
              socket.emit('getTipsByVenueID', tips);
          }else{
            socket.emit('getTipsByVenueID', error);
          }
      });
    });
    
    socket.on('getHoursByDay', function(params) {
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          event.find({ "venue_id": params.venue_id, "cstatus.friendly": "Confirmed", "date.month": params.month, "date.day":params.day,"date.year":params.year},{"_id":0, "date.time":1}, function (err, data){
            console.log(data);
            data = data.map(function (v) {
              var y   = {};
              y.time  = v.date.time;
              return y;
            });
            
            socket.emit("getHoursByDay", data);
          });
        }else{
          socket.emit("getHoursByDay", error);
        }
      });
    });
    
    socket.on('heatCalendarByMonth', function(params) {
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
                
          urlMap = function() {
               emit(this.date, 1); //sends the url 'key' and a 'value' of 1 to the reduce function
          }
          
          urlReduce = function(previous, current) {
               var count = 0;
               for (index in current) {
                 count += current[index];
               }
               return count;
          };
          
          var command = { 
                mapreduce:  "event", 
                query:    { 'start_time' : { $gt: new Date() } },
                map:    urlMap.toString(),
                reduce:   urlReduce.toString(),
                sort:   {url: 1},
                out:    "pingjar"
              };
          
          mongoose.connection.db.collection('pingjar', function(err, collection) {
            collection.find({}).sort({'value': -1}).limit(10).toArray(function(err, pings) {
              var data = {'home':{
                      'title': 'PingJar',
                      'pings': pings
              }};
              
              socket.emit("heatCalendarByMonth", data);
            });
          });

          /*      
          event.find({ "venue_id": params.venue_id, "date.month": params.month, "date.year":params.year}, {"_id":0, "start_time":1}, 
          function (err, data){
            socket.emit("heatCalendarByMonth", data);
          });*/
      }else{
        socket.emit("heatCalendarByMonth", error);
        }
      });
    });

    /* Categories */
  
    socket.on('getCategories', function(params){
      var category = db.collection('categories');
      
      category.find({name: {$nin: 
        ["Arts & Entertainment", "Nightlife Spot", "Outdoors & Recreation", "Travel & Transport"]}}, 
          function (err, data){
            socket.emit('getCategories', data);
      });
    });
    
    
    /* Activities */
  
    socket.on('getActivities', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {

        }else{
          socket.emit("getActivities", error);
        }
      });
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOne({'id':fbdata.id},function(err,userobj){
              activity.find({ "user_id": userobj._id, "status.friendly":{$ne:"Deleted"}}, {}, { skip: params.skip, limit: 10, sort:{ date: -1} }, function (err, data){
                var events = db.collection('events');
                
                  socket.emit("getActivities",data);
                             
                // console.log(data || err);
              });
          });
        }else{
          socket.emit("getEvents", error);
        }
      });
    });
    
    socket.on('deleteActivity', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          activity.findOneAndUpdate({"_id": params.activity_id },
                       {$set:{"status.number":-2, "status.friendly":"Deleted"}}, 
          function (err, data){
            // console.log(data || error);
            socket.emit("deleteActivity", {"data":"Activity deleted successfully."});
          });
        }else{
          socket.emit("deleteActivity", {"data":"Activity deleted Failed."});
        }
      });
    });
    
    
    socket.on('sendFeedback', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed, name, email'}, function(error, fbdata) {
        if(!error) {
          var fback = {
            user_id:  fbdata.id,
            name:     fbdata.name,
            email:    fbdata.email,
            content:  params.content
          };

          var fbacks = new feedback(fback).save(function(err){
            //notifications.sendFeedback(fback);
            
            //var ua_token   = res.user.settings.devices[0].ua_token;
            //var ua_message = "Welcome to Walk-in family! You can start scheduling your appointments now!";
            //send_push(ua_token, ua_message);
            
            socket.emit("sendFeedback", {"data": "Feedback sent." });
          });
        }else{
          socket.emit("sendFeedback", {"data": error });
        }
      });
    });
    
    
    
    
    /* Quick Event Scheduler */
    socket.on('addQuickEvent', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
        
          var text  = params.text.toLowerCase();
          var words = text.split(' ');

          var tom   = Math.max(words.indexOf('tomorrow'), words.indexOf('tom'));
          var next  = words.indexOf('next');
          var propos  = words.indexOf('on');
          var month = Math.max(words.indexOf('january'), words.indexOf('february'), words.indexOf('march'), 
                       words.indexOf('april'), words.indexOf('may'), words.indexOf('june'), words.indexOf('july'), 
                       words.indexOf('august'), words.indexOf('september'), words.indexOf('november'), words.indexOf('december'),
                       words.indexOf('jan'), words.indexOf('feb'), words.indexOf('mar'), words.indexOf('apr'), words.indexOf('jun'),
                       words.indexOf('jul'), words.indexOf('aug'), words.indexOf('sep'), words.indexOf('nov'), words.indexOf('dec'));

          var max     = Math.max(tom, next, month, propos);
          var bizname   = '';
          var date_text = '';
          
          for(var i=0; i < max; i++) {
            if(words[i] != 'on')
            bizname += words[i] + ' ';
          }
          
          for(var i=max; i < words.length; i++) {
            if(words[i] == "tom")
              words[i] = "tomorrow";
            date_text += words[i] + ' ';
          }
          
          var timezone = new Date().getUTCOffset();
          var date   = Date.create(date_text).format('{yyyy}-{MM}-{dd}');
          var time   = Date.create(date_text).format('{12hr}:{mm}{tt}');
          var datetime = date + ' ' + time + ' ' + timezone;
          var endtime  = Date.create(date_text).advance('1 hour').format('{12hr}:{mm}{tt}');
          
          var searchParam =  {
            "intent": "browse",
            "query":  bizname,
            "near":   params.near || "Dallas,TX",
            "ll":   params.ll || "32.779978,-96.799342",
            "skip":   params.skip,
            "limit":  params.limit
              };
          
          FoursquareVenue.getVenues(searchParam, function(error, data) {
              if (!error) {
                  var venues  = JSON.parse(JSON.stringify(data.response.venues));
              venues    = venues.map(function (v) {
                var y     = {};
                y.venue_id  = v.id;
                y.name    = v.name;
                y.location  = v.location;
                y.distance  = Math.round(v.location.distance * 0.00062137 * Math.pow(10, 2)) / Math.pow(10, 2); 
                return y;
              });
              
              var result = {
                user_id:fbdata.id,
                venues: venues,
                date: datetime,
                start_time: time,
                end_time: endtime
              };
              // console.log(result);
              socket.emit("addQuickEvent", {"data": result});
            }else{
              socket.emit("addQuickEvent", {"data": error});
            }
          });
        }
      });
    });
  
  /* Settings */
    socket.on('getSettings', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.find({"id": fbdata.id}, function (error, data){
            socket.emit('getSettings', data[0].settings);
          }); 
        }else{
          socket.emit('getSettings', {"data":"error"});
        }
      });
    });
    
    socket.on('setSettings', function(params){
      var graph = new facebook.GraphAPI(params.token);
      graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
        if(!error) {
          user.findOneAndUpdate({ "id": fbdata.id },{$set:{
              "settings.email"    :   params.email,
              "settings.phone"    :   params.phone,
              "settings.address"  :   params.address,
              "settings.city"     :   params.city,
              "settings.state"    :   params.state,
              "settings.zip"      :   params.zip,
              "settings.notifications":params.notifications,
            }}, 
          function (){
            // console.log(settings);
            socket.emit("setSettings", {"data":"Settings saved successfully."});
          });
        }else{
          socket.emit("setSettings", {"data":"Settings not saved."});
        }
      });
    });

 //follow api
 //param: venue_id,user_id
  socket.on("follow",function(data){
    dbfunction.followVenue(data,function(res){
        socket.emit('follow',res);
    });
  }); 

 //unfollow api
 //param: venue_id,user_id
  socket.on("unfollow",function(data){
    dbfunction.unfollowVenue(data,function(res){
        socket.emit('unfollow',res);
    });
  }); 



  /* Categories */

  socket.on('getDealsByLatLng', function(params){
    dbfunction.getDealsByLatLng(params,function(res){
        socket.emit('getDealsByLatLng',res);
    });
  });
  
  //getDealById
  //params : lat,lng,foursquare_token,id
  socket.on('getDealById', function(params){
    dbfunction.getDealById(params,function(res){
        socket.emit('getDealById',res);
    });
  });
  

//////////////////////////////////////////////////////////////////////////////////
////////////////////   chat app starts here :)  //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
/// 
// args : type,uname,uid
// type : users / businesses
  socket.on("connect",function(data){
    console.log("===============>User connected");
  });

  socket.on("connectChat",function(data){      
       users[data.uid] = {type:data.type,name:data.uname,uid:data.uid};
       usersocket[data.uid] = socket
       console.log("===>connected");
       socket.emit('connectChat',"success");
  });

  
  // args : to_uid,from_uid,msg,type,venue_id
  socket.on('sendChat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    console.log(data);
    var timestamp = moment().format(); 
    var address = socket.handshake.address;
    // smaller will be first
    if(data.from_uid < data.to_uid){
      session_id = data.from_uid+data.to_uid;
    }
    else{
      session_id = data.to_uid+data.from_uid;
    }
    var newmsg = new msgs({                       //type has to be b2c for business app and c2b of client app
                            typ :  data.type,       //b2c or c2b                      
                            fr  :  data.from_uid,                            
                            to  :  data.to_uid,    // for businesses this will be business id
                            sid :  session_id,
                            msg :  data.msg,
                            vid :  data.venue_id,
                            vn  :  data.vn,
                            ts  :  timestamp,
                            ip  :  socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address         
                          });
    // check if user is online if yes send him chat notification else send push notificaiton
    newmsg.save(function(err,msg){    
          if(err){
            console.log(err);
          }
          else{
            var from = users[data.from_uid];            
            payload = {                           //type has to be b2c for business app
                type :  data.type,                 // b2c or c2b                      
                from : data.from_uid,
                to   : data.to_uid,
                msg  : data.msg,
                timestamp : timestamp,
                name: from.name,
                vn : data.vn,
                localId : data.localId,
                "_id":msg._id                          
            }    
            socket.emit('sendChat',payload);
            
          if(usersocket[data.to_uid] != undefined){
            var usocket = usersocket[data.to_uid]; 
            usocket.emit('msg', payload);
          }
          else{
            // if its client to business send notification to business
            if(data.type == "c2b"){
              console.log("business is offline then sending PUsh");
              dbfunction.sendBusinessPush({business_id:data.to_uid,msg:from.name+":"+data.msg},function(data){
              console.log(data);
              });
            }     
            // if its client to business send notification to business      
            else if(data.type == "b2c"){
              console.log("Client is offline then sending PUsh");
              businesses.find({venues:{ $elemMatch: { foursquare_id: data.venue_id } }},function(err,business){});
              businesses.findById(data.from_uid,function(err,business){
                if(err){
                  console.log(err);
                }
                else if(business){          
                  _u.each(business.venues,function(venue){
                    if(venue.foursquare_id == data.venue_id){
                      dbfunction.sendClientPush({id:data.to_uid,msg:venue.name+":"+data.msg},function(data){
                      console.log(data);
                      });
                     }                     
                  });
                }          
                else{
                  console.log("not found");
                }
              });
            }      
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


  /* Disconnect listener */  
  socket.on('disconnect', function(deviceID) {
    console.log(deviceID + " is disengaging. Redis will remove this client in 10 seconds");
    //client.expire(deviceID, 100);
    //clients.active.remove(deviceID);   
  });

  //get messages from user
  //parms: uid,type
  // c2b with client(user) id
  // b2c with business id
  socket.on("getUnreadCount",function(data){
      var type = data.type;
      var uid = data.uid;
      var msgList = {}
      var cnt = 0;
      // for b2c give response to business with respect to venue_id 
      if(type == 'b2c'){
        var query = {$or:[{to:data.uid},{fr:data.uid}],vid:data.venue_id,bdel:false}
        console.log(query);
      }
      else{
        var query = {$or:[{to:data.uid},{fr:data.uid}],cdel:false}
        console.log(query);
      }

      msgs.find(query,function(err,msgs){
        console.log("functiuon in 1")
          if(err){
            console.log("function in 1 errr")
            console.log(err);    
          }
          else {
            console.log("function in 1 msg")
            console.log(msgs)
            console.log("type === >"+type);
            //fetch customer details
            //if msgs exists           
             if(msgs.length!=0){                          
                  _u.each(msgs,function(e){                          
                      //check the type if c2b the fetch user else if b2c then fetch busiensses                                        
                      if(type == "b2c"){                      
                          user.findOne({$or:[{"_id":e.fr},{"_id":e.to}]},function(err,usr){                                                                                            
                                  if(err){
                                    console.log(err);
                                    console.log("callback  ====== ====== =====");                                                                         
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
                                      msgList[usr._id] = {msgcount:1,user:userObj,unseen_msgcount:0};
                                      if(e.to == uid){
                                              if(e.sn == "0"){
                                                  msgList[usr._id].unseen_msgcount = 1 ;
                                              }
                                            }                                                                         
                                    } 
                                    else{
                                      //increase the counter
                                      var msgobj = msgList[usr._id] ;
                                      // in 
                                      if(e.to == uid){
                                              if(e.sn == "0"){
                                                  console.log("unseen_-----t == "+ msgobj.unseen_msgcount )
                                                  msgobj.unseen_msgcount += 1 ;
                                              }
                                              console.log("unseen_msgcount == "+ msgobj.unseen_msgcount )
                                            }                                     
                                      msgobj.msgcount += 1 ;
                                      msgList[usr._id] = msgobj ;                                          
                                    }                                    
                                  }                                  
                                  if(msgs.length-1 == cnt){                                                   
                                    businesses.findById(uid,function(err,business){
                                       dbfunction.checkAccount(business,'chat',function(flag){
                                            socket.emit("getUnreadCount",{msgList:msgList,isPremium:flag});
                                        });
                                    });
                                  }
                            cnt++;                                        
                          });
                      }
                      // this is customer request for msg
                      else if(type == "c2b"){
                        console.log("c2b === >");
                        //if sent by clent then seach for business in to else seach for from ;)
                        if(e.fr == uid){
                          var businessQ = {"_id":e.to}
                        }
                        else{
                          var businessQ = {"_id":e.fr}
                        }
                        console.log(businessQ);
                        businesses.findOne(businessQ,function(err,usr){
                                  console.log(usr);
                                  if(err){
                                    console.log(err);
                                    console.log("callback ");                                                                           
                                  }
                                  if(usr){
                                    // iterate over the venues to form a group of venues with count instead on business
                                    async.forEach(usr.venues,function(venues,call){
                                      // if msg is in list then increase coutner or put msg to list
                                      console.log("user_id=="+usr._id);
                                      if(e.vid == venues.foursquare_id){
                                          if(msgList[e.vid] == undefined ){
                                            var userObj = {
                                                  name : usr.firstname+" "+usr.lastname,
                                                  uid : usr._id,
                                                  emailId :usr.email,
                                                  phone :usr.phone                                      
                                            }
                                            msgList[e.vid] = {msgcount:1,user:userObj,unseen_msgcount:0,venues_name:venues.name,venue_id:venues.foursquare_id} 
                                            // if msg from client then dont increse count
                                            if(e.fr != uid){
                                              if(e.sn == "0"){
                                                  msgList[e.vid].unseen_msgcount = 1 ;
                                              }
                                            }
                                            call();
                                          } 
                                          else if(e.vid == venues.foursquare_id){
                                              //increase the counter
                                               var msgobj = msgList[e.vid] ;
                                               // in
                                               // if msg from client then dont increse count
                                               if(e.fr != uid){
                                                    if(e.sn == "0"){
                                                    msgobj.unseen_msgcount += 1 ;
                                                  }
                                                }                                              
                                                msgobj.msgcount += 1 ;
                                                msgList[e.vid] = msgobj;                                          
                                                call();
                                          }
                                    }
                                    else{
                                      call();
                                    }
                                    },function(err){
                                      // this is callback function for each itreation
                                      if(err) {console.log(err)};
                                      console.log(msgs.length+"=<<||||>>="+cnt);
                                      if(msgs.length == cnt+1){
                                        socket.emit("getUnreadCount",msgList);
                                      }  
                                      cnt++ ;
                                    });                                        
                                  }
                                  /*
                                  else{
                                    // if no user found just increment counter this should not happen,it will heppen then business is deleted
                                    cnt++;
                                  }*/
                          });
                      }
                      
                  });
              }
              else{
                if(type == "b2c"){
                    businesses.findById(uid,function(err,business){
                       dbfunction.checkAccount(business,'chat',function(flag){
                            socket.emit("getUnreadCount",{msgList:msgList,isPremium:flag});
                        });
                    });
                }
                else{
                  socket.emit("getUnreadCount",msgList);
                }                
              }            
          }
         
    });  
  });// getUnreadCount ends

  //mark seen for msgs
  //provide list of args : msg_ids
  socket.on("markSeen",function(data){
        socket.emit("markSeen","success");
        msgs.update({ "_id":{$in:data.msg_ids}}, { $set: { sn: "1" } }, { multi: true }, function (err, numberAffected, raw) {
          if (err)
            {console.log(err);}
          console.log('The number of updated documents was %d', numberAffected);
        }); 
  });// getUnreadCount ends

  //  get session msgs getSessionMsgs
  //  args : u1,u2,from,to,venue_id,type
  //  u1 has to be business
  //  u2 has to be client
  socket.on("getSessionMsgs",function(data){
        console.log(data);
        // check this to paginate
        if(data.u1 < data.u2){
          session_id = data.u1+data.u2;
        }
        else{
          session_id = data.u2+data.u1;
        }
        if(data.type=="c"){
          var fetchquery = {sid:session_id,vid:data.venue_id,cdel:false };
        }
        if(data.type=="b"){
          var fetchquery = {sid:session_id,vid:data.venue_id,bdel:false };
        }
        if(data.offset == 0){
          console.log("here "+session_id)        
          msgs.find(fetchquery).limit(20).sort( { ts: -1 } ).exec(function (err,msgs) {
            if (err)
              console.log(err);
            socket.emit("getSessionMsgs",msgs);
          }); 
        }
        else{
          console.log("here 1")   
          msgs.find(fetchquery).skip(data.offset).limit(20).sort( { ts: -1 } ).exec(function (err,msgs) {
            if (err)
              console.log(err);
            socket.emit("getSessionMsgs",msgs);
          }); 
        }
  });// getUnreadCount ends

     // get session msgs deleteMsg
  // args : msgid
  socket.on("deleteMsg",function(data){
    if(data.type=="c"){
      var delquery = { $set: { cdel: true } }; // delete msg for client side
    }
    if(data.type=="b"){
      var delquery = { $set: { bdel: true } }; // delete msg for business
    }
    msgs.update({ "_id":{$in:data.msg_ids}}, delquery, { multi: true }, function (err, numberAffected, raw) {
      if (err)
        console.log(err);
      socket.emit("deleteMsg",{"deleted":data.msg_ids});
      console.log('The number of updated documents was %d', numberAffected);
    });    
  });// getUnreadCount ends


  /* Functions 
  //function addActivity(token, interWith_id, _type, _friendly, _trigger)
  function addActivity(id, interWith_id, _type, _friendly, _trigger)
  {
    //var graph = new facebook.GraphAPI(token);
    //graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {

      var timezone = new Date().getUTCOffset();
      var date   = Date.create().format('{yyyy}-{MM}-{dd}');
      var time   = Date.create().format('{hh}:{mm}:{ss}');

      var tempevent = {
        user_id: id,
        interWith_id: interWith_id,
        date: date + ' '  + time + ' ' + timezone,
        details:
        {
          activity_type:  _type,
          activity_number: 1,
          friendly: _friendly,
          trigger:  _trigger
        }
      };
      var saveuser = new activity(tempevent).save(function(err){
          return true;
      }); 
  }
  */

  /// API to test notificaton
  socket.on("sendBusinessNotifications",function(data){
        dbfunction.sendBusinessNotifications(data,function(res){
          socket.emit('sendBusinessNotifications',res);
        });         
  });

  socket.on("sendClientNotifications",function(data){
        dbfunction.sendClientNotifications(data,function(res){
          socket.emit('sendClientNotifications',res);
        });    
  });

  socket.on("checkVersion",function(data){
    var version = db.collection("version");
    version.findOne({"type":data.type,"platform":data.platform},function(err,ver){
      if(err){
        socket.emit('checkVersion',err);
        console.log(err);
      }
      else if(ver){
        socket.emit('checkVersion',ver);
      }
      else{
        socket.emit('checkVersion',"Version Details Not Found");
      }
    });
  });

  socket.on("addVersion",function(data){
    var version = db.collection("version");
    var newVer = new version({
        version_name : "code",
        type: "business",// type business or client
        platform : "ios",// ios or android
        version_id : 100
    }).save(function(err,ver){
      if(err){
        console.log(error)
      }
      else{
        console.log(ver)
      }
    });
    socket.emit('addVersion',"done");
  });// getUnreadCount ends

  socket.on("verifyPurchase",function(data){
    dbfunction.verifyPurchase(data,function(res){
        socket.emit('verifyPurchase',res);
    });
  });// getUnreadCount ends


});