var db = require('../models/schema');

var businesses = db.collection('businesses');

exports.signup = function(req,res){
	var errors = null
	if(req.method == 'POST'){
			req.assert('name','Name Required').notEmpty();
			req.assert('username','Username Required').notEmpty();
			req.assert('email','Email Required').notEmpty().isEmail();
			req.assert('password','Password Required').notEmpty();
			req.assert('cpassword','Confirm password Required').notEmpty();
			
			errors = req.validationErrors(true);
			if(errors){
				//res.send(errors);
				res.render('signup', { title: 'walki Admin',errors : errors});
			}
			else{
				var name = req.body.name;
				var uname = req.body.username;
				var email = req.body.email;
				var password = req.body.password;
				var cpassword = req.body.cpassword;
				if(password == cpassword){
					var query = businesses.findOne({ email: email });
					query.exec(function(err,user){
						if (err) return handleError(err);
						if(user){
							 //Set session
							 req.session.logerr = "User Exist !"
				   			 res.redirect('/');
						}
						else{
							// create hash password
							crypto = require('crypto');
							var sha1 = crypto.createHash('sha1');
							sha1.update(password);
							 //Set session
							var user = new businesses({ 
									name: name,
									activated: true,
									email : email,
									username : uname,
									password : sha1.digest('hex')
									});
							//save user to database
							user.save(function (err) {
						  					req.session.user = user;
											req.session.loginType = 'direct';
											res.redirect('/home');
							});
						}
					});
				}
				else{
					
		   			 res.render('signup', { title: 'walki Admin',confirmPass : false});
				}
			}
	}
	else{
		res.render('signup', { title: 'walki Admin',errors:errors});
 	}
}