var db = require('../models/schema');
var model = require('../models/functions');   // these are the function on database

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.login = function(req, res){
  if(req.method == "POST"){
  	var user = {
  		uname : req.body.username,
  		pass  : req.body.password
  	}
  	model.authorize(user);
  }
  else{
  	res.render("login");
  }
};

exports.create = function(req, res){
  
  	var user = {
  		uname : "admin",
  		pass  : "123admin!@#"
  	}
  	return model.create(user);
  	res.send("done");
};