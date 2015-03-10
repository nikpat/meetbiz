var request = require('request');//burak: 2144789458
var jsonrec = { original_purchase_date_pst: '2013-05-11 02:17:58 America/Los_Angeles',
     unique_identifier: '0000b0420b08',
     original_transaction_id: '1000000073702638',
     expires_date: '1368274717000',
     transaction_id: '1000000073706450',
     quantity: '1',
     product_id: 'com.neosofttech.enableChat',
     item_id: '647045818',
     bid: 'com.neosofttech.pushDemo',
     unique_vendor_identifier: 'F6B3E0D0-7176-465B-94F3-C6D3DCE8588B',
     web_order_line_item_id: '1000000026935123',
     bvrs: '1.0',
     expires_date_formatted: '2013-05-11 12:18:37 Etc/GMT',
     purchase_date: '2013-05-11 12:15:37 Etc/GMT',
     purchase_date_ms: '1368274537000',
     expires_date_formatted_pst: '2013-05-11 05:18:37 America/Los_Angeles',
     purchase_date_pst: '2013-05-11 05:15:37 America/Los_Angeles',
     original_purchase_date: '2013-05-11 09:17:58 Etc/GMT',
     original_purchase_date_ms: '1368263878000' }
var rec = JSON.stringify(jsonrec);
console.log(rec);
request({
  uri: "https://sandbox.itunes.apple.com/verifyReceipt",
  method: "POST",
  json: {
    "receipt-data" : new Buffer(rec).toString('base64'),
  }
},function(error, response, body) {
	if(error){
		console.log("===========> error !")
		console.log(error);
  		//callback("error");
	}
	else{
		console.log("===========> got it")
		console.log(body);
	  	//callback(body.receipt);
  	}
});	