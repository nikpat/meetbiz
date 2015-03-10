$(function(){
	$(".showDeal").on("click",function(){
	$.getJSON('/get_deal',{deal_id:this.id}, function(data) {
			console.log(data);
			var deal = data;
			$("#dealTitle").val(deal.title);
			$("#dealval").val(deal.deal+deal.deal_type);
			$("#dealVenue").val(deal.venue_id);
			$("#dealDes").val(deal.category.name);			
			$("#dealCat").val(deal.description);
			$("#dealStart").val(moment(deal.start_date.year+"-"+deal.start_date.month+"-"+deal.start_date.day).format('MMMM Do YYYY'));
			$("#dealEnd").val(moment(deal.end_date.year+"-"+deal.end_date.month+"-"+deal.end_date.day).format('MMMM Do YYYY'));
			//$("#dealStart").val(deal.start_time);
			$("#dealStatus").val(deal.status);
			if(deal.status.friendly == "Cancelled"){
				$("#aptCancel").attr("action","delete");				
				$("#aptCancel").text("Delete");
			}
			$("#dealId").val(deal._id);
		});
	});



	$("#aptUpdate").on("click",function(){
		var dealId = $("#dealId").val();
		if(dealId.length < 1){
			alert("Select Appontment");
		}
		else{
			aptAction('confirmed',dealId);
		}	
	});

	$("#dealDel").on("click",function(){
		var dealId = $("#dealId").val();
		var action = $(this).attr("action");
		var params = {deal_id:dealId}
		if(dealId.length < 1){
			alert("Select Appontment");
		}
		else{
			if(action == "del"){
				$.post("/del_deals",params)
				.done(function(data) { 
				  
						$("#"+dealId).parent().show();  	    
				 
				}); 
			}						
		}	
	});


	$(".selectVenueById").on("click",function(){
		var venue_id = $(this).attr('venue_id');
		$("#selectVenueBt").html($(this).html());
		$(".showDeal").parent().hide();
		$("."+venue_id).parent().show();
	});

});
