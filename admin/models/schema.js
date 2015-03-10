// define schemas and database connection

var mongoose = require('mongoose');

//for development
mongoose.connect('mongodb://admin_walki:Qwe123Qwe@alex.mongohq.com:10013/walki_db_dev');

var admin = mongoose.Schema({
	username : String,
	password : String
});

var businesses = mongoose.Schema({
		firstname: String,
		lastname: String,
		created : {type: Date,default: Date.now},
		modified : {type: Date},
		activated: Boolean,
		email : String,
		phone: Number,
		username : String,
		password : String,
		business_name : String,
		foursquare_token: String,
		foursquare_uid : String,
		venues : [
				    { 
				    foursquare_id : String,
				    name : String,
				    location : {
						address: String,
						crossStreet: String,
						lat: String,
						lng: String,
						postalCode: Number,
						city: String,
						state: String,
						country: String,
						cc: String
				    },
				    hours : [{
				    	days: String,
				    	open:[],
				    	segments:[]
				    }], // check out the fourquare api for hour object we store timeframes object here.
					},
	  			  ],
	
		  settings: {
		  	version: String,
		    devices:Array,
		    status: {
		      number: Number,
		      friendly: String
		    },
		    notifications: {
		      push: Number,
		      email: Number,
		      sms: Number,
		      alerts: Number,
		      reminder: {
		        number: Number,
		        friendly: String
		      }
		    }
		  },
		  devices:Array,
		  last_login: {type: Date,default: Date.now}
	});

//this collection holds information about user account
var business_account = mongoose.Schema({
	business_id 			: String,
	expires_date			: String,
	transaction_id 			: String,
	original_purchase_date 	: String,
	purchase_date 			: String,
	recipt					: []
});

var employees = mongoose.Schema({
	businesses_id : String,
	venue_id :String,
	name : String,
	email : String,
	phone : {type:Number,default:0},
	working_hours : [{day : String ,time :String}]
});


var services = mongoose.Schema({
	businesses_id : String,
	venue_id :String,
	name : String,
	duration : String,
	segment : [{day:String,time:String}],
	price : String,
});

var dealSchema = mongoose.Schema({
  venue_id 	:String,
  venue_name: String,
  venue_location : [],
  title: String,
  start_date 	: { 
					month : Number,
					time  : Number,
					year  : Number,
					day   : Number 
				},
  end_date:   { 
				  	month : Number,
				    time  : Number,
				    year  : Number,
				    day   : Number 
				},
  category: {
	     name : String,
	     id   : String
	   },
  status: {type:String,default:"Pending"},
  deal: Number,
  deal_type: String, //(it can be either “percentage” (or “%”), or “currency” (or “$”)
  description: String,
  image: String,
  use_logo: {type:Boolean,default:false} 
});

var marketingStorage = mongoose.Schema({
	venue_id :String,
	name : String,
	email : String,
	mobile : {type:Number,default:0},
	office : {type:Number,default:0},
	home :{type:Number,default:0},
	address: String,
	city : String,
	state : String,
	zip: Number 
});

var customer = mongoose.Schema({
	venue_id :String,
	user_id :String
});

//events schema
var events = mongoose.Schema({ venue_id : String,
  name : String,
  start_time : String,
  end_time : String,
  user_id : String,
  duration : { number : Number,
  friendly : String },
  bstatus : {  number : Number,
			  friendly : String //status for business
				},
  cstatus : {  number : Number,
			  friendly : String //status for client
				},
  date : { 
  	month : Number,
    time : Number,
    year : Number,
    day : Number },
  location : { 
  	city : String,
    state : String },
  venue_location : {
	address: String,
	crossStreet: String,
	lat: Number,
	lng: Number,
	postalCode: String,
	city: String,
	state: String,
	country: String,
	cc: String,
  },
  employee_id : String,
  service_id : String,
  note : String,
  __v : {type: Number,default: 0} });

// password schema
var passwordRecovery = mongoose.Schema({
	email :String,
	token :String
});

var follow = mongoose.Schema({
    user_id : String,
    venue_id: String,
    follow_date: {type: Date,default: Date.now},
    notifications: {
        sms		: {type:Boolean,default:true},
        push	: {type:Boolean,default:true},
        email	: {type:Boolean,default:true},
        alerts	: {type:Boolean,default:true}
    }
});

var user = mongoose.Schema({    
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
	    created : {type: Date,default: Date.now},
	    last_login: {type: Date,default: Date.now},
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

var businessfeedback = mongoose.Schema({
	foursquare_uid :	String, // this is forsquare id for business app (foursquare_uid from businessesSchema)
	name           : 	String, // forsquare name
	email          :	String,
	content        :	String
});

var messages = mongoose.Schema({
	typ : String, 		 					// b2c -- business 2 customer OR -- c2b customer to business(to get user detail)
 	fr  : String,   		 				// object id(mongodb id)
	to  : String,     	 					// object id(mongodb id)
	sid : String,							// session id 
	msg : String,		 					// msg
	ts  : { type: String},					// timestamp
	sn  : { type: String, default: 0 },		// seen
	cdel: { type: Boolean, default: false },// client deleted, set true if deleted false if not deleted
	bdel: { type: Boolean, default: false },// business deleted, set true if deleted false if not deleted
	ip  : String,         					// ip of the msg sender
	vn  : String,
	vid : String
});


var categorySchema = mongoose.Schema({
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

var activitySchema	= mongoose.Schema({
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

var customerfeedback	= mongoose.Schema({
	user_id:	String,
	name: 		String,
	email:		String,
	content:	String
});

var versionSchema	= mongoose.Schema({
	version_name : String,
	type: String,// type business or client
	platform : String,// ios or android
	version_id : String
});

exports.collection = function (schema){
	// schems available
	try{
		switch(schema)
		{
			case 'businesses':
 				return mongoose.model(schema, businesses);
 			case 'passrecovery':
 				return mongoose.model(schema, passwordRecovery);
 			case 'events':
 			    return mongoose.model(schema, events);
 			case 'customer':
 				return mongoose.model(schema, customer);
 			case 'employees':
 				return mongoose.model(schema, employees); 			
 			case 'services':
 				return mongoose.model(schema, services);
 			case 'user':
 				return mongoose.model(schema, user);
 			case 'marketingStorage':
 				return mongoose.model(schema, marketingStorage);
 			case 'businessfeedback':
 				return mongoose.model(schema, businessfeedback);
 			case 'messages':
 				return mongoose.model(schema, messages);
 			case 'customerfeedback':
 			    return mongoose.model(schema, customerfeedback);
 			case 'activities':
 				return mongoose.model(schema, activitySchema);
 			case 'categories':
 				return mongoose.model(schema, categorySchema);
 			case 'deal':
 				return mongoose.model(schema, dealSchema);
 			case 'follow':
 				return mongoose.model(schema, follow);
 			case 'version':
 				return mongoose.model(schema, versionSchema);
 			case 'admin':
 				return mongoose.model(schema, admin);
 		}
 	}
 	catch (err){
 		return err
 	}
};

