/**
 * Module dependencies.
 */

var express		= require('express')
  , routes 		= require('./routes')
 // ,notifications= require('./routes/notifications')
  
  , http 		= require('http')
  , path 		= require('path')
 // , sugar 		= require('sugar')
  , redis		= require('redis');

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3001);
//  app.set('views', __dirname + '/views');
//  app.set('view engine', 'ejs');
//	app.use(express.static(path.join(__dirname, 'public')));
	app.set("view engine","jade");
	app.set("view options",{layout:true});
	app.set("views",__dirname+"/views");
	app.use(express.static(__dirname + '/public'));

	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('walk-in'));
	app.use(express.session());
	app.use(app.router);
	//app.use(require('less-middleware')({ src: __dirname + '/public' }));
});
/*
require('nodefly').profile(
    '844946fe-3a15-4918-9fad-e5b3f5b1e6f8',
    'fathomless-sands-4651'
);
*/

//var error = require('./lib/ErrorHandler');

/* app.configure('development', function(){
	app.use(error({ showMessage: true, dumpExceptions: true, showStack: true, logErrors: __dirname + '/log/error_log' }));
}); */

// 404 Page
app.use(function(req, res, next){
	res.statusCode = 404;
	res.render('errors/404.ejs', {title: "404 - Page Not Found", showFullNav: false, status: 404, url: req.url });
});

app.get('/', routes.index);

// APIs
var facebook		= require('facebook-graph');

var Foursquare		= require('foursquareonnode/foursquare'),
	FoursquareKeys	= require('foursquareonnode/key'),
	CLIENT_ID		= FoursquareKeys.CLIENT_ID,
	CLIENT_SECRET	= FoursquareKeys.CLIENT_SECRET,
	REDIRECT_URI	= "http://dev-demo.walkihq.pvt:3001/callback",
	ACCESS_TOKEN	= '',
	FoursquareVenue = (require('foursquarevenues'))(FoursquareKeys.CLIENT_ID, FoursquareKeys.CLIENT_SECRET);

app.get('/fqlogin', function(req, res){
	business.businessLogin(req, res);
});

app.get('/callback', function (req, res) {
	business.loginCallback(req, res);
});

// Mongoose
var mongoose	= require( 'mongoose' );

mongoose.connect('mongodb://admin_walki:Qwe123Qwe@alex.mongohq.com:10013/walki_db_dev' );
/*mongoose.connection.on('error', function(){
	console.log("ERROR!");
});
*/
var Schema   = mongoose.Schema;

var userSchema = new Schema({    
	    id: 		String,
	    first_name: String,
	    last_name: 	String,
	    middle_name:String,
	    name:		String,
	    email: 		String,
	    timezone: 	String,
	    birthday: 	String,
	    locale: 	String,
	    gender: 	String,
	    picture: {
	      data: {
	        url: String,
	        is_silhouette:Boolean
	      }
	    },
	    installed:	String,
	    link:		String,
	    location:	String,
	    favorites:	Array,
	    activities: Array,
	    settings: {
		    email:	String,
		    phone: 	String,
		    address:String,
		    city:	String,
		    state:	String,
		    zip:	String,
		    notifications:{
			    push:	Number,
			    email:	Number,
			    sms:	Number,
			    alerts: Number,
			    reminder: {
				    number:	  Number,
				    friendly: String
			    }
		    },
		    version: String,
		    status: {
			    number: Number,
			    friendly: String
		    },
		    devices:Array
	    }
});
var user = mongoose.model( 'users', userSchema );

var eventSchema = new Schema({
	name:		String,
	user_id:	String,
	venue_id:	String,
	
	location: {
            city: String,
            state:String
        },
	
	date:{
		day: 	Number,
		month: 	Number,
		year: 	Number,
		time: 	Number
	},
	
	start_time:	String,
	end_time:	String,
		
	status:{
		number:		Number,
		friendly:	String
	},
	duration:{
		number:		Number,
		friendly:	String	
	}
});
var event = mongoose.model( 'events', eventSchema );

var categorySchema = new Schema({
    id: 	String,
    name: 	String,
    pluralName: String,
    shortName: 	String,
    icon: {
        prefix: String,
        suffix: String
    },
    categories: [
        {
            id: 	String,
            name: 	String,
            pluralName: String,
            shortName: 	String,
            icon: {
                prefix:	String,
                suffix: String
            }
        }
    ]
});

var activitySchema	= new Schema({
	user_id:		String,
	interWith_id:	String,
	date: String,
	details:{
		activity_type:	 String,
		activity_number: Number,
		friendly: 	String,
		trigger:	String	
	},	
	status:{
		number:		Number,
		friendly:	String
	},
});

var activity = mongoose.model( 'activities', activitySchema );

var feedbackSchema	= new Schema({
	user_id:	String,
	name: 		String,
	email:		String,
	content:	String
});
var feedback = mongoose.model( 'feedbacks', feedbackSchema );

var server	 = http.createServer(app);

server.listen(app.get('port'), function(){
	
	console.log("Express server listening on port " + app.get('port'));
  
	// RedisTOGO Config
	var clients		= {}
	clients.active	= new Array();
	var client = redis.createClient(9812, 'barreleye.redistogo.com');
	client.auth("67392bd208e58893030adf704ddc5b44", function(err) {
		if (err) { throw err; }
	});
	
	client.on('ready', function () {
		console.log("Walk-in is connected to Redis");
	});


	// Socket.IO
	var io = require('socket.io').listen(server);
	  
	io.configure(function () {
		io.set("transports", ["xhr-polling"]);
	    io.set("polling duration", 10);
	    io.set("log level", 1);
	});

	io.sockets.on('connection', function (socket) {	
		// console.log("Client connected. Let's get a name...");
		
		socket.on('set name', function (deviceID) {
			socket.set('nodename', deviceID, function () {
				console.log(deviceID + " is connected.");
				clients.active[deviceID] = socket.id;
				client.set(deviceID, socket.id, redis.print);
				//send a secure message back to the client. you can raise an event or whatever....
				io.sockets.socket(socket.id).emit('securemsg', 'I registered your deviceID. Secure Socket ID:' + socket.id);
			});
		});
		
		
		/* Users */
		socket.on("verifyFacebookLogin", function(params){

			var graph = new facebook.GraphAPI(params.token);
			console.log(params.deviceID + ' is requesting Facebook Data verification. Token: ' + params.token);
			graph.getObject('me', {'fields' : 'id, first_name, last_name, middle_name, name, locale, timezone, birthday, gender, picture, email, installed, link, location'}, 
		
			function(error, fbdata){
				var res = error || "200";
				
				if(res == "200"){
					console.log("Facebook Connect Succeed");
					var user = mongoose.model( 'users', userSchema );
					
					user.findOne({"id" : fbdata.id}, function ( error, users ){
						
						if( error || users == null ) {
							console.log( "User record NOT found on users collection." );
							
							var tempuser 		= fbdata;
							tempuser.favorites  = [];
							tempuser.activities = [];
							tempuser.settings   = {
							    email:	fbdata.email,
							    phone: 	"",
							    address:"",
							    city:	"",
							    state:	"",
							    zip:	"",
							    notifications:{
								    push:	1,
								    email:	1,
								    sms:	0,
								    alerts: 1,
								    reminder: {
									    number:	  1,
									    friendly: "1 hours before"
								    }
							    },
							    version: params.version,
							    status: {
								    number: 1,
								    friendly: 'Active'
							    },
							    devices: [{
							    	"device_id":	params.deviceID || "Unknown", 
							    	"device_name": 	params.device_name || "Unknown", 
							   		"ua_token":		params.ua_token || "Unknown"
							    }]
							};
							
							var saveuser = new user(tempuser).save(function(err, users){
								var result = {
									"data":"User already registered on database",
									"user": users
								};
								
								//notifications.sendNotifications({"user": fbdata, "type": "welcome"});
								socket.emit("verifyFacebookLogin", result);
							});
						}else{
							var tempuser = fbdata;
							
							/*
							user.update({"id":fbdata.id}, {$set: fbdata}, {"multi": false}, function(err, users){
							});
							*/
							user.findOne({"id" : fbdata.id}, function ( error, users ){
								var result = {
								"data":"User already registered on database",
								"user": users
								};
								socket.emit("verifyFacebookLogin", result);
							});
						}				
					});
				}else{
					var result = {"data": error};
					socket.emit("verifyFacebookLogin", result);
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
					if(params.status == "" || params.status == undefined)
						var query = { "user_id": fbdata.id, "status.friendly":{$ne:"Deleted"}};
					else
						query = { "user_id": fbdata.id, "status.friendly": params.status};
					
					event.find(query, function (err, data){
						socket.emit("getEvents", data);
						// console.log(data || err);
					});
				}else{
					socket.emit("getEvents", error);
				}
			});
		});

		socket.on("addEvent", function(params) {
			var graph = new facebook.GraphAPI(params.token);
			graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
			
				var tempevent	  = params;
				tempevent.user_id = fbdata.id;

				if(!error) {
					FoursquareVenue.getVenue({venue_id:params.venue_id}, function(error, data) {
						console.log(data);
					});
					var saveuser = new event(tempevent).save(function(err){
						addActivity(params.token, params.venue_id, "new-event", "You scheduled a new appointment with " + 
										params.name + "", "event");

						socket.emit("addEvent", {"data":"event saved"});
					});		
				}else{
					socket.emit("addEvent", error);
				}
			});
		});

		socket.on('cancelEvent', function(params){
			var graph = new facebook.GraphAPI(params.token);
			graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
				if(!error) {
					event.findOneAndUpdate({ "user_id": fbdata.id, "_id": params.event_id },
										   {$set:{"status.number":-1, "status.friendly":"Cancelled"}}, 
					function (err, data){
						// console.log(data || error);
						socket.emit("cancelEvent", {"data":"Event cancelled successfully."});
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
					event.findOneAndUpdate({ "user_id": fbdata.id, "_id": params.event_id },
										   {$set:{"status.number":-2, "status.friendly":"Deleted"}}, 
					function (err, data){
						// console.log(data || error);
						socket.emit("deleteEvent", {"data":"Event deleted successfully."});
					});
				}else{
					socket.emit("deleteEvent", {"data":"Event deleted successfully."});
				}
			});
		});
		
		/* Businesses */
		socket.on('searchBusiness', function(params) {
		  FoursquareVenue.getVenues(params, function(error, data) {
		    if (!error) { 
		        var venues	= JSON.parse(JSON.stringify(data.response.venues));
				venues		= venues.map(function (v) {
				
					var y 		= {};
					y.venue_id	= v.id;
					y.name		= v.name;
					y.city		= (v.location.city || "Unknown").titleize();
					y.state		= v.location.state || "Unknown";
					y._id 		= "0";
					y.location = {
						"lon":v.location.lng,
						"lat":v.location.lat
					};
					y.distance 	 = Math.round(v.location.distance * 0.00062137 * Math.pow(10, 2)) / Math.pow(10, 2);
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
			        socket.emit('getBusinessByVenueID', venue);
			    }else{
				    socket.emit('getBusinessByVenueID', error);
			    }
			});
		});
		
		socket.on('getTipsByVenueID', function(params) {
			FoursquareVenue.getTips(params, function(error, data) {
			    if (!error) {
			        var tips = JSON.parse(JSON.stringify(data.response));

			        tips	= tips.tips.items.map(function (v) {
						var y 	= {};
						y.text	= v.text;
						y.user	= v.user.firstName || "" + ' ' + v.user.lastName || "";
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
					event.find({ "venue_id": params.venue_id, "status.friendly": "Confirmed", "date.month": params.month, "date.day":params.day,"date.year":params.year},{"_id":0, "date.time":1}, function (err, data){
					
						data = data.map(function (v) {
							var y 	= {};
							y.time	= v.date.time;
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
				        mapreduce:	"event", 
				        query: 		{ 'start_time' : { $gt: new Date() } },
				        map: 		urlMap.toString(),
				        reduce:		urlReduce.toString(),
				        sort:		{url: 1},
				        out:		"pingjar"
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
			var category = mongoose.model( 'categories', categorySchema );
			
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
					activity.find({ "user_id": fbdata.id, "status.friendly":{$ne:"Deleted"}}, {}, { skip: params.skip, limit: 10, sort:{ date: -1} }, function (err, data){
						socket.emit("getActivities", data);
						// console.log(data || err);
					});
				}else{
					socket.emit("getActivities", error);
				}
			});
		});
		
		socket.on('deleteActivity', function(params){
			var graph = new facebook.GraphAPI(params.token);
			graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
				if(!error) {
					activity.findOneAndUpdate({ "user_id": fbdata.id, "_id": params.activity_id },
										   {$set:{"status.number":-2, "status.friendly":"Deleted"}}, 
					function (err, data){
						// console.log(data || error);
						socket.emit("deleteActivity", {"data":"Activity deleted successfully."});
					});
				}else{
					socket.emit("deleteActivity", {"data":"Activity deleted successfully."});
				}
			});
		});
		
		
		socket.on('sendFeedback', function(params){
			var graph = new facebook.GraphAPI(params.token);
			graph.getObject('me', {'fields' : 'id, installed, name, email'}, function(error, fbdata) {
				if(!error) {
					var fback = {
						user_id:	fbdata.id,
						name: 		fbdata.name,
						email:		fbdata.email,
						content:	params.content
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

					var tom		= Math.max(words.indexOf('tomorrow'), words.indexOf('tom'));
					var next	= words.indexOf('next');
					var propos	= words.indexOf('on');
					var month	= Math.max(words.indexOf('january'), words.indexOf('february'), words.indexOf('march'), 
										   words.indexOf('april'), words.indexOf('may'), words.indexOf('june'), words.indexOf('july'), 
										   words.indexOf('august'), words.indexOf('september'), words.indexOf('november'), words.indexOf('december'),
										   words.indexOf('jan'), words.indexOf('feb'), words.indexOf('mar'), words.indexOf('apr'), words.indexOf('jun'),
										   words.indexOf('jul'), words.indexOf('aug'), words.indexOf('sep'), words.indexOf('nov'), words.indexOf('dec'));

					var max 	  = Math.max(tom, next, month, propos);
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
					var date 	 = Date.create(date_text).format('{yyyy}-{MM}-{dd}');
					var time 	 = Date.create(date_text).format('{12hr}:{mm}{tt}');
					var datetime = date + ' ' + time + ' ' + timezone;
					var endtime  = Date.create(date_text).advance('1 hour').format('{12hr}:{mm}{tt}');
					
					var searchParam =  {
						"intent":	"browse",
						"query":	bizname,
						"near":		params.near || "Dallas,TX",
						"ll":		params.ll || "32.779978,-96.799342",
						"skip":		params.skip,
						"limit":	params.limit
			        };
					
					FoursquareVenue.getVenues(searchParam, function(error, data) {
					    if (!error) {
					        var venues	= JSON.parse(JSON.stringify(data.response.venues));
							venues		= venues.map(function (v) {
								var y 		= {};
								y.venue_id	= v.id;
								y.name		= v.name;
								y.location	= v.location;
								y.distance 	= Math.round(v.location.distance * 0.00062137 * Math.pow(10, 2)) / Math.pow(10, 2);	
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
						"settings.email":	params.email,
					    "settings.phone": 	params.phone,
					    "settings.address":	params.address,
					    "settings.city":	params.city,
					    "settings.state":	params.state,
					    "settings.zip":		params.zip,
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

		
		/* Disconnect listener */
		
		socket.on('disconnect', function(deviceID) {
			console.log(deviceID + " is disengaging. Redis will remove this client in 10 seconds");
			client.expire(deviceID, 100);
			clients.active.remove(deviceID);
			console.log('Client disconnected.');
		});
	});
	
	
	/* Functions */
	function addActivity(token, interWith_id, _type, _friendly, _trigger)
	{
		var graph = new facebook.GraphAPI(token);
		graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {

			var timezone = new Date().getUTCOffset();
			var date 	 = Date.create().format('{yyyy}-{MM}-{dd}');
			var time 	 = Date.create().format('{hh}:{mm}:{ss}');

			var tempevent = {
				user_id: fbdata.id,
				interWith_id: interWith_id,
				date: date + ' '  + time + ' ' + timezone,
				details:
				{
					activity_type: 	_type,
					activity_number: 1,
					friendly: _friendly,
					trigger:  _trigger
				}
			};
			
			// console.log(tempevent);

			if(!error) {
				var saveuser = new activity(tempevent).save(function(err){
					return true;
				});		
			}else{
				return false;
			}
		});
	}
	
});
