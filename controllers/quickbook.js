const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const OAuthClient = require('intuit-oauth');
var oauthClient = null ;

exports.initiateQuickbook = (req, res) => {
    console.log('req.query');
    console.log(req.query);

    oauthClient = new OAuthClient({
        clientId: req.query.client_id,
        clientSecret: req.query.client_secret,
        environment: process.env.QUICKBOOK_ENV,
        redirectUri: process.env.QUICKBOOK_REDIRECTURL
    });
    console.log('oauthClient');
    console.log(oauthClient);

    // AuthorizationUri
    var authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId],state:'testState'});  // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}
    console.log('authUri')
    console.log(authUri)
    res.redirect(authUri);
};

exports.getAuthCode = (req,res) => {
  console.log('req');
  console.log(oauthClient);
  oauthClient.createToken(req.url)
       .then(function(authResponse) {
             oauth2_token_json = JSON.stringify(authResponse.getJson(), null,2);
             console.log('oauth2_token_json');
             console.log(oauth2_token_json);
             console.log(oauthClient);
         })
        .catch(function(e) {
             console.error(e);
         });

    res.redirect('/');
}

exports.refreshAccessToken = (req,res) =>{

    oauthClient.refresh()
        .then(function(authResponse){
            console.log('The Refresh Token is  '+ JSON.stringify(authResponse.getJson()));
            oauth2_token_json = JSON.stringify(authResponse.getJson(), null,2);
            res.send(oauth2_token_json);
        })
        .catch(function(e) {
            console.error(e);
        });

};

exports.getCompanyInfo = (req,res) => {


    var companyID = oauthClient.getToken().realmId;
    var url = oauthClient.environment == 'sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production ;
    oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/companyinfo/' + companyID})
        .then(function(authResponse){
            console.log("The response for API call is :"+JSON.stringify(authResponse));
            res.send(JSON.parse(authResponse.text()));
        })
        .catch(function(e) {
            console.error(e);
        });
};
exports.revokeAuthToken = (req,res) =>{
  oauthClient.revoke(params)
        .then(function(authResponse) {
            console.log('Tokens revoked : ' + JSON.stringify(authResponse.json()));
        })
        .catch(function(e) {
            console.error("The error message is :"+e.originalMessage);
            console.error(e.intuit_tid);
        });
});
