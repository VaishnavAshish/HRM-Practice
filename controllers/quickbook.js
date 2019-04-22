const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const OAuthClient = require('intuit-oauth');

oauthClient = null ;

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
             console.log('oauth2_token_json');
             console.log(oauth2_token_json);
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

OAuthClient.prototype.postApiCall = function(params)  {

    return (new Promise(function(resolve) {

        params = params || {};

        var request = {
            url: params.url,
            method: 'POST',
            body: params.body,
            headers: {
                'Authorization': 'Bearer ' + this.getToken().access_token,
                'Accept': 'application/json',
                'User-Agent': OAuthClient.user_agent,
                'Content-Type': 'application/json'
            }
        };

        resolve(this.getTokenRequest(request));

    }.bind(this))).then(function(authResponse) {

        this.log('info','The postApiCall () response is : ',JSON.stringify(authResponse, null, 2));
        return authResponse;

    }.bind(this)).catch(function(e) {

        this.log('error','Post postApiCall ()  threw an exception : ',JSON.stringify(e, null, 2));
        throw e;

    }.bind(this));

};

exports.postInvoiceToQuickbook = (req,res) => {
  console.log('postInvoiceToQuickbook');
  console.log(req.body);
  pool.connect((err, client, done) => {
      client.query('SELECT quickbook_token FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in fetching settings');
        } else {
            if(companySetting.rows[0].quickbook_token!=null){
              let quickbook_token = JSON.parse(companySetting.rows[0].quickbook_token);
              oauthClient = new OAuthClient({
                  clientId: quickbook_token.clientId,
                  clientSecret: quickbook_token.clientSecret,
                  environment: quickbook_token.environment,
                  redirectUri: quickbook_token.redirectUri,
                  logging:true,
                  token:quickbook_token.token
              });

              oauthClient.refresh()
                 .then(function(authResponse) {
                    //  console.log('Tokens refreshed : ' + JSON.stringify(authResponse));
                     quickbook_token.token =authResponse.token;
                     client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING *',[quickbook_token,req.user.company_id], function(err, updatedCompSetting) {
                       if (err){
                         handleResponse.shouldAbort(err, client, done);
                         handleResponse.handleError(res, err, ' Error in updating settings');
                       } else {
                         var companyID = oauthClient.getToken().realmId;
                         var url = oauthClient.environment == 'Sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production ;
                         console.log(companyID+' companyID');
                         console.log(req.body.client_qb_id);
                         if(req.body.client_qb_id!=''&&req.body.client_qb_id!=null&&req.body.client_qb_id!=undefined){

                           oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/query?query=select * from Item &minorversion=4'})
                               .then(function(itemData){
                                   console.log("The response for API call is :"+JSON.stringify(itemData));
                                   done();
                                   handleResponse.sendSuccess(res,'Quickbook data fetched successfully',{itemArray:itemData.json.QueryResponse.Item});
                               })
                               .catch(function(e) {
                                   console.error(e);
                                   handleResponse.handleError(res, e, ' Error in getting item info'+e);
                               });
                         }else{

                           client.query('SELECT * FROM ACCOUNT where name=$1 and company_id=$2',[req.body.client_name,req.user.company_id], function(err, accountInfo) {
                             if (err){
                               handleResponse.shouldAbort(err, client, done);
                               handleResponse.handleError(res, err, ' Error in fetching account data');
                             } else {
                                if(accountInfo.rows.length>0){
                                      let accountData={
                                        "FullyQualifiedName": accountInfo.rows[0].name,
                                        "PrimaryEmailAddr": {
                                          "Address": accountInfo.rows[0].email
                                        },
                                        "DisplayName": accountInfo.rows[0].name,
                                        "FamilyName": accountInfo.rows[0].first_name?accountInfo.rows[0].first_name:''+' '+accountInfo.rows[0].last_name?accountInfo.rows[0].last_name:'',
                                        "CompanyName": accountInfo.rows[0].name,
                                        "BillAddr": {
                                          "CountrySubDivisionCode": accountInfo.rows[0].state,
                                          "City": accountInfo.rows[0].city,
                                          "PostalCode": accountInfo.rows[0].zip_code,
                                          "Line1": accountInfo.rows[0].street,
                                          "Country": accountInfo.rows[0].country
                                        },
                                        "GivenName": accountInfo.rows[0].first_name?accountInfo.rows[0].first_name:''+' '+accountInfo.rows[0].last_name?accountInfo.rows[0].last_name:''
                                      }
                                      oauthClient.postApiCall({url: url + 'v3/company/' + companyID +'/customer',body:accountData})
                                      .then(function(customerResponse){
                                        console.log("The response for API call is for posting account:"+JSON.stringify(customerResponse));
                                        client.query('UPDATE ACCOUNT set quickbook_customer_id=$1 where id=$2',[customerResponse.json.Customer.Id,accountInfo.rows[0].id], function(err, updatedAccountInfo) {
                                          if (err){
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in updating account');
                                          } else {
                                              oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/query?query=select * from Item &minorversion=4'})
                                                  .then(function(itemData){
                                                      // console.log("The response for API call is :"+JSON.stringify(itemData));
                                                      done();
                                                      handleResponse.sendSuccess(res,'Quickbook data fetched successfully',{itemArray:itemData.json.QueryResponse.Item});
                                                  })
                                                  .catch(function(e) {
                                                      console.error(e);
                                                      handleResponse.handleError(res, e, ' Error in getting item info'+e);
                                                  });
                                            }
                                          });
                                      })
                                      .catch(function(e) {
                                        console.error(e);
                                        handleResponse.handleError(res, e, ' Error in posting customer info'+e);
                                      });

                                    }else{
                                      handleResponse.handleError(res, 'Error in getting account information', 'Error in getting account information');
                                    }
                                  }
                              });
                         }

                       }
                     })
                 })
                 .catch(function(e) {
                     console.error("The error message for refreshing token  is :"+e.originalMessage);
                     console.error(e.intuit_tid);
                     handleResponse.handleError(res, e, ' Error in refreshing token'+e);
                 });

            }else{
              handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
            }
        }
      });
  });

}


exports.getQuickbookData = (req,res) => {
  console.log('getQuickbookData');
  console.log(req.body);
  pool.connect((err, client, done) => {
      client.query('SELECT quickbook_token FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in fetching settings');
        } else {
            if(companySetting.rows[0].quickbook_token!=null){
              let quickbook_token = JSON.parse(companySetting.rows[0].quickbook_token);
              oauthClient = new OAuthClient({
                  clientId: quickbook_token.clientId,
                  clientSecret: quickbook_token.clientSecret,
                  environment: quickbook_token.environment,
                  redirectUri: quickbook_token.redirectUri,
                  logging:true,
                  token:quickbook_token.token
              });

              oauthClient.refresh()
                 .then(function(authResponse) {
                    //  console.log('Tokens refreshed : ' + JSON.stringify(authResponse));
                     quickbook_token.token =authResponse.token;
                     client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING *',[quickbook_token,req.user.company_id], function(err, updatedCompSetting) {
                       if (err){
                         handleResponse.shouldAbort(err, client, done);
                         handleResponse.handleError(res, err, ' Error in updating settings');
                       } else {
                         var companyID = oauthClient.getToken().realmId;
                         var url = oauthClient.environment == 'Sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production ;
                         console.log(companyID+' companyID');
                         console.log(req.body.client_qb_id);
                         if(req.body.client_qb_id!=''&&req.body.client_qb_id!=null&&req.body.client_qb_id!=undefined){

                           oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/query?query=select * from Item &minorversion=4'})
                               .then(function(itemData){
                                   console.log("The response for API call is :"+JSON.stringify(itemData));
                                   done();
                                   handleResponse.sendSuccess(res,'Quickbook data fetched successfully',{itemArray:itemData.json.QueryResponse.Item});
                               })
                               .catch(function(e) {
                                   console.error(e);
                                   handleResponse.handleError(res, e, ' Error in getting item info'+e);
                               });
                         }else{

                           client.query('SELECT * FROM ACCOUNT where name=$1 and company_id=$2',[req.body.client_name,req.user.company_id], function(err, accountInfo) {
                             if (err){
                               handleResponse.shouldAbort(err, client, done);
                               handleResponse.handleError(res, err, ' Error in fetching account data');
                             } else {
                                if(accountInfo.rows.length>0){
                                      let accountData={
                                        "FullyQualifiedName": accountInfo.rows[0].name,
                                        "PrimaryEmailAddr": {
                                          "Address": accountInfo.rows[0].email
                                        },
                                        "DisplayName": accountInfo.rows[0].name,
                                        "FamilyName": accountInfo.rows[0].first_name?accountInfo.rows[0].first_name:''+' '+accountInfo.rows[0].last_name?accountInfo.rows[0].last_name:'',
                                        "CompanyName": accountInfo.rows[0].name,
                                        "BillAddr": {
                                          "CountrySubDivisionCode": accountInfo.rows[0].state,
                                          "City": accountInfo.rows[0].city,
                                          "PostalCode": accountInfo.rows[0].zip_code,
                                          "Line1": accountInfo.rows[0].street,
                                          "Country": accountInfo.rows[0].country
                                        },
                                        "GivenName": accountInfo.rows[0].first_name?accountInfo.rows[0].first_name:''+' '+accountInfo.rows[0].last_name?accountInfo.rows[0].last_name:''
                                      }
                                      oauthClient.postApiCall({url: url + 'v3/company/' + companyID +'/customer',body:accountData})
                                      .then(function(customerResponse){
                                        console.log("The response for API call is for posting account:"+JSON.stringify(customerResponse));
                                        client.query('UPDATE ACCOUNT set quickbook_customer_id=$1 where id=$2',[customerResponse.json.Customer.Id,accountInfo.rows[0].id], function(err, updatedAccountInfo) {
                                          if (err){
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in updating account');
                                          } else {
                                              oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/query?query=select * from Item &minorversion=4'})
                                                  .then(function(itemData){
                                                      // console.log("The response for API call is :"+JSON.stringify(itemData));
                                                      done();
                                                      handleResponse.sendSuccess(res,'Quickbook data fetched successfully',{itemArray:itemData.json.QueryResponse.Item});
                                                  })
                                                  .catch(function(e) {
                                                      console.error(e);
                                                      handleResponse.handleError(res, e, ' Error in getting item info'+e);
                                                  });
                                            }
                                          });
                                      })
                                      .catch(function(e) {
                                        console.error(e);
                                        handleResponse.handleError(res, e, ' Error in posting customer info'+e);
                                      });

                                    }else{
                                      handleResponse.handleError(res, 'Error in getting account information', 'Error in getting account information');
                                    }
                                  }
                              });
                         }

                       }
                     })
                 })
                 .catch(function(e) {
                     console.error("The error message for refreshing token  is :"+e.originalMessage);
                     console.error(e.intuit_tid);
                     handleResponse.handleError(res, e, ' Error in refreshing token'+e);
                 });

            }else{
              handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
            }
        }
      });
  });


}

exports.getCompanyInfo = (req,res) => {
  pool.connect((err, client, done) => {
      client.query('SELECT quickbook_token FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in fetching settings');
        } else {
            if(companySetting.rows[0].quickbook_token!=null){
              let quickbook_token = JSON.parse(companySetting.rows[0].quickbook_token);
              oauthClient = new OAuthClient({
                  clientId: quickbook_token.clientId,
                  clientSecret: quickbook_token.clientSecret,
                  environment: quickbook_token.environment,
                  redirectUri: quickbook_token.redirectUri,
                  logging:true,
                  token:quickbook_token.token
              });

              oauthClient.refresh()
                 .then(function(authResponse) {
                    //  console.log('Tokens refreshed : ' + JSON.stringify(authResponse));
                     quickbook_token.token =authResponse.token;
                     client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING *',[quickbook_token,req.user.company_id], function(err, updatedCompSetting) {
                       if (err){
                         handleResponse.shouldAbort(err, client, done);
                         handleResponse.handleError(res, err, ' Error in updating settings');
                       } else {
                         done();
                         var companyID = oauthClient.getToken().realmId;
                         console.log(companyID+' companyID');
                         var url = oauthClient.environment == 'Sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production ;
                         oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/companyinfo/' + companyID})
                             .then(function(authResponse){
                                 console.log("The response for API call is :"+JSON.stringify(authResponse));
                                 handleResponse.sendSuccess(res,'company information fetched successfully',{authResponse});
                             })
                             .catch(function(e) {
                                 console.error(e);
                                 handleResponse.handleError(res, e, ' Error in getting company info'+e);
                             });
                       }
                     })
                 })
                 .catch(function(e) {
                     console.error("The error message for refreshing token  is :"+e.originalMessage);
                     console.error(e.intuit_tid);
                     handleResponse.handleError(res, e, ' Error in refreshing token'+e);
                 });

            }else{
              handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
            }
        }
      });
  });

};
exports.disconnectQuickbook = (req,res) =>{
  pool.connect((err, client, done) => {
      client.query('SELECT quickbook_token FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in fetching settings');
        } else {
            if(companySetting.rows[0].quickbook_token!=null){
              let quickbook_token = JSON.parse(companySetting.rows[0].quickbook_token);
              oauthClient = new OAuthClient({
                  clientId: quickbook_token.clientId,
                  clientSecret: quickbook_token.clientSecret,
                  environment: quickbook_token.environment,
                  redirectUri: quickbook_token.redirectUri,
                  logging:true,
                  token:quickbook_token.token
              });

              oauthClient.refresh()
                 .then(function(authResponse) {
                     console.log('Tokens refreshed : ' + JSON.stringify(authResponse));
                     quickbook_token.token =authResponse.token;
                    //  console.log(oauthClient);
                     oauthClient.revoke({token:quickbook_token.token.refresh_token})
                     .then(function(authResponse) {
                       console.log('Tokens revoked : ' + JSON.stringify(authResponse));
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
                       console.error("The error message for revoking token is :"+e.originalMessage);
                       console.error(e.intuit_tid);
                       handleResponse.handleError(res, e, ' Error in revoking token'+e);
                     });
                 })
                 .catch(function(e) {
                     console.error("The error message for refreshing token  is :"+e.originalMessage);
                     console.error(e.intuit_tid);
                     handleResponse.handleError(res, e, ' Error in refreshing token'+e);
                 });

            }else{
              handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
            }
        }
      });
  });

};
