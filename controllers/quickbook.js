const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const OAuthClient = require('intuit-oauth');

exports.initiateQuickbook = (req, res) => {
    console.log('req.query');
    console.log(req.query);
    var oauthClient = new OAuthClient({
        clientId: req.query.client_id,
        clientSecret: req.query.client_secret,
        environment: process.env.QUICKBOOK_ENV,
        redirectUri: process.env.QUICKBOOK_REDIRECTURL
    });

    // AuthorizationUri
    var authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId],state:'testState'});  // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}
    console.log('authUri')
    console.log(authUri)
    res.redirect(authUri);
};

exports.getAuthCode = (req,res) => {
  console.log('req');
  console.log(req);
  oauthClient.createToken(req.url)
       .then(function(authResponse) {
             oauth2_token_json = JSON.stringify(authResponse.getJson(), null,2);
         })
        .catch(function(e) {
             console.error(e);
         });

    res.send('');
}
