$(document).ready(function(){
	  var socket = io.connect('http://localhost:8888');
	  var user = {type:"b2c",name:business_name,uid:business_id};
	  //var user = {type:"b2c",name:business_name,uid:"518bc13228f9d70200000008"};
	  console.log(user);
	  var venue_id = '';
	  $(".selVenue").on("click",function(){
	  	var vid = $(this).attr('vid');
	  	venue_id = vid ;
	  	$("#selectedVenue").html($(this).html());
	  	console.log(business_id+"==="+vid)
		socket.emit('getUnreadCount',{"venue_id" : vid , "type":"b2c", "uid":business_id})
	 	socket.on('getUnreadCount',function(data){
	 		console.log(data);
	 		var msgs = "";
	 		var totalCount = 0;	 		
	 		$.each(data.msgList,function(k,v){
	 			var unSeenCount = '';
	 			
	 			if(v.unseen_msgcount > 0 ){
	 			 	unSeenCount ='['+v.unseen_msgcount+']';
	 			 	totalCount = totalCount+1;
	 			}	 			
	 			msgs = msgs+'<div class="inbox"><p></p><blockquote><p><a href="#" uid="'+v.user.uid+'" class="openChatBox" uname="'+v.user.name+'">'+v.user.name+' '+unSeenCount+'</a></p></blockquote><p></p></div>'; 
	 			console.log(v.unseen_msgcount );

	 		});
	 		$(".msgCount").html(totalCount);
	 		$(".inboxCont").html(msgs);
	 	});
	  	$("#footer").show('show');
	  });

  	  socket.emit('connectChat', user);
	  socket.on('connectChat', function (data) {
	   	console.log(data);	
	  });

	  socket.emit('connectChat', user);
	  socket.on('connectChat', function (data) {
	   	console.log(data);	
	  });

	  socket.on('msg', function (data) {
		console.log(data);
		$("#cb_"+data.from).append("<li>"+ $("#cb_"+data.from).attr("uname")+" : "+ data.msg +"</li>");
		//get scroll to bottom
		var scrollWin = $("#cb_"+data.from).parent().parent();
  	    scrollWin.scrollTop($("#cb_"+data.from).parent().height());

	  });
	  
	

	$(document).on("click","#close",function(){
		$(this).closest('li').remove();
	});

	$(document).on("click",".maxmin",function(){
		$(this).closest('li').find('.footer_dropup').toggle();
		$(this).toggleClass("icon-chevron-up");
		$(this).toggleClass("icon-chevron-down");
		var scrollWin = $(this).parent().parent().find(".chatbox_body");
  	    scrollWin.scrollTop(scrollWin.find('.chatMsgs').height());
	});

	

	//var list = '<li class="chat-title drop3columns"><a href="#" class="chat_uname"><%= name %></a><a href="#" class="chatbox_action"><i class="maxmin icon-chevron-up"></i><i id="close" class="icon-remove"></i></a><div class="footer_dropup drop3columns" style="display: none;"><div class="chatbox"><div class="chatbox_body"><div class="chatMsgs"><ul class="chatMsgsList"><% _.each(msgs,function(msg){ if (msg.fr != busi_id) { %> <li><%= name %>:<%= msg.msg %></li> <% } else {  %><li>You:<%= msg.msg %></li> <% } }); %> </ul></div></div><div class="chatbox_footer"><input type="text" class="chattxt" uid="<%= uid %>"></div></div></div></li>' ;
	var list = '<li class="chat-title drop3columns"><a href="#" class="chat_uname"><%= name %></a><a href="#" class="chatbox_action"><i class="maxmin icon-chevron-up"></i><i id="close" class="icon-remove"></i></a><div class="footer_dropup drop3columns" style="display: none;" ><div class="chatbox"><div class="chatbox_body"><div class="chatMsgs"><ul class="chatMsgsList" id="cb_<%= uid %>" uname="<%= name %>"><%= msgs %> </ul></div></div><div class="chatbox_footer"><input type="text" class="chattxt" uid="<%= uid %>"></div></div></div></li>' ;
	
	//var list = $("#msgListing");
	var openBoxes = [];
	var boxTemplate =  _.template(list);
	$(".inbox").on("click",".openChatBox",function(){
		//var msgbox = boxTemplate({name : 'moe'});
		  var uid = $(this).attr('uid');
		  var name = $(this).attr('uname');
		  if(openBoxes.indexOf(uid)<0){		  
			  var data = {u1:uid,u2:business_id,venue_id:venue_id} ;	
			  socket.emit('getSessionMsgs', data);
			  socket.on('getSessionMsgs', function (data) {
			  	console.log(data);
			   	var msgstr = "";
			   	var cnt = 0;
			   	var msg_ids_arr = []; 
			   	msgarr = data.reverse();
			   	_.each(msgarr,function(msg){ 
		   			if (msg.fr != business_id) { 
		   				msgstr = msgstr +"<li>"+name+":"+msg.msg+"</li>";
		   			} else {
		   				msgstr = msgstr +"<li> You :"+msg.msg+"</li>";
		   				
		   				cnt = cnt + 1;
		   			}
		   			msg_ids_arr.push(msg._id);
		   		});
			   	console.log("cjt"+cnt);
			  	$('.footer_full').append(boxTemplate({name : name, msgs : msgstr,uid:uid,busi_id:business_id }));
			    console.log(msg_ids_arr);
			    socket.emit('markSeen', {msg_ids:msg_ids_arr});
				socket.on('markSeen',function(resdata){
					console.log(resdata);
				});
			  });
			  openBoxes.push(uid);
		}
		else{
			$("#cb_"+uid).parent().parent().parent().parent().toggle();
		}

	});

	$('.inbox').on("click",function(){
		$(this).find('.footer_dropup').toggle();
	});
	
	$('.footer_full').on('keypress','.chattxt',function(event) {
		if(event.keyCode == 13){
		  var msg = $(this).val();
		  var chatPayload = { to_uid: $(this).attr('uid'),from_uid: business_id ,msg: msg,type:'b2c',venue_id:venue_id} ;
	  	  console.log($(this).parent().parent().find('.chatMsgs'));
	  	  $(this).parent().parent().find('.chatMsgsList').append('<li> you :'+msg+'</li>');
	  	  $(this).val('');
	  	  var scrollWin = $(this).parent().parent().find(".chatbox_body");
	  	  scrollWin.scrollTop(scrollWin.find('.chatMsgs').height());
	  	  socket.emit('sendChat', chatPayload);
		  socket.on('sendChat', function (data) {
		   	$(this).val('') 
		  });
		}
	});

	
});
