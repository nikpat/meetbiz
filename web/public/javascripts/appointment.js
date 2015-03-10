$(function(){
	$(".showApt").on("click",function(){
	$.getJSON('/get_event',{eventid:this.id}, function(data) {
			console.log(data);
			var event = data.event;
			var user = data.user; 
			$("#eventName").val(event.name);
			$("#eventUser").val(user.name);
			$("#eventVenue").val(event.venue_id);
			$("#eventDate").val(moment(event.date.year+"-"+event.date.month+"-"+event.date.day).format('MMMM Do YYYY'));
			$("#eventStart").val(event.start_time);
			$("#eventStatus").val(event.status.friendly);
			if(event.status.friendly == "Cancelled"){
				$("#aptCancel").attr("action","delete");				
				$("#aptCancel").text("Delete");
			}
			$("#eventId").val(event._id);
		});
	});



	$("#aptUpdate").on("click",function(){
		var eventId = $("#eventId").val();
		if(eventId.length < 1){
			alert("Select Appontment");
		}
		else{
			aptAction('confirmed',eventId);
		}	
	});

	$("#aptCancel").on("click",function(){
		var eventId = $("#eventId").val();
		var action = $(this).attr("action");
		alert(action);
		
		if(eventId.length < 1){
			alert("Select Appontment");
		}
		else{
			if(action == "delete"){
				aptAction('deleted',eventId);
			}
			else{
				aptAction('cancled',eventId);
			}			
		}	
	});

	function aptAction(action,aptId){
		var params = { 
					  "eventId" : aptId,
					  "action" : action,				  
					}
		$.post("/update_event",params)
		.done(function(data) { 
		  if(data === "EventStatusUpdated" ){
				$("#eventStatus").val(action);	  	    
		  }
		  else{
		  	alert(data);
		  } 
		}); 

	}

	$(".selectVenueById").on("click",function(){
		var venue_id = $(this).attr('venue_id');
		$("#selectVenueBt").html($(this).html());
		$(".showApt").parent().hide();
		$("."+venue_id).parent().show();
	});

});
