const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const OAuthClient = require('intuit-oauth');
var oauthClient = null ;

exports.initiateQuickbook = (req, res) => {
    // console.log('req.query');
    // console.log(req.query);

    oauthClient = new OAuthClient({
        clientId: req.query.client_id,
        clientSecret: req.query.client_secret,
        environment: process.env.QUICKBOOK_ENV,
        redirectUri: process.env.QUICKBOOK_REDIRECTURL
    });
    // console.log('oauthClient');
    // console.log(oauthClient);

    // AuthorizationUri
    var authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId],state:'testState'});  // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}
    // console.log('authUri')
    // console.log(authUri)
    res.redirect(authUri);
};

exports.getAuthCode = (req,res) => {
  // console.log('req');
  // console.log(oauthClient);
  oauthClient.createToken(req.url)
       .then(function(authResponse) {
             oauth2_token_json = JSON.stringify(authResponse.getJson(), null,2);
             pool.connect((err, client, done) => {
                 client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING id',[oauthClient, req.user.company_id], function(err, updatedSetting) {
                   if (err){
                     handleResponse.shouldAbort(err, client, done);
                     res.redirect('/');
                    //  handleResponse.handleError(res, err, ' Error in updating settings');
                   } else {
                     done();
                     res.redirect('/');
                     // handleResponse.sendSuccess(res,'settings updated successfully',{});
                    //  handleResponse.sendSuccess(res,'Stripes data updated successfully',{customer:customer,subscription:subscription});

                   }
                 });
             });
            //  console.log('oauth2_token_json');
            //  console.log(oauth2_token_json);
            //  console.log(oauthClient);
            //  res.redirect('/');
         })
        .catch(function(e) {
             console.error(e);
         });
    //  res.send(200);

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
exports.disconnectQuickbook = (req,res) =>{
  pool.connect((err, client, done) => {
      client.query('SELECT quickbook_token FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in fetching settings');
        } else {
            // console.log('companySetting');
            // console.log(companySetting.rows[0]);
            if(companySetting.rows[0].quickbook_token!=null){
              let quickbook_token = JSON.parse(companySetting.rows[0].quickbook_token);
              console.log('quickbook_token');
              console.log(quickbook_token);
              let tokenJSON = {
                "token_type": quickbook_token.token.token_type,
                "expires_in": quickbook_token.token.expires_in,
                "refresh_token":quickbook_token.token.refresh_token,
                "x_refresh_token_expires_in":quickbook_token.token.x_refresh_token_expires_in,
                "access_token":quickbook_token.token.access_token
              }
              // console.log(tokenJSON);

              oauthClient = new OAuthClient({
                  clientId: quickbook_token.clientId,
                  clientSecret: quickbook_token.clientSecret,
                  environment: quickbook_token.environment,
                  redirectUri: quickbook_token.redirectUri,
                  token:quickbook_token.token
              });
              // var authToken = oauthClient.token.getToken();
              // console.log('authToken');
              // console.log(authToken);

              // oauthClient.setToken(authToken);

              console.log(oauthClient);
              if(!oauthClient.isAccessTokenValid()) {
                console.log('inside if');
                oauthClient.refreshUsingToken(oauthClient.token.refresh_token)
                   .then(function(authResponse) {
                       console.log('Tokens refreshed : ' + JSON.stringify(authResponse.json()));
                       console.log(oauthClient);
                       oauthClient.revoke({token:oauthClient.token.refresh_token})
                       .then(function(authResponse) {
                         console.log('Tokens revoked : ' + JSON.stringify(authResponse.json()));
                         client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedSetting) {
                           if (err){
                             handleResponse.shouldAbort(err, client, done);
                             handleResponse.handleError(res, err, ' Error in updating settings');
                           } else {
                             done();
                             handleResponse.sendSuccess(res,'settings updated successfully',{});
                           }
                         });
                       })
                       .catch(function(e) {
                         console.error("The error message is :"+e.originalMessage);
                         console.error(e.intuit_tid);
                         handleResponse.handleError(res, e, ' Error in revoking token'+e);
                       });
                   })
                   .catch(function(e) {
                       console.error("The error message is :"+e.originalMessage);
                       console.error(e.intuit_tid);
                       handleResponse.handleError(res, e, ' Error in refreshing token'+e);
                   });
               }else{
                 console.log('inside else')
                 console.log(oauthClient);
                 oauthClient.revoke({token:tokenJSON})
                 .then(function(authResponse) {
                   console.log('Tokens revoked : ' + JSON.stringify(authResponse.json()));
                   client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedSetting) {
                     if (err){
                       handleResponse.shouldAbort(err, client, done);
                       handleResponse.handleError(res, err, ' Error in updating settings');
                     } else {
                       done();
                       handleResponse.sendSuccess(res,'settings updated successfully',{});
                     }
                   });
                 })
                 .catch(function(e) {
                   console.error("The error message is :"+e.originalMessage);
                   console.error(e.intuit_tid);
                   handleResponse.handleError(res, e, ' Error in revoking token'+e);
                 });

               }
            }else{
              handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
            }
        }
      });
  });

};
