// Test functions
function testUserCheckins(access_token) {

	var params = {
		limit: 200
	};

	FOURSQ.getUserCheckins("self", access_token, function (data) {

		var result = data.count;
		
		try {
			assert.notStrictEqual(result, undefined);
			console.log("-> userCheckins OK");
		} catch (e) {
			console.log("-> userCheckins ERROR");
		}

	}, function (error) {
			console.log("-> userCheckins ERROR");
	}, params);
}

function testUserBadges(access_token) {

	FOURSQ.getUserBadges("self", access_token, function (data) {

		var result = data;
		
		try {
			assert.notStrictEqual(result, undefined);
			console.log("-> userBadges OK");
		} catch (e) {
			console.log("-> userBadges ERROR");
		}

	}, function (error) {
			console.log("-> userBadges ERROR");
	});
}

function testUserSearch(access_token) {

	var query = { twitter: "naveen" };

	FOURSQ.searchUsers(query, access_token, function (data) {

		var result = data[0].id;

		try {
			assert.equal(result, '33');
			console.log("-> searchUser OK");
		} catch (e) {
			console.log("-> searchUser ERROR");
		}

	}, function (error) {
		console.log("-> searchUser ERROR");
	});
}

function testVenueSearch(access_token) {

	var query = { ll: "19.0, -72.8" };

	FOURSQ.searchVenues(query, access_token, function (data) {

		var result = data[0].type;
		//console.log(data[0].items[0]);
		try {
			assert.equal(result, 'nearby');
			console.log("-> searchVenue OK");
		} catch (e) {
			console.log("-> searchVenue ERROR");
		}

	}, function (error) {
		console.log(error);
		console.log("-> searchVenue ERROR");
	});
}

function testTipSearch(access_token) {

	var query = { ll: "40.7, -74" };

	FOURSQ.searchTips(query, access_token, function (data) {

		var result = data[0].text;

		try {
			assert.equal(result, 'It is time for espresso');
			console.log("-> searchTips OK");
		} catch (e) {
			console.log("-> searchTips ERROR");
		}

	}, function (error) {
		console.log(error);
		console.log("-> searchTips ERROR");
	});
}


function testGetRecentCheckins(access_token) {

	FOURSQ.getRecentCheckins( { limit: "20" }, access_token, function (data) {

		var result = JSON.stringify(data);
		
		try {
			assert.ok(result);
			console.log("-> getRecentCheckins OK");
		} catch (e) {
			console.log("-> getRecentCheckins ERROR");
		}

	}, function (error) {
		console.log("-> getRecentCheckins ERROR");
	});
}

function testGetSettings(access_token) {

	FOURSQ.getSettings( access_token, function (data) {

		var result = JSON.stringify(data);

		try {
			assert.ok(result);
			console.log("-> getSettings OK");
		} catch (e) {
			console.log("-> getSettings ERROR");
		}

	}, function (error) {
		console.log("-> getSettings ERROR");
	});
}


function testGetManaged(access_token){
	
	FOURSQ.getManaged(access_token,function(data){
		var result = JSON.stringify(data);
		console.log("-> getManaged OK");
		managedData = data;
		if(managedData){
			console.log("here!"+managedData);
			for(i=0;i<managedData.length;i++){
				console.log(managedData[i].id);
				venues_ids.push({foursquare_id:managedData[i].id,employees:null,services:null})
			}
		}
		
	},
		 function (error) {
		console.log("-> getManaged ERROR  " + JSON.stringify(error));
	});
}

function testGetPhoto(access_token) {

	FOURSQ.getPhoto("4d0fb8162d39a340637dc42b", access_token, function (data) {
		var result = data.id;

		try {
			assert.equal(result, "4d0fb8162d39a340637dc42b");
			console.log("-> getPhoto OK");
		} catch (e) {
			console.log("-> getPhoto ERROR");
		}

	}, function (error) {
		console.log("-> getPhoto ERROR");
	});
}

function testGetUser(access_token) {
	
	FOURSQ.getUser("self", access_token, function (data) {
		var result = data;
		userinfo = data;
		
		try {
			//assert.ok(result);
			console.log("-> getUser OK");
			
		} catch (e) {
			console.log("-> getUser ERROR");
		}

	}, function (error) {
		console.log("-> getUser ERROR");
	});
	
}

exports.multi = function (req,res){
		FOURSQ.getUserAndManaged(req.params.token,function(data){
		var result = data//JSON.stringify(data);
		console.log("-> getManaged OK");
		managedData = data;
		res.send(result);
	},
		 function (error) {
		res.send(error);
		console.log("-> getManaged ERROR  " + JSON.stringify(error));
	});
}

function testGetVenue(access_token) {

	FOURSQ.getVenue(5104, access_token, function (data) {
		var result = data.id;
		console.log("===>")
		console.log(data)
		return data;
		try {
			assert.equal(result, "40a55d80f964a52020f31ee3");
			console.log("-> getVenue OK");
		} catch (e) {
			console.log("-> getVenue ERROR");
		}

	}, function (error) {
		console.log("-> getVenue ERROR");
	});
}

function testGetCheckin(access_token) {

	FOURSQ.getCheckin("IHR8THISVNU", access_token, function (data) {
		var result = data;
		
		try {
			assert.ok(result);
			console.log("-> getCheckin OK");
		} catch (e) {
			console.log("-> getCheckin ERROR");
		}

	}, function (error) {
		console.log("-> getCheckin ERROR");
	});
}

function testGetTip(access_token) {

	FOURSQ.getTip("4b5e662a70c603bba7d790b4", access_token, function (data) {
		var result = data.id;

		try {
			assert.equal(result, "4b5e662a70c603bba7d790b4");
			console.log("-> getTip OK");
		} catch (e) {
			console.log("-> getTip ERROR");
		}

	}, function (error) {
		console.log("-> getTip ERROR");
	});
}

function getUserAndManaged(access_token) {

	FOURSQ.getTip("4b5e662a70c603bba7d790b4", access_token, function (data) {
		var result = data.id;

		try {
			assert.equal(result, "4b5e662a70c603bba7d790b4");
			console.log("-> getTip OK");
		} catch (e) {
			console.log("-> getTip ERROR");
		}

	}, function (error) {
		console.log("-> getTip ERROR");
	});
}