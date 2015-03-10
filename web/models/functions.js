
var db = require("./schema");
//foursquare
var FOURSQ = require("foursquareonnode/foursquare"),
  KEYS = require('foursquareonnode/key');
//var CLIENT_ID = KEYS.CLIENT_ID;
//var CLIENT_SECRET = KEYS.CLIENT_SECRET;
var FoursquareVenue = (require('foursquarevenues'))(CLIENT_ID,CLIENT_SECRET);
var sugar	= require('sugar')
//for local development
var CLIENT_ID = "HLTD4OPSX0PLVT2MT4FAP52LZBAMQG55ZEHKH5JRHNBKW2AY";
var CLIENT_SECRET = "VTG3N4ID5YKOI2TC4ZKY203PVQCUGJLWCW2XCH4YXFFO0H3W";
var REDIRECT_URI = "http://walkiapp.herokuapp.com/callback";
//var REDIRECT_URI = "http://10.0.11.92:8080/callback";
var businesses = db.collection('businesses');
var _u = require("underscore");

var async = require("async")

exports.verifyFoursquareLogin = function(reqData,callback){
	console.log(reqData.accesstoken)
	//make foursuare request to check validity of access token
	FOURSQ.getUser("self",reqData.accesstoken, function (data) {
		// if user is valid we gtet response
		// find business 
		businesses.findOne({foursquare_token:reqData.accesstoken,foursquare_uid:data.id},function(err,user){
			var userinfo = data;
			var res;
			if(err){
				console.log('err');
				res = err;
				callback(err);	
				//return err;
			}
			if(user){
				FOURSQ.getManaged(reqData.accesstoken,function(data){
					var result = data.items;
					// we need to check if the venues exist or new venue added
					var checked = false; // set this false before check
					var venues_ids = [];
					var current_venues = user.venues;
					var venues = [];
						if(result.length > 0 ){

								// create a array of current venues
								for(i=0;i<current_venues.length;i++){
									venues_ids.push(current_venues[i].foursquare_id);
									venues.push(current_venues[i]); //make relative
								}

								var venue_check_interval = setInterval(function(){
									if(current_venues.length == venues.length){
										clearInterval(venue_check_interval);
										console.log("HERE venue_check_interval =========")
										//check for new venues if new venues is added
										for(i=0;i<result.length;i++){											
											console.log("Checked =========="+checked);										
											    // if new veneu added make entry
											    console.log(result[i]);
												if(venues_ids.indexOf(result[i].id) < 0 ){													
													venues.push({
															foursquare_id:result[i].id,
															name:result[i].name,
															location : result[i].location,
														});
												}
												//else update the current info
												else
												{	console.log("Checked Else=========="+venues_ids.indexOf(result[i].id));												
													venues[venues_ids.indexOf(result[i].id)].name = result[i].name;
													venues[venues_ids.indexOf(result[i].id)].location = result[i].location;
													
												}	
											}//for ends
										   
										   checked = true; // flaged venue checked
										} //if ends
								},50);

								}// if no venues
								else{
									 checked = true; // flaged venue checked
								}
								// 
								var interval = setInterval(function(){								
									if(checked)
									{					
										var venueUpdates = { 
											firstname: userinfo.firstName.toLocaleLowerCase(),
											lastname :userinfo.lastName.toLocaleLowerCase(),									
											email : userinfo.contact.email,
											phone: userinfo.contact.phone|| 0,
											username : userinfo.contact.email,										
											foursquare_token : reqData.accesstoken,
											last_login : +new Date(),
											venues : venues											
											};

										clearInterval(interval);
										businesses.findOneAndUpdate({"_id":user.id},venueUpdates,function(err,busi){
												if(err){
													callback(err)
												}
												if(busi){
													//sending current version
													console.log("checking version==========+============")
													var version = db.collection('version');
													console.log("platform==="+reqData.platform);
													exports.checkAccount(busi,'addDeal',function(flag){
														version.findOne({"type":"business","platform":reqData.platform},function(err,ver){																				
															if(err){
																callback(err);
															}
															else if(ver){
																var updatedBusi = busi;
																if(flag){
																	updatedBusi.account._type = "premium";
																}
																else{
																	updatedBusi.account._type = "free";
																}
																console.log("checking version==========+============1");																														
																callback({business: updatedBusi,version:ver.version_id,isPremium:flag});
															}
															else{
																console.log("checking version==========+============2");		
																callback({business: updatedBusi,version:0,isPremium:flag });
															}														
														});
													});														
													// check if the ua_token is new if it is new then store it we keep this 
													// async coz its not necessary on app side
													var deviceArrLen = busi.settings.devices.length;													
													var token_arr = [];
													var currentDevices = [];
													
													if(reqData.ua_token){
														_u.each(busi.settings.devices,function(devices){																											
															console.log(devices);
															//push tokens into array
															currentDevices.push(devices);
															token_arr.push(devices.ua_token);
															if(token_arr.length == deviceArrLen){
																console.log(token_arr);
																if(token_arr.indexOf(reqData.ua_token) < 0 )
																{
																	currentDevices.push({
																					    	"device_id":	reqData.deviceID || "Unknown",
																					    	"device_name": 	reqData.device_name || "Unknown", 
																					   		"ua_token":		reqData.ua_token || "Unknown"
																					    });
																	businesses.findOneAndUpdate({"_id":user.id},{$set:{"settings.devices":currentDevices}},function(err,busi){
																		if(err){
																			console.log(err);
																		}
																		else{
																			console.log("device added");
																		}																	
																	});
																	// if token is new added it to array and update the business collection
																	console.log("new token added");
																}
																else{
																	console.log("old token");
																}
															}														
														}); 
													} 
												}
												else{
													callback("notFoundToUpdate");
												} 
											});
									}
								},100);
							 	
						},function (error) {
								console.log("-> getManaged ERROR  " + JSON.stringify(error));
					});
			}
			else{
				// this is valid new user condition so we create new user
					FOURSQ.getManaged(reqData.accesstoken,function(data){
						console.log("getmanaged")
						var result = data.items;//JSON.stringify(data);
						var venues_ids = [];
						console.log("OUT====userinfo.deviceID : "+reqData.ua_token+"userinfo.device_name = "+reqData.device_name +"userinfo.ua_token = "+reqData.ua_token);
						if(result.length > 0 ){
							
								//console.log(result);
								for(i=0;i<result.length;i++){
									console.log("venues: "+JSON.stringify(result[i]));
									venues_ids.push({
														foursquare_id:result[i].id,
														name:result[i].name,
														location : result[i].location,														
														//hours:result[i].hours.timeframes
													});
									
								}
							}
								// if user does not exist create one
								
								var interval = setInterval(function(){
									var cnt = 0;
									for(i in venues_ids)
									{
										if(venues_ids.hasOwnProperty(i)) cnt++;
									}
									
									if(cnt == result.length)
									{
										clearInterval(interval);
										console.log("IN====userinfo.deviceID : "+reqData.ua_token+"userinfo.device_name = "+userinfo.device_name +"userinfo.ua_token = "+userinfo.ua_token);
										var user = new businesses({
														firstname: userinfo.firstName.toLocaleLowerCase(),
														lastname :userinfo.lastName.toLocaleLowerCase(),
														activated: true,
														email : userinfo.contact.email,
														phone: userinfo.contact.phone|| 0,
														username : userinfo.contact.email,
														password : String(Math.random()).replace("0.",""),
														foursquare_token : reqData.accesstoken,
														foursquare_uid : userinfo.id,
														venues : venues_ids,						
														settings: {
															version: reqData.version,
														    devices :[{
															    	"device_id":	reqData.deviceID || "Unknown",
															    	"device_name": 	reqData.device_name || "Unknown", 
															   		"ua_token":		reqData.ua_token || "Unknown"
															    }], 
														    status: {
														      number: 1,
														      friendly: "Active"
														    },
														    notifications: {
														      push: 1,
														      email: 1,
														      sms: 1,
														      alerts: 1,
														      reminder: {
														        number: 1,
														        friendly: "1 hours before"
														      }
														    }
													  }
													});
										//save user to database
										user.save(function (err) {
												var version = db.collection('version');
												console.log("platform==="+reqData.platform)
												version.findOne({"type":"business","platform":reqData.platform},function(err,ver){																				
													if(err){
														callback(err);
													}
													else if(ver){
														console.log("checking version==========+============1");																														
														callback({business: user,version:ver.version_id});
													}
													else{
														console.log("checking version==========+============2");		
														callback({business: user,version:0 });
													}														
												});	
										});	
										
									}
								},100);
							
						
					},function (error) {
						console.log("-> getManaged ERROR  " + JSON.stringify(error));
					});
				res = 'userNotFound'
				console.log('userNotFound');
				//return "userNotFound";
			}
			
		});

	}, function (error) {
		callback("inValidToken");
	});
	 
   }

 exports.getEventById = function (event_id,callback){
 	console.log('eventid='+ event_id);
 	var events = db.collection('events');

 	events.findById(event_id,function(err,event){
 		if(err){
 			console.log('err')
 			callback(err);
 		}
 		if(event){
 			var user = db.collection('user');
 			var resEvent = event; //make event globally accessable
 			//callback(resEvent.user_id);
 			
 			user.findById(resEvent.user_id,function(err,usr){
 				var eventdata = { 
	 							  id: resEvent.id,
								  end_time: resEvent.end_time,
								  name: resEvent.name ,
								  start_time: resEvent.start_time,
								  user_id: resEvent.user_id,
								  venue_id: resEvent.venue_id,
								  __v: resEvent.__v,
								  location: resEvent.location ,
								  date: resEvent.date,
								  status: resEvent.status,
								  duration: resEvent.duration,
								  client : {
								  			email:usr.email,
								  			first_name:usr.first_name,
								  			last_name:usr.last_name,
								  			middle_name:usr.middle_name,
								  			name : usr.name,
								  			link :usr.link,
								  			address : usr.settings.address,
								  			city: usr.settings.city,
								  			state:usr.settings.state,
								  			zip:usr.settings.zip,
								  			phone:usr.settings.phone,
								  			picture:usr.picture.data.url,
								  			gender:usr.gender
								  		}
							  } 				
 				console.log(eventdata);
 				callback(eventdata);
 			});
 			
 		}
 		else{
 			console.log("EventNotFound");
 			callback("EventNotFound");
 		}
 	});
 }

 // param : foursquare_token,event_id,number,friendly
 exports.updateEventStatus = function(data,callback){
 	console.log(data);
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
	 		businesses.findOne({foursquare_token:data.foursquare_token,foursquare_uid:fs_res.id},function(err,user){
		 	var events = db.collection('events');
		 	if(data.friendly == "Deleted"){
		 		var updateQuery = {$set:{"bstatus.number":data.number, "bstatus.friendly":data.friendly}};
		 	}
		 	else{
		 		var updateQuery = {$set:{"cstatus.number":data.number, "cstatus.friendly":data.friendly,"bstatus.number":data.number,"bstatus.friendly":data.friendly}};
		 	}
		    events.findOneAndUpdate({"_id": data.event_id },updateQuery, 
		    function (err, evt){
		      if(err){
		      	callback("ErrorUpdatingEvent");
		      }
		      else{
		      	if(data.friendly != "Deleted"){
	      			//send notificaiton to client 
	      			var cmsg = "Your requested appointment is " + data.friendly.toLowerCase() + " by "+evt.name +" which is scheduled on "+ evt.date.day+'/'+ evt.date.month+'/'+ evt.date.year+" at "+evt.start_time ;
 					exports.sendClientNotifications({id:evt.user_id,msg:cmsg },function(data){ 						
		 				console.log(data);
		 			});
		 			if(data.friendly == "Cancelled"){
		 					console.log("addactivity 1");
 							exports.addActivity(evt.user_id,evt.venue_id,'cancel-event',cmsg,4,"event",data.event_id);
 						}
 						else if(data.friendly == "Confirmed"){
 							console.log("addactivity 2");
 							exports.addActivity(evt.user_id,evt.venue_id,"confirm-event",cmsg,2,"event",data.event_id);
 						}		      	
		      	}
		      	callback('EventStatusUpdated');
		      }
		    });
		});
	});
 }

 exports.getEventsByVenueID = function(venue_id,callback){
 	console.log("diredt == "+venue_id)

 	var events		= db.collection('events');
 	var sendEvents	= new Array(); //create this array to add user_name
 	var EventUsers	= {};
 	var userFetched	= false; // to check if all user is fetched 
 	var ready		= false;
 	var main_events;
 	var cnt; // create global counter
	var user	= db.collection('user');
	var itr		= 0;
	
	events.find({venue_id:venue_id,"bstatus.friendly":{$ne:"Deleted"}},function(err,biz_event){
		if(err){
			callback(err);
		}
		// console.log("====biz_event=="+ biz_event.length);
		if(biz_event.length != 0){
		// console.log("====biz_event=="+ biz_event);	
		main_events = biz_event; // because biz_Event in not avaliable in side user.findOne
		
		_u.each(biz_event,function(e){
			console.log("====user_id==== " + e.user_id);
			
			user.findById(e.user_id, function(err,usr){
				console.log("====user_id  ==== " + e.user_id);
				console.log("==== biz event === " + usr);
				
				if(usr == null)
					var username = "Removed User";
				else
					username = usr.name;
				
				var newEventObj = { 
					  venue_id: e.venue_id,
					  name: e.name,
					  start_time:e.start_time,
					  end_time: e.end_time,
					  user_id: e.user_id,
					  user_name : username,
					  id: e.id,
					  __v: e.__v,
					  location: e.location,
					  date: e.date,
					  status: e.bstatus,
					  note: e.note,
					  duration: e.duration
			  	}
				
				sendEvents.push(newEventObj);
				if(sendEvents.length == biz_event.length){
					callback(sendEvents);
				}
			});
		});
	}
	else{
		console.log("====eventDoesNotExist")
		callback("eventDoesNotExist");
	}
	});	
 }

 exports.storeInvitation = function(data,callback){
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
	 	marketingStorage = db.collection('marketingStorage');
	 	marketingStorage.findOne({email:data.email},function(err,cust){
	 		if(err){
	 			callback(err);
	 		}
	 		else if(cust){
	 			callback("invitationAlreadySent");
	 		}
	 		else{
			 	var	new_cust = new marketingStorage({
							venue_id :data.venue_id,
							name : data.name,
							email : data.email,
							mobile : data.mobile,
							office : data.office,
							home : data.home,
							address: data.address,
							city : data.city,
							state : data.state,
							zip: data.zip 
						});
				new_cust.save(function (err,cust){
						 if(err){
						 	callback(err);
						 }
						 else{

						 	callback('success');	
						 }		
				});
	 		}
	 	});	
		businesses.findOne({foursquare_token:data.foursquare_token,foursquare_uid:fs_res.id},function(err,business){
			_u.each(business.venues,function(venue){
				if(venue.foursquare_id== data.venue_id){
					console.log("sending email");
			        var params = {
		                name    :  data.name,
		                email   :  data.email,
		                type    :  'customer-invitation',
		                subject :  'Walk-in Invitation',
		                text    :  'We would like to invite you to '+venue.name,
		                //name    :  business.firstname
		            };
					console.log(params);
					sendmail(params);
				}
			});
		});
	});
 }

 exports.addCustomer = function(data,callback){
 	var customer = db.collection('customer');
 	console.log("createCustomer");
 	customer.findOne({user_id:data.user_id,venue_id:data.venue_id},function(err,cust){
 		if(err){
 			callback(err);
 		}
 		else if(cust){
 			callback("customerExist");
 		}
 		else{
 			user = db.collection("user");
 			user.findById(data.user_id,function(err,usr){
 				if(err){
 					callback(err);
 				}
 				else if(usr){
					var	new_cust = new customer({
						venue_id :data.venue_id,
						user_id : data.user_id
					});
					new_cust.save(function (err,cust){
							 if(err){
							 	callback(err);
							 }
							 else{
							 	callback('success');	
							 }		
					});
 				}
 				else{
					callback("userDoesNotExist");
				}
 			});
 		}
 	});	
 }
/*
 exports.editCustomer = function(data,callback){
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
	 	businesses.findOne({foursquare_token:data.foursquare_token,foursquare_uid:fs_res.id},function(err,user){
	 	 	var customer = db.collection('customer');
		 	console.log("editCustomer");
		 	var params = {
						venue_id :data.venue_id,
						name : data.name,
						email : data.email,
						mobile : data.mobile,
						office : data.office,
						home : data.home,
						address: data.address,
						city : data.city,
						state : data.state,
						zip: data.zip 
					}
		 	customer.findOneAndUpdate({"_id":data.id},params,function(err,cust){
		 		if(err){
		 			callback(err);
		 		}
		 		else{
		 			callback(cust);
		 		}
		 	});
		});
	});
 } */
// delete customer 
 exports.delCustomer = function(data,callback){
	 FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
	 	businesses.findOne({foursquare_token:data.foursquare_token,foursquare_uid:fs_res.id},function(err,user){
	 	 	var customer = db.collection('customer');
			customer.findOneAndRemove({"venue_id":data.venue_id,"user_id":data.id},function(err,cust){
				if(cust){
					callback('success');
				}
				else{
					callback('userNotFound');
				} 		
			});
		});
	});
 }

 exports.getCustomersByVenueId = function(data,callback){	 
	 	var customer = db.collection('customer');
		customer.find({"venue_id":data.venue_id},function(err,customers){
			if(err){
				callback('success');
			}
			else if(customers.length > 0){
				console.log("customers =====>"+customers.length)
				console.log(customers);
				var user = db.collection('user');
				var userList = [];
				// fetch all the user who are customers
				async.forEach(customers, function(e,done){
	        			 user.findById(e.user_id,function(err,usr){
								if(err){
									console.log(err);
									done();
								}
								if(usr){
									userList.push(usr);
									// on fetching all the users call the callback
									done();
								}
								else{
									done();
								}						
							});

	        		}, function(err) {
							    callback(userList);
							});	


			}
			else{
				callback('customerNotFound');
			} 		
		});
 }

 exports.addEmployee = function(data,callback){
 	var employee = db.collection('employees');
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			if(err){
 				callback(err);
 			}
 			if(business){
			 	employee.findOne({businesses_id:business.id,venue_id:data.venue_id,email:data.email},function(err,employees){
			 		if(err){
			 			callback(err);
			 		}
			 		else if(employees){
			 			callback("employeeExist");
			 		}
			 		else{
			 			var new_emp = new employee({
														businesses_id : business.id,
														venue_id :data.venue_id,
														name : data.name,
														email : data.email,
														phone : data.phone,
														working_hours : []
													});
						//save user to database
						new_emp.save(function (err,usr){
						 		if(err){
						 			callback("error");
						 		}
						 		else{
						 			callback(usr.id);
						 		}									
						});	
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }


 exports.editEmployee = function(data,callback){
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var employee = db.collection('employees');
 				var emp_update = {
 					businesses_id : business.id,
					venue_id :data.venue_id,
					name : data.name,
					email : data.email,
					phone : data.phone,
					working_hours : []
 				}
 				
			 	employee.findOneAndUpdate({'_id':data.id},emp_update,function(err,emp){
			 		if(err){
			 			callback(err);
			 		}
			 		else if(emp){
			 			callback("success");
			 		}
			 		else{
			 			callback("employeeDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

  exports.delEmployee = function(data,callback){
 	
 	console.log("addEmployee1");
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var employee = db.collection('employees');
 				console.log('emp_del');
			 	employee.findOneAndRemove({'_id':data.id},function(err,emp){
			 		if(err){
			 			callback(err);
			 		}
			 		else if(emp){
			 			callback("success");
			 		}
			 		else{
			 			callback("employeeDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

  exports.getEmployee = function(data,callback){
	 var employee = db.collection("employees")
	 employee.find({venue_id:data.venue_id},function(err,emps){
		console.log("==>>>>>");
				if(err){
					callback(err);
				}
				else if(emps){
					callback(emps);
				}
				else{
					callback("employeeDoesNotExist");
				}
	});
 }

   exports.getDeal = function(data,callback){
 	console.log("getDeal");
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var deal = db.collection('deal');
			 	deal.find({venue_id:data.venue_id,"status":{$ne:"Deleted"}},function(err,deals){
			 		console.log("==>>>>>");
			 		console.log(deals);
			 		if(err){
			 			callback(err);
			 		}
			 		else if(deals){
			 			// check if premium
			 			exports.checkAccount(business,'addDeal',function(flag){
			 				deal.count({venue_id:data.venue_id},function(err,dealCount){
			 					callback({deals:deals,count:dealCount,isPremium:flag});
			 				});
			 			});			 			
			 		}
			 		else{
			 			callback("dealDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}
 		}); 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

 exports.addDeal = function(data,callback){
 	var deal = db.collection('deal');
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
		FOURSQ.getVenue(data.venue_id, data.foursquare_token, function (venue) {
 				console.log(venue)
		 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
		 			if(err){
		 				callback(err);
		 			}
		 			if(business){		 			
						console.log("adding Deal")		
						var new_deal = new deal({
											venue_id 		: data.venue_id,
											venue_name 		: data.venue_name,
											venue_location 	: data.venue_location,
											title 			: data.title,
											start_date 		: data.start_date,
											end_date 		: data.end_date,
											deal 			: data.deal,
											deal_type 		: data.deal_type,
											description 	: data.description,
											image 			: data.image,
											use_logo 		: data.use_logo,
											category		: {id:venue.categories[0].id, name:venue.categories[0].name } 
										});
						//save user to database
						new_deal.save(function (err,deal){
							if(err){
								console.log(err);
								callback("error");
							}
							else{
								console.log("added Deal")		
								callback(deal.id);
							}									
						});		 					
				 	}
				 	else{
				 		callback("inValidBusinessesId");
				 	}
		 		});
		}, function (error) {
			console.log("->getVenue ERROR");
			callback(error);
		});
 		// verify the bussiness if it belongs to proper request 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

// data is object that dependes on service_name 
 exports.checkAccount = function (business,service_name,callback){
 	if(business.account._type == "premium"){
 		var business_account = db.collection("business_account");
 		business_account.findOne({business_id:business._id},function(err,ba){
 			if(err){
 				console.log(err);
 				callback(false);
 			}
 			if(ba){
	 			// if the receipt is expired then check for new receipt
	 			if(ba.expires_date < +new Date()){
	 				data = {
	 					receipt 		 : business_account.latest_receipt,
	 					foursquare_token : business.foursquare_token
	 				};
	 				// flag will return true if subscription is renewed other wise false.
	 				exports.verifyPurchase(data,function(flag){
	 					callback(flag);
	 				});
	 			}
	 			else{
					callback(true);
	 			}
 			}
 			else{
 				console.log("business_account not found");
 				callback(false);
 			}
 		}); 		
 	}
 	else{
		callback(false)
 	}
 }

  exports.editDeal = function(data,callback){
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var deal = db.collection('deal');
 				var updateDeal = {
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
 				
			 	deal.findOneAndUpdate({'_id':data.id},updateDeal,function(err,emp){
			 		if(err){
			 			callback(err);
			 		}
			 		else if(emp){
			 			callback("success");
			 		}
			 		else{
			 			callback("dealDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

exports.deleteDeal = function(data,callback){
 	
 	console.log("addEmployee1");
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var deal = db.collection('deal');
 				console.log('emp_del');
			 	deal.findOneAndUpdate({'_id':data.id},{"status":"Deleted"},function(err,emp){
			 		if(err){
			 			callback(err);
			 		}
			 		else if(emp){
			 			callback("success");
			 		}
			 		else{
			 			callback("employeeDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

 exports.addServices = function(data,callback){
 	
 	console.log("addservices");
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			console.log("addservices1");
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var services = db.collection('services');
			 	services.findOne({businesses_id:business.id,venue_id:data.venue_id,name:data.name},function(err,service){
			 		console.log("addservices2");
			 		console.log(service);
			 		if(err){
			 			callback(err);
			 		}
			 		else if(service){
			 			callback("serviceExist");
			 		}
			 		else{
			 			var new_service = new services({
														businesses_id : business.id,
														venue_id :data.venue_id,
														name : data.name,
														duration : data.duration,
														segment : [],
														price : data.price,
													});
						//save user to database
						new_service.save(function (err,new_data){
								if(err){					
								callback(err);
								}
								else{
									callback("success");
								}		
						});	
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

  exports.editService = function(data,callback){
 	
 	console.log("addservices");
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			console.log("addservices1");
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var services = db.collection('services');
	 			var update_service = {
						businesses_id : business.id,
						venue_id :data.venue_id,
						name : data.name,
						duration : data.duration,
						segment : [],
						price : data.price,
					};
			 	services.findOneAndUpdate({"_id":data.id},update_service,function(err,service){
			 		console.log("addservices2");
			 		console.log(service);
			 		if(err){
			 			callback(err);
			 		}
			 		else if(service){
			 			callback("success");
			 		}
			 		else{
			 			callback("serviceDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }

  exports.delService = function(data,callback){
 	// verify the token with foursquare
 	FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			console.log("addservices1");
 			if(err){
 				callback(err);
 			}
 			if(business){
 				var services = db.collection('services');
			 	services.findOneAndRemove({"_id":data.id},function(err,service){
			 		console.log("addservices2");
			 		console.log(service);
			 		if(err){
			 			callback(err);
			 		}
			 		else if(service){
			 			callback("success");
			 		}
			 		else{
			 			callback("serviceDoesNotExist");
			 		}
			 	});
		 	}
		 	else{
		 		callback("inValidBusinessesId");
		 	}

 		});
 
	 },function (error) {
		console.log("addEmployee2");
 		callback(error);
	});
 }



exports.getServices = function(data,callback){
	// verify the bussiness if it belongs to proper request
	var services = db.collection('services');
	console.log('emp_del');
	services.find({venue_id:data.venue_id},function(err,serArr){
		if(err){
			callback(err);
		}
		else if(serArr){
			callback(serArr);
		}
		else{
			callback("ServiceDoesNotExist");
		}
	});
 }
 //example request
 //{"end_time":"11:30AM","note":"Hi this is a note.","duration":{"number":60,"friendly":"1 hr"},"location":{"city":"Dallas","state":"TX"},"start_time":"10:30AM","venue_id":"50ba71a2c84cde0c2ac4d020","service_id":"0","employee_id":"0","token":"BAADbL7sfo4cBAIub4bpMviz9T9BsoPBE2DEqjpIbE0wXSbaBhBwXHvlSoZAsurBso4kvsYNwYiMQJ03hy9HRcx0puvZClnUSmVIGphMUmi1iE5ZAiPWIFiQ7ZBwQkTEZD","name":"decimalplus","date":{"month":"05","time":"1030","year":"2013","day":"16"},"status":{"number":0,"friendly":"Pending"}}
 exports.addEvent = function(data,callback){
 	console.log(data);
 	FOURSQ.getUser("self",data.token, function (fs_res) {
 		  console.log('ere');
	 		businesses.findOne({foursquare_token:data.token,foursquare_uid:fs_res.id},function(err,user){
 				FOURSQ.getVenue(data.venue_id, data.token , function (venue){
				 	var events = db.collection('events');
				 	
				 	var new_event = new events({
				 		name:data.name,
				 		date : data.date,
				 		duration : data.duration,
				 		start_time:data.start_time,
				 		end_time : data.end_time,
				 		cstatus : data.status,
				 		bstatus : data.status,
				 		venue_id : data.venue_id,
				 		note : data.note,
				 		user_id : data.user_id,
				 		venue_location : venue.location,
				 		location : { city : data.location.city,state : data.location.state },
				 		employee_id : data.employee_id,
				 		service_id : data.service_id
				 	});
				 	new_event.save(function(err,evt){
				 		console.log(evt);
				 		if(err){
				 			callback(err);
				 		}
				 		else{
				 			console.log("event added");
				 			_u.each(user.venues,function(venue){
				 				if(venue.foursquare_id == data.venue_id){
					 				//send notificaiton to client 
					 				var cmsg = venue.name +" scheduled your next appointment on "+evt.date.day+"/"+evt.date.month+"/"+evt.date.year+" at "+evt.start_time ;
						 			exports.sendClientNotifications({id:data.user_id,msg:cmsg },function(data){
						 				console.log(data);
						 				console.log("notifications sent====");						 				
						 			});
						 			exports.addActivity(evt.user_id,evt.venue_id,"confirm-event",cmsg,2,"event",evt._id);
					 			}
				 			});				 			
				 			callback("success");
				 		}		 		
				 	});
 				},function(err){
					callback(err);
 				});		
		});
	});
 }

 exports.setSetting = function(data,callback){
 	console.log(data);
 	FOURSQ.getUser("self",data.token, function (fs_res) {
 		/*
 		"status": {
	      "number": 1,
	      "friendly": "Active"
	    },
	    "notifications": {
	      "push": 1,
	      "email": 1,
	      "sms": 0,
	      "alerts": 1,
	      "reminder": {
	        "number": 1,
	        "friendly": "1 hours before"
	      }
 		*/
	 	businesses.findOneAndUpdate({foursquare_uid:fs_res.id},{$set:{"settings.notifications": data.notifications}},function(err,user){
		 	if(err){
		 		callback(err);
		 	}
		 	else if(user){
		 		callback("success");
		 	}
		 	else{
		 		callback("businessesNotFound");
		 	}
		});
	});
 }
 exports.getSetting = function(data,callback){
 	console.log(data);
 	FOURSQ.getUser("self",data.token, function (fs_res) {
	 	businesses.findOne({foursquare_uid:fs_res.id},function(err,user){
		 	if(err){
		 		callback(err);
		 	}
		 	else if(user){
		 		// check if premium
	 			exports.checkAccount(user,'addDeal',function(flag){
	 					var updatedUser = {};
						updatedUser.settings = user.settings;
						updatedUser.isPremium = flag
	 					callback(updatedUser);	 				
	 			});	
		 		
		 	}
		 	else{
		 		callback("businessesNotFound");
		 	}
		});
	});
 }


 exports.activateUser = function(data,callback){
 	console.log(data);
 	FOURSQ.getUser("self",data.token, function (fs_res) {
 		/*
 		"status": {
				number: 1, friendly:"Active"
	    }	
 		*/
	 	businesses.findOneAndUpdate({foursquare_uid:fs_res.id},{$set:{"settings.status": {number: 1, friendly:"Active"}}},function(err,user){
		 	if(err){
		 		callback(err);
		 	}
		 	else if(user){
		 		callback("success");
		 	}
		 	else{
		 		callback("businessesNotFound");
		 	}
		});
	});
 }

  exports.deactivateUser = function(data,callback){
 	console.log(data);
 	FOURSQ.getUser("self",data.token, function (fs_res) {
 		/*
 		"status": {number: -1,friendly:"Deactive"
	    },
		*/
	 	businesses.findOneAndUpdate({foursquare_uid:fs_res.id},{$set:{"settings.status": {number: -1, friendly:"Deactive"}}},function(err,user){
		 	if(err){
		 		callback(err);
		 	}
		 	else if(user){
		 		callback("success");
		 	}
		 	else{
		 		callback("businessesNotFound");
		 	}
		});
	});
 }

 exports.updateVenueByID = function(data,callback){
 		FOURSQ.getVenue(data.venue_id, data.accesstoken, function (venue) {
 			businesses.findOne({"_id":data.business_id},function(err,biz){
 				if(biz){
	 				//console.log(biz);
	 				var venues = biz.venues;
	 				var newVenues = new Array();
	 				for(i=0;i<venues.length;i++){
	 					if(venues[i].foursquare_id==venue.id){
	 						console.log("venue.hours===========>"+typeof(venue.hours.timeframes)+venue.hours.timeframes.length);
	 						console.log(venue.hours.timeframes);
	 						//console.log(JSON.parse(JSON.stringify(venue.hours.timeframes)));
	 						//venues[i].hours = JSON.parse(JSON.stringify(venue.hours));//JSON.parse(venue.hours.timeframes);
	 						venues[i].hours = [];
	 						for(j=0;j<venue.hours.timeframes.length;j++){
	 							var timeSlot = { 
	 												days: venue.hours.timeframes[j].days,
											    	open:venue.hours.timeframes[j].open,
											    	segments:venue.hours.timeframes[j].segments
	 											}; //JSON.parse(JSON.stringify(venue.hours));
	 							
	 							//console.log(timeSlot);
	 							venues[i].hours.push(timeSlot);
	 							if(j==(venue.hours.timeframes.length-1)){
	 								console.log("venue.hours<<==========");								
	 								newVenues.push(venues[i]);
	 							}
	 						}
	 					}
	 					else{
	 						newVenues.push(venues[i]);
	 					}
	 					//update business on last iter
	 					if(i==(venues.length-1)){
	 						businesses.findOneAndUpdate({"_id":data.business_id},{$set: {venues:newVenues}},function(err,_biz){
	 							if(err){
	 								callback(err);
	 							}	
	 							else if(_biz){
	 								callback(venue.hours.timeframes);
	 							}
	 							else{
	 								callback("error");
	 							}	
	 						});		
	 					}
	 				}
 				}
 				else{
 					callback("businessNotFound");
 				} 				
 			});	
	}, function (error) {
		console.log("->getVenue ERROR");
	});
 }

//token , venue_id, day, month, year
//getAvailableHoursByDay
 exports.getHoursByDay = function(data,callback){
 	FOURSQ.getUser("self",data.accesstoken, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			console.log("====>getHoursByDay");
 			var events = new db.collection('events');
 			events.find({ "venue_id": data.venue_id, "bstatus.friendly": "Confirmed", "date.month": data.month, "date.day":data.day,"date.year":data.year},{"_id":0, "date.time":1}, function (err, data){
						
 						if(err){
 							callback("error");
 						}
 						else if(data){
 							callback(data);
 						}
 						else{
 							callback("error");
 						}
					}); 
 		});
 	});
 }

exports.userfeedback = function(data,callback){
 	FOURSQ.getUser("self",data.accesstoken, function (fs_res) {
 		// verify the bussiness if it belongs to proper request
 		businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
 			var newfeedback = new db.collection("businessfeedback")
			if(!err && business != null) {
					var fback = {
						foursquare_uid : fs_res.id, // this is forsquare id for business app
						name: 		fs_res.firstName+" "+fs_res.lastName,
						email:		fs_res.contact.email,
						content:	data.content
					};

					newfeedback(fback).save(function(err,feed){
						console.log("sending email");
						var params = {
							user_name  : fs_res.firstName+" "+fs_res.lastName,
							user_email : fs_res.contact.email,
							name       : business.firstname,
							email      : 'info@decimalplus.com',//business.email,
							type       : 'feedback',
							subject    : 'Walk-in business feedback',
							text       : 'feedback form : '+fs_res.firstName,
							content   :  data.content
						};
						console.log(params);
						sendmail(params);					
						callback('success');
					});
			}else{
					callback('businessNotFound');
			}
		});
	});
}

exports.followVenue = function(data,callback){
	// check if user is already folloing
	var follow = new db.collection("follow");
	follow.findOne({user_id  : data.user_id,venue_id : data.venue_id},function(err,ufollow){
		if(ufollow){
			callback("alreadyFollowing");
		}else{
			var newFollow = new follow({
				user_id  : data.user_id,
				venue_id : data.venue_id
			});
			newFollow.save(function(err,ufollow){
				if(err){
					console.log(err);
					callback("error"); 
				}
				else{
					callback("success");
				}
			});
		}
	});
}

exports.unfollowVenue = function(data,callback){
	var follow = new db.collection("follow");
	follow.findOneAndRemove({user_id:data.user_id,venue_id:data.venue_id}, function(err,ufollow){
		if(err){callback("error");}
		else{
			callback("success");
		}	
	});
}

exports.getDealsByLatLng = function(data,callback){
	var deals = new db.collection("deal");
	if(data.category_id != 0 && data.category_id != undefined && data.category_id != null){
		var query = { 'venue_location' : { $nearSphere : { $geometry : { $center : [[data.lng,data.lat],'100']}},'category.id':data.category_id,"status":"Confirmed"}}
		
	}
	else{
		var query = { 'venue_location' : { $nearSphere : { $geometry : { $center : [[data.lng,data.lat],'100']} } },"status":"Confirmed" }
	}
	deals.find(query, function(err,deals){
		if(err){callback(err);}
		else{
			callback(deals);
		}	
	});
}

exports.getDealById = function(data,callback){
	var deals = new db.collection("deal");
	deals.findById(data.id, function(err,deal){
		if(err){callback(err);}
		else{
			FoursquareVenue.getVenue(deal, function (err,res) {
				console.log(res.response);
				venue = res.response.venue;
				var dist = distance(data.lat,data.lng,venue.location.lat,venue.location.lng,'M');
				var resDeal = {deal:deal,address:venue.location,distance:dist};
				callback(resDeal);
				console.log("here");
			});
		}	
	});
}


 ///////// code for push notification

var urban		= require("urban-airship");

// E-mail Sender & Templates

var path           = require('path')
  , templatesDir   = path.resolve(__dirname,'../email-templates')
  , emailTemplates = require('email-templates')
  , nodemailer     = require('nodemailer');


// UrbanAirship Authentication
var ua = new urban("5nekYd-lTtGxNr8JFhIFeg", "cQeyX_fmTIKOMJgHGXbhvA", "qtJmFqu9SE6PvO31-15NXw");
// UrbanAirship Authentication
var ua_client = new urban("Ivz89NuvROmem8i91kx3pA", "67jMgcNYTFeMUsLz2gw86g", "UtXgZxSkTV6fnne8_Mchtw");

//msg , business_id
exports.sendBusinessNotifications = function(data,callback) {
	var ua_message = data.msg;
	var businesses = db.collection("businesses");
	console.log("ua_msg: "+ua_message+", bid : "+data.business_id);
	businesses.findById(data.business_id,function(err,business){
		if(err){
			callback("error");
		}
		if(business){
			callback("success");
			var email = business.settings.notifications.email;
			var sms = business.settings.notifications.sms;
			var alerts = business.settings.notifications.alerts;
			console.log(email+"==="+sms+"==="+alerts);
			if(email == 1){
				console.log("sending email");
		        var params = {
	                //name:   business.firstname,
	                email:  business.email,
	                type:   'welcome-appointment',
	                subject:'Walk-in Notification',
	                text: data.msg,
	                name : business.firstname.titleize()
	            };
				console.log(params);
				sendmail(params);
			}
			if(sms == 1){
			console.log("sending sms");
			var request = require('request');//burak: 2144789458
			request('http://walkihq.com/sms.php?token=3c87272a0e549ff5fe2ebaee4b942342&no='+business.phone+'&msg='+ua_message, function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			  	console.log("Sms sent");
			    console.log(body); // Print the google web page.
			  }
			  console.log("sms respone="+response.statusCode);
			});
			}	
			if(alerts == 1){
				_u.each(business.settings.devices,function(device){
					send_push(device.ua_token, ua_message);
				});			
			}
	    }
	    else{
	    	callback("notfound")
	    }
	});
	
	return true;
}

//msg , business_id
exports.sendBusinessPush = function(data,callback) {
	var ua_message = data.msg;
	var businesses = db.collection("businesses");
	console.log("ua_msg: "+ua_message+", bid : "+data.business_id);
	businesses.findById(data.business_id,function(err,business){
		if(err){
			callback("error");
		}
		if(business){
			callback("success");
			var alerts = business.settings.notifications.alerts;
			if(alerts == 1){
				_u.each(business.settings.devices,function(device){
					send_push(device.ua_token, ua_message);
				});			
			}
	    }
	    else{
	    	callback("notfound")
	    }
	});
	
	return true;
}

// id,msg
exports.sendClientNotifications = function(data,callback) {
	var ua_message = data.msg;
	var users = db.collection("user");
	console.log("ua_msg: "+ua_message+", uid : "+data.id);
	users.findById(data.id,function(err,user){
		console.log(user);
		if(err){
			callback("error");
		}
		if(user){
			callback("success");
			var email = user.settings.notifications.email;
			var sms = user.settings.notifications.sms;
			var alerts = user.settings.notifications.alerts;
			console.log(email+'=:='+sms+'=:='+alerts);
			if(email == 1){
		        var params = {
	                //name:   user.firstname,
	                email:  user.settings.email,
	                type:   'welcome-appointment',
	                subject:'Walk-in Notification',
	                text: data.msg,
	                name : user.name.titleize()
	            };
				console.log(params);
				sendmail(params);
			}
			if(sms == 1){
			var request = require('request');//burak: 2144789458
			console.log('phone number :==='+user.settings.phone);
			request('http://walkihq.com/sms.php?token=3c87272a0e549ff5fe2ebaee4b942342&no='+user.settings.phone+'&msg='+ua_message, function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			    console.log(body); // Print the google web page.
			  }
			});
			}	
			if(alerts == 1){
				console.log("sending Push notifications")
				_u.each(user.settings.devices,function(device){
					console.log("sending Push notifications to:"+device.ua_token);
					send_push_to_client(device.ua_token, ua_message);
				});			
			}
	    }
	    else{
	    	callback("notfound")
	    }
	});
	return true;
}

// id,msg
exports.sendClientPush = function(data,callback) {
	var ua_message = data.msg;
	var users = db.collection("user");
	console.log("ua_msg: "+ua_message+", uid : "+data.id);
	users.findById(data.id,function(err,user){
		console.log(user);
		if(err){
			callback("error");
		}
		if(user){
			callback("success");
			var alerts = user.settings.notifications.alerts;
			if(alerts == 1){
				console.log("sending Push notifications")
				_u.each(user.settings.devices,function(device){
					console.log("sending Push notifications to:"+device.ua_token);
					send_push_to_client(device.ua_token, ua_message);
				});			
			}
	    }
	    else{
	    	callback("notfound")
	    }
	});
	return true;
}

function sendmail(params) {

	emailTemplates(templatesDir, function(err, template) {
	    if (!err) {

		    var transport = nodemailer.createTransport("SMTP", {
		      service: "Gmail",
		      auth: {
		        user: "noreply.walki.notifications@gmail.com",
		        pass: "Qwe123!@#"
		      }
		    });

			console.log("E-mail is sending to:" + params.email);

		    // Send a single email
		    template(params.type, params, function(err, html, text) {
		      if (err) {
		        console.log(err);
		      } else {
		        transport.sendMail({
		          from:		'Walk-in Appointment Scheduler <team@walkihq.com>',
		          to:		params.email,
		          subject:	params.subject,
		          html:		html,
		          text:		params.text,
		          //text:		params.name,
		        }, function(err, responseStatus) {
		          if (err) {
		            console.log(err);
		          } else {
		            console.log(responseStatus.message);
		          }
		        });
		      }
		    });
		} else {
			console.log(err);
	    }
	});
}

/* Send Push Notification to device_tokens array */
function send_push(device_tokens, msg){
	var payload = {
	    "device_tokens": device_tokens,
	    "aps": {
	        "alert": msg,
	        "badge": 0,
	        "sound": 1
	    }
	};

	ua.pushNotification("/api/push", payload, function(error) {
		if(!error)
			console.log("Push notification sent.");
		else
			console.log(error);
	});
}

/* Send Push Notification to device_tokens array */
function send_push_to_client(device_tokens, msg){
	var payload = {
	    "device_tokens": device_tokens,
	    "aps": {
	        "alert": msg,
	        "badge": 0,
	        "sound": 1
	    }
	};

	ua_client.pushNotification("/api/push", payload, function(error) {
		if(!error)
			console.log("Push notification sent.");
		else
			console.log(error);
	});
}

exports.verifyPurchase = function(data,callback){
	var request = require('request');//burak: 2144789458
	request({
	  uri: "https://sandbox.itunes.apple.com/verifyReceipt",
	  method: "POST",
	  json: {
	    "receipt-data" : data.receipt, //new Buffer(data.receipt).toString('base64'),
	    //"password" :"1e2403797ef442cc92e48d983474b924"
	    "password" :"01a3a704764249cf9f92cc44aa91b4f8"
	  }
	},function(error, response, body) {
		if(error){
			console.log("===========> error !")
			console.log(error);
	  		callback("error");
		}
		else{
			console.log("===========> got it")
			console.log(body);
	 		FOURSQ.getUser("self",data.foursquare_token, function (fs_res) {
	 			console.log("===============fs_res");
	 			console.log(fs_res);
	 			businesses.findOne({foursquare_uid:fs_res.id},function(err,business){
						var business_account = db.collection("business_account");
						//check if the transaction is first transaction
						business_account.findOne({business_id:business._id},function(err,account){
							if(body.status == 0){
							
								console.log("===============status:00000000000");

											//////////////////////////////////////////////////////////////////////////
											if(err){
												callback(err);
											}
											// if transaction 
											else if(account){
												var reciptArr = account.verified_receipts;
												reciptArr.push(body.latest_receipt_info);								
												
												account.expires_date 			= body.latest_receipt_info.expires_date;
												account.transaction_id 			= body.latest_receipt_info.transaction_id;
												account.original_purchase_date 	= body.latest_receipt_info.original_purchase_date;
												account.purchase_date 			= body.latest_receipt_info.purchase_date;
												account.verified_receipts		= reciptArr;
												account.latest_receipt          = body.latest_receipt;
												account.save();
												businesses.findByIdAndUpdate(business._id,{"account._type":"premium"},function(err,busi){
													if(err){
														console.log(err)
													}
													else{
														console.log("Updated!!!");
													}	
												});
												console.log("renewed ======================================");
												callback(true);
											}else{
												// if first transaction save it
												var new_transaction = new business_account({
													business_id : business._id,
													expires_date			: body.latest_receipt_info.expires_date,
													transaction_id 			: body.latest_receipt_info.transaction_id,
													original_purchase_date 	: body.latest_receipt_info.original_purchase_date,
													purchase_date 			: body.latest_receipt_info.purchase_date,
													verified_receipts		: [body.latest_receipt_info],	  //store last valid receipts
													original_receipt		: body.receipt,  //base64 encoded receipt to fetch latest recept 
													latest_receipt     		: body.latest_receipt
												});
												new_transaction.save();
												console.log("new purchase ======================================");												
												businesses.findByIdAndUpdate(business._id,{"account._type":"premium"},function(err,busi){
													if(err){
														console.log(err)
													}
													else{
														console.log("Updated!!!");
													}	
												});
												callback(true);
												
											}
											/////////////////////////////////////////////////////////////////////////		
							}
							else{
								callback(false);
								business.account._type = "free";
								business.save();
								/*
								request({
								  uri: "https://sandbox.itunes.apple.com/verifyReceipt",
								  method: "POST",
								  json: {
								    "receipt-data" : data.receipt, //new Buffer(data.receipt).toString('base64'),
								    "password" :"1e2403797ef442cc92e48d983474b924"
								  }
								},function(error, response, body) {

								}); */
							}
						});
		 			});
		 		});
	  	}
	});		
}

  /* Functions */
  //function addActivity(token, interWith_id, _type, _friendly, _trigger)
  exports.addActivity = function(id, interWith_id, _type, _friendly,activity_number,_trigger,event_id){
    //var graph = new facebook.GraphAPI(token);
    //graph.getObject('me', {'fields' : 'id, installed'}, function(error, fbdata) {
    	console.log("=====addActivity");
      var activity  =   db.collection("activities");
      var timezone 	= new Date().getUTCOffset();
      var date   	= Date.create().format('{yyyy}-{MM}-{dd}');
      var time  	= Date.create().format('{hh}:{mm}:{ss}');

      var tempevent = {
        user_id: id,
        interWith_id: interWith_id,
        date: date + ' '  + time + ' ' + timezone,
        details:
        {
          activity_type:  _type,
          activity_number: activity_number,
          event_id :  event_id,
          friendly: _friendly,
          trigger:  _trigger
        }
      };
      var saveuser = new activity(tempevent).save(function(err){
      	  console.log("activity saved====");
          return true;
      }); 
  }



//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two locations using GeoDataSource (TM) prodducts  :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles                                   :::
//:::                  'K' is kilometers (default)                            :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  Worldwide cities and other features databases with latitude longitude  :::
//:::  are available at http://www.geodatasource.com                          :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@geodatasource.com                  :::
//:::                                                                         :::
//:::  Official Web site: http://www.geodatasource.com                        :::
//:::                                                                         :::
//:::               GeoDataSource.com (C) All Rights Reserved 2013            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var radlon1 = Math.PI * lon1/180
	var radlon2 = Math.PI * lon2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}                                                                           
