$("#settingsNav").on("click",function(){
	console.log($(this).parent());
	$(this).parent().find('.active').removeClass('active');
	$(this).addClass("active");
	$("#settings").show();
	$("#employees").hide();
	$("#service").hide();
});

$("#employeesNav").on("click",function(){
	$(this).parent().find('.active').removeClass('active');
	$(this).addClass("active");
	$("#settings").hide();
	$("#employees").show();
	$("#service").hide();
});

$("#serviceNav").on("click",function(){
	$(this).parent().find('.active').removeClass('active');
	$(this).addClass("active");
	$("#settings").hide();
	$("#employees").hide();
	$("#service").show();
});

$(".showservice").live("click",function(){
	$.getJSON('/get_service',{serviceid:this.id}, function(data) {
		$("#ServiceVenue").val(data.venue_id);
		$("#serviceName").val(data.name);
		$("#serviceDuration").val(data.duration);	
		$("#servicePrice").val(data.price);	
		$("#serviceId").val(data._id);
	});
});

$("#addServicebt").on("click",function(){
	if($(this)[0].innerHTML == "Back"){
		$(this).html("Add");
	}
	else{
		$(this).html("Back");
	}
	$("#addService").toggle();
	$("#manageService").toggle();
	
});

$("#addNewService").on("click",function(){
	  if($("#newServiceName").val().length != 0 && $("#newServiceDuration").val().length !=0 && $("#newServicePrice").val().length!=0)
	  {
		  var params = { 
		  				  "businesses_id" : business_id,
						  "venue_id" : $("#newServiceVenue").val(),
						  "name" : $("#newServiceName").val(),
						  "duration" : $("#newServiceDuration").val(),
						  "price" : $("#newServicePrice").val(),				  
						}
		  $.post("/add_service",params)
			.done(function(data) {
			  //alert(data);
  			  if(data != "error" && data != "serviceExist" ){
  			  	    var appendStr = '<li><a href="javascript:void(0)" id="'+data+'" class="showservice">'+$("#newServiceName").val()+'</a></li>';
  			  	    $("#serviceList").append(appendStr);
  			  	    var notice = '<div class="alert alert-info" style="margin-top: 10px;">Service Added ! <a href="#" data-dismiss="alert" class="close">×</a></div>';
  			  	    $("#addService").prepend(notice);
			  }
			  else{
			  	alert(data);
			  }
			}); 
	}
	else{
		alert("Data incomplete");
	}
});

$("#serviceUpdate").on("click",function(){
	  if($("#serviceName").val().length != 0 && $("#serviceDuration").val().length !=0 && $("#servicePrice").val().length!=0)
	  {
		  var params = {
		  				  "service_id" : $("#serviceId").val(),
						  "venue_id" : $("#serviceVenue").val(),
						  "name" : $("#serviceName").val(),
						  "duration" : $("#serviceDuration").val(),
						  "price" : $("#servicePrice").val(),				  
						}	  
		  $.post("/edit_service",params)
			.done(function(data) {
			  alert("Data Loaded: " + data);
			}); 
	}
	else{
		alert("Select Service");
	}
});

$("#serviceDel").on("click",function(){
	var verify = confirm("Are you sure!");
	if(verify){
			var serviceId = $("#serviceId").val();
		  	$.post("/del_service",{"service_id" : serviceId })
			.done(function(data) {
			  if(data == "success"){
			  		$("#"+serviceId).parent('li').remove();
			  }
			  else{
			  	alert(data);
			  }
			}); 
	}
});

$("#addEmpBt").on("click",function(){
	if($(this)[0].innerHTML == "Back"){
		$(this).html("Add");
	}
	else{
		$(this).html("Back");
	}
	$("#addEmp").toggle();
	$("#manageEmp").toggle();
	
});

$(".showEmp").live("click",function(e){
	$.getJSON('/get_emp',{emp_id:this.id}, function(data) {
		console.log(data);
		$("#empVenue").val(data.venue_id);
		$("#empName").val(data.name);
		$("#empEmail").val(data.email);	
		$("#empPhone").val(data.phone);
		$("#empId").val(data._id);
		
	});
});

$("#addNewEmp").on("click",function(){
	  if($("#newEmpName").val().length != 0 && $("#newEmpEmail").val().length !=0 && $("#newEmpPhone").val().length!=0)
	  {
		  var params = { 
		  				  "businesses_id" : business_id, // for this you need to check the file which inherits this script
						  "venue_id" : $("#newEmpVenue").val(),
						  "name" : $("#newEmpName").val(),
						  "email" : $("#newEmpEmail").val(),
						  "phone" : $("#newEmpPhone").val(),				  
						}
		  
		  $.post("/add_emp",params)
			.done(function(data) {
				if(data!="employeeExist" && data!="error"){

  			  	    var appendStr = '<li><a href="javascript:void(0)" id="'+data+'" class="showEmp">'+$("#newEmpName").val()+'</a></li>';
  			  	    $("#empList").append(appendStr);
  			  	    var notice = '<div class="alert alert-info" style="margin-top: 10px;">Service Added ! <a href="#" data-dismiss="alert" class="close">×</a></div>';
  			  	    $("#addEmp").prepend(notice);
  			  	}
  			  	else{
  			  		console.log(data);
  			  		alert("user exist");
  			  	}
			});
	}
	else{
		alert("Data incomplete");
	}
});

$("#empDel").on("click",function(){
	var verify = confirm("Are you sure!");
	if(verify){
			var empId = $("#empId").val();
		  	$.post("/del_emp",{"emp_id" : empId })
			.done(function(data) {
			  if(data == "success"){
			  		$("#"+empId).parent('li').remove();
			  }
			  else{
			  	alert(data);
			  }
			}); 
	}
});

$("#empUpdate").on("click",function(){
	  if($("#empEmail").val().length !=0)
	  {
		  var params = {
		  				  "emp_id" : $("#empId").val(),
						  "venue_id" : $("#empVenue").val(),
						  "name" : $("#empName").val(),
						  "email" : $("#empEmail").val(),
						  "phone" : $("#empPhone").val(),				  
						}	  
		  $.post("/edit_emp",params)
			.done(function(data) {
			  console.log(data);
			  alert("Data Loaded: " + data);
			}); 
	}
	else{
		alert("Select Employee to edit");
	}
});


$("#alert_bt").on("change",function(){
  var params = { 
		  "type" : "alert", // for this you need to check the file which inherits this script		  
		}
  if($(this).is(':checked')){
          	params.action = 1;
       }
       else{
    		params.action = 0;
       }  
  $.post("/edit_notification",params)
	.done(function(data) {
		console.log(data);
	}); 
});

$("#email_bt").on("change",function(){
	  var params = { 
		  "type" : "email", // for this you need to check the file which inherits this script		  
		}
  if($(this).is(':checked')){
          	params.action = 1;
       }
       else{
    		params.action = 0;
       }  
  $.post("/edit_notification",params)
	.done(function(data) {
		console.log(data);
	}); 
});

$("#push_bt").on("change",function(){
	  var params = { 
		  "type" : "push", // for this you need to check the file which inherits this script		  
		}
  if($(this).is(':checked')){
          	params.action = 1;
       }
       else{
    		params.action = 0;
       }  
  $.post("/edit_notification",params)
	.done(function(data) {
		console.log(data);
	}); 
});
