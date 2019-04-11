const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const OAuthClient = require('intuit-oauth');

exports.initiateStripe = (req, res) => {

    var oauthClient = new OAuthClient({
        clientId: 'Q0fxpJWqOc8yM8iJ9C0mJsTPCXCfmUe5vUMFxcEB84xZQCV70E',
        clientSecret: 'h7eEiUGVabTwMFzHCmsqkh28h83HYK68k5PA4x08',
        environment: 'sandbox',
        redirectUri: 'http://localhost:3000/callback'
    });

    // AuthorizationUri
    var authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId],state:'testState'});  // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}
    res.redirect(authUri);
};
