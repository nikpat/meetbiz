
//import db
var db = require('../models/schema');
var dbfunction = require('../models/functions');   // these are the function on database

var FOURSQ = require('foursquareonnode/foursquare');
var	KEYS = require('foursquareonnode/key');
var _u = require('underscore');
var async = require('async');
//for development
//var CLIENT_ID = KEYS.CLIENT_ID;
//var CLIENT_SECRET = KEYS.CLIENT_SECRET;
//var REDIRECT_URI = "http://walkiapp.herokuapp.com/callback";

/*
Owner
decimalplus walki
Client id
5VQH4N3MGVU1WGJ3UNIZGK2DQLJGYDWQXRLKFAJPDALLMMVI
Client secret
QRECGZOCHJ4OTC2PHAGZGMQH2ZKFMPF1GFGOCOLIPI5FS3EM

*/
// for local developemt
var CLIENT_ID = "HLTD4OPSX0PLVT2MT4FAP52LZBAMQG55ZEHKH5JRHNBKW2AY";
var CLIENT_SECRET = "VTG3N4ID5YKOI2TC4ZKY203PVQCUGJLWCW2XCH4YXFFO0H3W";
var REDIRECT_URI = "http://localhost:3000/callback";

exports.index = function(req, res){
  if(req.session.user == undefined)
	{
		var flashmsg = false;
		if(req.session.flashmsg){
			flashmsg = req.session.flashmsg;
			delete req.session.flashmsg;
		}
  		res.render('login', { title: 'walki Admin',flashmsg:flashmsg});
	}
  else{
  	 res.redirect('/home');
  }
};

exports.login = function(req,res){
	var uname = req.body.username;
	var password = req.body.password;

	crypto = require('crypto');
	var sha1 = crypto.createHash('sha1');
	sha1.update(password);
	var upass = sha1.digest('hex');
	var businesses = db.collection('businesses');
	var query = businesses.findOne({ username: uname,password:upass });
	query.exec(function(err,user){
		if (err) return handleError(err);
		if(user){
			req.session.user = user;
			req.session.loginType = 'direct';
			res.redirect('/home');
		}
		else{
			 //Set session
			 req.session.logerr = "User Not Found !"
   			 res.redirect('/');
		}
	});
}

exports.fslogin =  function(req, res) {
		var loc = "https://foursquare.com/oauth2/authenticate?client_id=" + CLIENT_ID + "&response_type=code&redirect_uri=" + REDIRECT_URI;
		//res.writeHead(303, { 'location': loc });
		res.redirect(loc)
		res.end();
}

exports.fscallback = function (req, res) {
	var code = req.query.code;
    var managedData = {};
    var userinfo = {};
    var venues_ids =[];

    // action starts here 
	FOURSQ.getAccessToken({
		code: code,
		redirect_uri: REDIRECT_URI,
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET
		}, function (access_token) {
		if (access_token !== undefined) {
			req.session.accessToken = access_token;
		    async.parallel([
		    	// function to fetch managed veneus of current user
							    function(callback) {
														FOURSQ.getManaged(access_token,function(data){
															managedData = data.items;															
															if(managedData.length > 0){
																console.log("here!"+managedData.length);
																for(i=0;i<managedData.length;i++){
																	console.log(managedData[i].id);
																	venues_ids.push({foursquare_id:managedData[i].id,name:managedData[i].name,location:managedData[i].location});
																	// once all venues ids are pushed make callback								
																	if(managedData.length == venues_ids.length ){
																		callback();
																	}
																}
															}
															else{
																callback();
															}															
														},
													 	function (error) {
															callback(error);
														});
						    						},
							    // function to fetch user info
							    function(callback) {
								    					FOURSQ.getUser("self", access_token, function (data) {
								    						    console.log("getting User!!!!!!");								    															
																userinfo = data;
																callback();											
															}, function (error) {
																callback(error);
														});
						        				  }
							],  function(err) {
									    if (err) {
									        throw err; //Or pass it on to an outer callback, log it or whatever suits your needs
									    }
									    else{
												
												req.session.loginType = "foursquare";
												
												var businesses = db.collection('businesses');
												//find business 
												businesses.findOne({email:userinfo.contact.email},function(err,user){
													// if error 
													if(err){
														res.send(err);
													} 
													// if user exist redirect
													if(user){
														req.session.user = user;
														req.session.loginType = 'foursquare';
														res.redirect('/home');
													}
													else{ 
															console.log(userinfo); 
															// if user does not exist create one
															var user = new businesses({ 
																						firstname: userinfo.firstName.toLowerCase(),
																						//lastname :userinfo.lastName.toLowerCase(),
																						activated: true,
																						email : userinfo.contact.email,
																						username : userinfo.contact.email,
																						password : String(Math.random()).replace("0.",""),
																						foursquare_token : access_token,
																						foursquare_uid : userinfo.id,
																						venues : venues_ids,
																						settings: {																								
																							    devices :[{
																								    	"device_id": "Unknown",
																								    	"device_name": "Unknown", 
																								   		"ua_token":	"Unknown"
																								    }], 
																							    status: {
																							      number: 1,
																							      friendly: "Active"
																							    },
																							    notifications: {
																							      push: 1,
																							      email: 1,
																							      sms: 0,
																							      alerts: 1,
																							      reminder: {
																							        number: 1,
																							        friendly: "1 hours before"
																							      }
																							    }
																						  }
																					});
															//save user to database
															user.save(function (err){
																		req.session.user = user;			
																		req.session.loginType = 'foursquare';
																		res.redirect('/home');
																	 });
														}
												});
									    	}
							});			
		} else {
			console.log("access_token is undefined.");
		}
	});
		
}


// site home page
exports.home = function(req,res){
	 if(req.session.user == undefined)
	{
  		res.render('login', { title: 'walki Admin'});
	}
  else{
  		console.log(req.session.user);
		//check login type
		if(req.session.loginType == "foursquare")
		{
								
				res.render("userinfo",{
					info:req.session.user,         // this data from foursquare
					mngData:req.session.user.venues,
					dirpath:__dirname
				});
			
		}
		else if(req.session.loginType == "direct"){

			res.render("dashboard",{
				info:req.session.user,  // this comes from our mongo db
				//mngData:managedData,
				dirpath:__dirname
			});
		} 
	}
}

//logout
exports.logout = function(req,res){
	delete req.session.user;
	res.redirect('/');
}

exports.forgotpass =function(req,res){
	var token = null;
	var nodemailer = require("nodemailer");
	var uemail = req.body.uemail;
	//check if email(user) exist
	var businesses = db.collection('businesses');
	businesses.findOne({ email: uemail}).exec(function (err, user){
		if(err){
			req.session.flashmsg = err;
	    	res.redirect('/');	
		}
		if(user){
				// send password renew token
				require('crypto').randomBytes(48, function(ex, buf) {
				   token = buf.toString('hex');
				   	// create reusable transport method (opens pool of SMTP connections)
					var smtpTransport = nodemailer.createTransport("SMTP",{
					    service: "Gmail",
					    auth: {
					        user: "talkwalktest@gmail.com",
					        pass: "test123!@#"
					    }
					});
					var pass_recovery = db.collection('passrecovery');
					var recoveryLink = new pass_recovery({email: uemail ,token:token});
					recoveryLink.save(function(err){
						if(err){
							console.log(err);
						}
						else{
							console.log('link saved');
						}
					});
					// setup e-mail data with unicode symbols
					var mailOptions = {
					    from: "test<test@walkig.in>", // sender address
					    to: uemail, // list of receivers
					    subject: "Password Recovery", // Subject line
					    text: "recovery link : http://127.0.0.1:3000/recovery/"+token, // plaintext body
					    html: "<a href='http://127.0.0.1:3000/recovery/"+token+"'>Password Recovery Link</a>" // html body
					}
					
					// send mail with defined transport object
					smtpTransport.sendMail(mailOptions, function(error, response){
					    if(error){
					        console.log(error);
					        req.session.flashmsg = "Failed to send mail";
					        res.redirect('/');
					    }else{
					    	console.log("Message sent: " + response.message);
					    	req.session.flashmsg = " Mail Sent !";
					    	res.redirect('/');					        
					    }
					    // if you don't want to use this transport object anymore, uncomment following line
					    //smtpTransport.close(); // shut down the connection pool, no more messages
					}); 
			}); // crypto end
		}	
		else{
			req.session.flashmsg = " Your Not Found !";
	    	res.redirect('/');	
		}
	});
}

exports.passrecovery = function(req,res){
	var token = req.params.token;
	var flashmsg = false;
	var pass_recovery = db.collection('passrecovery');
	var businesses = db.collection('businesses');
	if(req.method == 'POST'){
		var email = req.body.email;
		var pass = req.body.password;
		var cpass = req.body.cpassword;
		if(pass == cpass){
			var pass_recovery = db.collection('passrecovery');
			pass_recovery.findOne({email:email,token:token},function(err,token){
				if(err){
					res.render('passrecover',{title:"Reset Password",token:token,flashmsg:err});
				}
				if(token){
					crypto = require('crypto');
				    var sha1 = crypto.createHash('sha1');
					sha1.update(pass);		
					req.send(email+"=="+pass);
					businesses.findOneAndUpdate({email:email}, { password: sha1.digest('hex') }, function(){
						//remove token
						pass_recovery.remove({email:email},function(err){
							req.session.flashmsg = "Password has beed reset !"
							res.redirect('/');
						});
					})
				}
				else{
					res.render('passrecover',{title:"Reset Password",token:token,flashmsg:"Invalid Link"});
				}
			});
		}
		else{
			res.render('passrecover',{title:"Reset Password",token:token,flashmsg:"Password Mismatch !"});
		}
	}
	else{
		res.render('passrecover',{title:"Reset Password",token:token,flashmsg:flashmsg});
	}
}

exports.venue_details = function(req,res){
	FOURSQ.getVenue(req.params.venue_id, req.session.user.foursquare_token, function (data) {
	var daysObj = {Monday:"08:00AM-5.00PM",Tuesday:"08:00AM-5.00PM",Wednesday:"08:00AM-5.00PM",Thursday:"08:00AM-5.00PM",Friday:"08:00AM-5.00PM",Saturday:"08:00AM-5.00PM",Sunday:"08:00AM-5.00PM"};
		console.log(data);
		res.render("venue_details",{
			info:req.session.user,         // this data from foursquare
			mngData:req.session.user.venues,
			days:daysObj,
			dirpath:__dirname,
			vdata:data
		});
	}, function (error) {
		console.log("-> getVenue ERROR");
	});
}

exports.settings = function(req,res){
	var businesses = db.collection("businesses");
	var services = db.collection("services");
	var employees = db.collection("employees");
    //var settingObj = {};
    var serviceData = [];
    var empData = [];
	businesses.findOne({foursquare_uid:req.session.user.foursquare_uid},function(err,business){
		_u.each(business.venues,function(e){
			async.series([
			    function(callback) { //This is the first task, and callback is its callback task
			        services.find({'venue_id':e.foursquare_id},function(err,servicearr){
						var serviceObj = {};
						var service = {};
						serviceObj[e.foursquare_id] = servicearr;
						serviceData.push(serviceObj);
						callback();//Now we have fetched from the DB, so let's tell async that this task is done		
					});	
			    },
			    function(callback) { //This is the second task, and callback is its callback task
			        employees.find({'venue_id':e.foursquare_id},function(err,emparr){						
						var empObj = {};
						var emp = {};
						empObj[e.foursquare_id] = emparr;
						empData.push(empObj);						
						callback();//Now we have fetched from the DB, so let's tell async that this task is done		
					});	 //Since we don't do anything interesting in db.save()'s callback, we might as well just pass in the task callback 
			    }
			], function(err) { //This is the final callback
			   console.log(serviceData.length+"="+business.venues.length+"="+business.venues.length);
			   if(serviceData.length == business.venues.length && empData.length == business.venues.length ){
					res.render("settings",{
						info:req.session.user,         // this data from foursquare
						services:serviceData,
						employees:empData,
						business_id:business.id,
						venues : business.venues, 
						alert_note:  business.settings.notifications.sms,
						email_note:  business.settings.notifications.email,
						push_note :  business.settings.notifications.push,
						dirpath:__dirname,
					});
				};
			});
				
		});
	});
	
}

exports.calender = function(req,res){
	res.render('calender',{mngData:req.session.user.venues});
}


exports.getService = function(req,res){
	var services = db.collection("services");
	var businesses = db.collection("businesses");
	services.findById(req.query.serviceid,function(err,service){
		if(err){
			res.json(err);
		}
		else if(service){
			 res.json(service);
		}
		else{
			res.json("serviceNotFound");
		}
	});
}

exports.addService = function (req,res){
	var services = db.collection("services");
	services.findOne({"name" : req.body.name},function(err,service){
		if(service){
			res.send("serviceExist");
		}
		else{
			var new_service = new services({	
										businesses_id : req.body.businesses_id,
										venue_id :req.body.venue_id,
										name : req.body.name,
										duration : req.body.duration,
										segment : [],
										price : req.body.price,
									});
			//save user to database
			new_service.save(function (err,new_data){
				if(err){					
				res.send("error");
				}
				else{
					res.send(new_data.id);
				}		
			});	
		}
	});
}

exports.editService = function (req,res){
	var services = db.collection("services");
	services.findOneAndUpdate({"_id":req.body.service_id},{$set:req.body},function(err,service){
		if(err){
			res.send(err);
		}
		else if(service){
			res.send("success")
		}
		else{
			res.send("notFound")
		}
	});
}

exports.delService =  function(req,res){
	var services = db.collection("services");
	services.findOneAndRemove({"_id":req.body.service_id},{$set:req.body},function(err,service){
		if(err){
			res.send(err);
		}
		else if(service){
			res.send("success");
		}
		else{
			res.send("notFound");
		}
	});
}

exports.getEmp = function (req,res){
 				var employee = db.collection('employees');
			 	employee.findById(req.query.emp_id,function(err,emp){
			 		if(err){
			 			res.json(err);
			 		}
			 		else if(emp){
			 			res.json(emp);
			 		}
			 		else{
			 			res.json({err:"empNotFound"});
			 		}
		 		});

}

exports.addEmp = function (req,res){
	dbfunction.addEmployee({
								foursquare_token:req.session.accessToken,
								businesses_id:req.body.businesses_id,
								venue_id:req.body.venue_id,
								name:req.body.name,
								email:req.body.email,
								phone:req.body.phone,
								},function(res_data){
								res.send(res_data);	
						  });
}

exports.editEmp = function (req,res){
	dbfunction.editEmployee({
								foursquare_token:req.session.accessToken,
								venue_id:req.body.venue_id,
								email:req.body.email,
								name:req.body.name,
								phone:req.body.phone,
								id:req.body.emp_id
								},function(res_data){
								res.send(res_data);	
						  });
	
}

exports.delEmp = function (req,res){
	dbfunction.delEmployee({
								foursquare_token:req.session.accessToken,
								id:req.body.emp_id
								},function(res_data){
								res.send(res_data);	
						  });
}

// for deals
exports.getDeals = function (req,res){
	var deals = db.collection('deal');
	var businesses = db.collection("businesses");
	var users = db.collection("user");
	businesses.findById(req.session.user._id,function(err,business){
		if(err){
			console.log(err);
		}
		if(business){
			var dealsList = [];
			async.forEach(business.venues,function(venue, callback){
				deals.find({venue_id:venue.foursquare_id,status:{$ne:"Deleted"}},function(err,dealsobj){
					dealsList.push(dealsobj);
					callback();
				});
			},function(err){
				if(err){
					console.log(err);
				}
				//res.send(dealsList);
						
				res.render("deals",{
					info:req.session.user,
					dealsList:dealsList,         // this data from foursquare
					mngData:req.session.user.venues,
					dirpath:__dirname
				});	
			});
		}	
	});
}

exports.getDeal = function(req,res){
	var deals = db.collection('deal');
	deals.findById(req.query.deal_id,function(err,deal){
		if(err){
			res.json(err);
		}
		else if(deal){
			res.json(deal);
		}
		else{
			res.json({err:"dealNotFound"});
		}
	});
}

exports.addDeals = function (req,res){
	data = {
		foursquare_token : req.session.accessToken,
		venue_id 		 : data.venue_id,
		venue_name 		 : data.venue_name,
		venue_location 	 : data.venue_location,
		title 			 : data.title,
		start_date 		 : data.start_date,
		end_date 		 : data.end_date,
		deal 			 : data.deal,
		deal_type 		 : data.deal_type,
		description 	 : data.description,
		image 			 : data.image,
		use_logo 		 : data.use_logo,
	}
	dbfunction.addDeal(data,function(res_data){
			res.send(res_data);	
	});
}

exports.editDeals = function (req,res){
	data = {
		foursquare_token : req.session.accessToken,
		venue_id 		: data.venue_id,
		venue_name 		: data.venue_name,
		venue_location 	: data. venue_location,
		title 			: data.title,
		start_date 		: data.start_date,
		end_date 		: data.end_date,
		deal 			: data.deal,
		deal_type 		: data.deal_type,
		description 	: data.description,
		image 			: "",
		use_logo 		: false,
	}
	dbfunction.editDeal(data,function(res_data){
		res.send(res_data);	
	});	
}

exports.delDeals = function (req,res){
	dbfunction.deleteDeal({
		foursquare_token:req.session.accessToken,
		id:req.body.deal_id
		},function(res_data){
		console.log("==>>>>>>")
		res.send(res_data);	
	});
}

// for Events
exports.getapts = function(req,res){
	var events = db.collection("events");
	var businesses = db.collection("businesses");
	var users = db.collection("user");
	console.log("OUT======>here!!!!!!!!");
	businesses.findById(req.session.user._id,function(err,business){
		if(err){
			console.log(err);
		}
		console.log("here===>>")
		console.log(business)
		var appointments = [];
		var archived = [];
	    async.forEach(business.venues, function(venue, callback) { //The second argument (callback) is the "task callback" for a specific messageId
	        	console.log(venue.foursquare_id);
	        	//"status.friendly":{$ne:"Deleted"}
	        	events.find({"venue_id":venue.foursquare_id},function(err,uevts){
	        		if(err){
	        			console.log(err);
	        			callback();
	        		}
	        		else if(uevts){
	        		console.log(">>>>>>>>>>>>>>>"+uevts+"<<<<<<<<<<<<<<<<<");
	        		async.forEach(uevts, function(ets,done){
	        			users.findById(ets.user_id,function(e,u){
	        			//console.log("++++++++++++++"+u.name+"<<<<<<<<<<<<<<<<<");			        					
        					if(u){
        						if(ets.bstatus.friendly != "Deleted"){
	        						var apt = {
	        							name:u.name,
	        							apt_id : ets._id,
	        							venue_id : ets.venue_id
	        						}	        						
	        						appointments.push(apt);
	        						done();
        						}
        						else{
        							var apt = {
	        							name:u.name,
	        							apt_id : ets._id,
	        							venue_id : ets.venue_id
	        						}	        						
	        						archived.push(apt);
	        						done();
        						}
        					}
        					else{
        						done();
        					}
        				});

	        		}, function(err) {
							    callback();
							});	        			    			
	        		}
	        		else{
	        			console.log("not found");
	        			callback();
	        		}
	        	});
		    }, function(err) {
		    	console.log(appointments);
		        //Tell the user about the great success
				res.render("appointments",{
					info:req.session.user,
					apts:appointments,         // this data from foursquare
					mngData:req.session.user.venues,
					archived:archived,
					dirpath:__dirname
				}); 
		    });
	});
}

exports.getevent = function(req,res){
	var event_id = req.query.eventid;
	
	var events = db.collection("events");
	events.findById(event_id,function(err,evt){
		if(err){
			res.json(err);
		}
		else if(evt){
			var users = db.collection("user");
			users.findOne({id:evt.user_id},function(err,user){
				if(user){
					res.json({'event':evt,'user':user});
				}
			});
		}
		else{
			res.json({"err":"NotFound"});
		}
	});
}
// param : foursquare_token,event_id,number,friendly
exports.updateevent = function(req,res){
	var action = req.body.action;
	var eventId = req.body.eventId;
	var events = db.collection('events');
	// function
	console.log("eventid"+eventId);
	if(action == "cancled"){
		data = {
			foursquare_token:req.session.accessToken,
			event_id:eventId,
			number:"-1",
			friendly:"Cancelled"
		}
	}
	else if(action == "deleted"){
		data = {
			foursquare_token:req.session.accessToken,
			event_id:eventId,
			number:"-2",
			friendly:"Deleted"
		}
	}
	else if(action == "confirmed")
	{
		data = {
			foursquare_token:req.session.accessToken,
			event_id:eventId,
			number:"1",
			friendly:"Confirmed"
		}

	}
	else{
		data = {
			foursquare_token:req.session.accessToken,
			event_id:eventId,
			number:"0",
			friendly:"Pending"
		}
	}

	dbfunction.updateEventStatus(data,function(res_data){
		res.send(res_data);	
	});
}