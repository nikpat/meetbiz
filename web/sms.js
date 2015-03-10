
//The url we want is: http://walkihq.com/sms.php?token=3c87272a0e549ff5fe2ebaee4b942342&no=2144789458&msg=Hi%20welcome%20to


var request = require('request');
request('http://walkihq.com/sms.php?token=3c87272a0e549ff5fe2ebaee4b942342&no=2144789458&msg=fromapi', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the google web page.
  }
})