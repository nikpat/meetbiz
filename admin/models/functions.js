var db = require("./schema");
var admin = db.collection('admin');

exports.authorize = function(user){
	admin.findOne({username:user.uname,password:user.pass},function(err,adminObj){
		if(err){
			return err;
		}
		else if(adminObj){
			return adminObj;
		}
		else{
			return "NotFound";
		}
	});
}

exports.create = function(user){
	var user = new admin({
		username : user.uname,
		password : user.pass
	});
	user.save(function(err,usr){
		if(err){
			return err;
		}
		else if(usr){
			return usr;
		}
		else{
			return "Not Found";
		}
	});
}