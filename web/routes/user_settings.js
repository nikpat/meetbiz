//import db
var db = require('../models/schema');
//var dbfunction = require('../models/functions');   // these are the function on database

exports.edit_notification = function(req,res){
	if(req.method == 'POST'){
		var type = req.body.type;
		var action = Number(req.body.action);
		var updateData;
		var businesses = db.collection("businesses");
		console.log(req.session.user._id);
		//var query = "settings.notifications."+type;
		//updateData = {query :action}; 
		
		if(type == "alert"){
			updateData = {"settings.notifications.sms":action};
		}
		else if(type == "push"){
			updateData = {"settings.notifications.push":action};
		}
		else if(type == "email"){
			updateData = {"settings.notifications.email":action};
		}
		console.log(updateData);
		console.log(req.session.user._id);
		businesses.findOneAndUpdate({ '_id':req.session.user._id },{$set:updateData},function(err,business){
			if(err){
				res.send(err);
			}
			else if(business){
				res.send("success");
			}
			else{
				res.send("NotFound");
			}
		});
	}
	else{
		res.send('hello');
	}	
}