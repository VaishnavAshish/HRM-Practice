var https = require('https'); 
// form data
exports.initiateExpensify = (req,res) => {
    
}
var requestJobDescription = `requestJobDescription={
  "type":"create",
  "credentials":{
      "partnerUserID":"aa_wogi1_doc_mail_net",
      "partnerUserSecret":"d1f552568f76ed0a475ac59617dc936877d301fb"
  },
  "inputSettings":{
      "type":"expenses",
      "employeeEmail":"wogi1@doc-mail.net",
      "transactionList": [
          {
              "created": "2019-01-01",
              "currency": "USD",
              "merchant": "Name of merchant 1",
              "amount": 1234
          },
          {
              "created": "2019-01-21",
              "currency": "EUR",
              "merchant": "Name of merchant 2",
              "amount": 2211
          },
          {
              "created": "2019-01-31",
              "currency": "CAD",
              "merchant": "Name of merchant 3",
              "amount": 2211
          }
      ]
  }
}`;
 
// request option
var options = {
  host: 'integrations.expensify.com',
  method: 'POST',
  path: '/Integration-Server/ExpensifyIntegrations',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': requestJobDescription.length
  }
};
 
// request object
// var req = https.request(options, function (res) {
//   var result = '';
//   res.on('data', function (chunk) {
//     result += chunk;
//   });
//   res.on('end', function () {
//     console.log(result);
//   });
//   res.on('error', function (err) {
//     console.log(err);
//   })
// });
 
// req error
// req.on('error', function (err) {
//   console.log(err);
// });
 
//send request witht the postData form
// req.write(requestJobDescription);
// req.end();