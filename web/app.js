//set the env
var sys = require('sys');
var express = require('express');
var	assert = require('assert');
var	routes = require("./routes");
var	register = require("./routes/registrations");
var usettings = require("./routes/user_settings");

var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

io.configure(function () {
       io.set("transports", ["xhr-polling"]);
       io.set("polling duration", 10);
       io.set("log level", 1);
   });

app.set("view engine","jade");
app.set("view options",{layout:true});
app.set("views",__dirname+"/views");
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser('awesomeapp'));
app.use(express.session());


//Define all urls
app.get('/checkfoursquare',routes.fslogin);
app.get('/callback', routes.fscallback);

app.get('/home', routes.home);
app.post('/login', routes.login);
app.post('/forgotpass', routes.forgotpass);
app.all('/recovery/:token', routes.passrecovery);
app.all('/settings', routes.settings);
app.all('/calender', routes.calender);
app.all('/venue_details/:venue_id', routes.venue_details);
app.get('/',routes.index);
app.get('/logout',routes.logout);
app.get('/get_service',routes.getService);
app.post('/add_service',routes.addService);
app.post('/edit_service',routes.editService);
app.post('/del_service',routes.delService);

//related employees
app.get('/get_emp',routes.getEmp);
app.post('/add_emp',routes.addEmp);
app.post('/edit_emp',routes.editEmp);
app.post('/del_emp',routes.delEmp);

//appointmentes url
app.get('/appointments',routes.getapts);
app.get('/get_event',routes.getevent);
app.post('/update_event',routes.updateevent);

app.all('/edit_notification',usettings.edit_notification);

//signup
app.all('/signup', register.signup);

//socketio
app.all('/test',function(req,res){res.render('test')});

//deals
app.get('/deals',routes.getDeals);
app.get('/get_deal',routes.getDeal);
app.post('/add_deals',routes.addDeals);
app.post('/edit_deals',routes.editDeals);
app.post('/del_deals',routes.delDeals);


var port = process.env.PORT || 3000;
server.listen(port);
console.log("listing on port :"+port);