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
               let webhook_url = process.env.BASE_URL+'/quickbookInvoiceUpdate/'+req.user.company_id;

                 client.query('UPDATE SETTING set quickbook_token=$1,quickbook_webhook_url=$2 where company_id=$3 RETURNING id',[oauthClient,webhook_url ,req.user.company_id], function(err, updatedSetting) {
                   if (err){
                     handleResponse.shouldAbort(err, client, done);
                     res.redirect('/integration-dashboard');
                    //  handleResponse.handleError(res, err, ' Error in updating settings');
                   } else {
                     done();
                     res.redirect('/integration-dashboard');
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

function minuteToHours(min) {
    var num = min;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    rminutes = rminutes < 10 ? '0'+rminutes : rminutes;
    rminutes = parseInt(((rminutes / 60 *100).toFixed(5))*100);
    console.log(rminutes)
    return rhours + "." + rminutes;
}


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
                     client.query('UPDATE SETTING set quickbook_token=$1,invoice_timesheet_item_id=$2,invoice_expense_item_id=$3,invoice_fixedfee_item_id=$4,invoice_other_item_id=$5 where company_id=$6 RETURNING *',[quickbook_token,req.body.timesheet_item,req.body.expense_item,req.body.fixed_fee_item,req.body.other_item,req.user.company_id], function(err, updatedCompSetting) {
                       if (err){
                         handleResponse.shouldAbort(err, client, done);
                         handleResponse.handleError(res, err, ' Error in updating settings');
                       } else {
                         var companyID = oauthClient.getToken().realmId;
                         var url = oauthClient.environment == 'Sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production ;
                         console.log(companyID+' companyID');
                         client.query('SELECT * FROM setting WHERE company_id=$1',[req.user.company_id], function (err, companySetting) {
                           if (err){
                             handleResponse.shouldAbort(err, client, done);
                             handleResponse.handleError(res, err, ' Error in fetching company data');
                           } else {
                              let companyDefaultTimezone = companySetting.rows[0].timezone;
                               client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax,i.final_amount,i.quickbook_invoice_id  FROM invoice i WHERE id=$1',[req.body.invoiceId], function (err, invoiceDetails) {
                                 if (err){
                                   handleResponse.shouldAbort(err, client, done);
                                   handleResponse.handleError(res, err, ' Error in fetching invoice data');
                                 } else {
                                    if(invoiceDetails.rows.length>0){
                                      client.query('SELECT * FROM account WHERE id=$1',[invoiceDetails.rows[0].account_id], function (err, accountDetails) {
                                        if (err){
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.handleError(res, err, ' Error in fetching account data');
                                        } else {
                                          client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id ,il.quickbook_invoice_line_id FROM invoice_line_item il WHERE  invoice_id=$1',[req.body.invoiceId], function (err, invoiceLineItems) {
                                            if (err){
                                              handleResponse.shouldAbort(err, client, done);
                                              handleResponse.handleError(res, err, ' Error in fetching invoice line item data');
                                            } else {
                                                if(invoiceLineItems.rows.length>0){
                                                  let lineItemArray = [];

                                                  for(let key=0 ; key<invoiceLineItems.rows.length;key++){
                                                    console.log(key);
                                                    if(invoiceLineItems.rows[key].timesheet_id!=null){
                                                      invoiceLineItems.rows[key].quantity = minuteToHours(invoiceLineItems.rows[key].quantity);
                                                    }
                                                    if(invoiceLineItems.rows[key].type.includes('Timesheet')){
                                                        invoiceLineItems.rows[key].ItemRef = req.body.timesheet_item;
                                                        invoiceLineItems.rows[key].ItemRefType = 'Timesheet';
                                                    } else if(invoiceLineItems.rows[key].type.includes('Fixed Fee')){
                                                        invoiceLineItems.rows[key].ItemRef = req.body.fixed_fee_item;
                                                        invoiceLineItems.rows[key].ItemRefType = 'Fixed Fee';
                                                    } else if(invoiceLineItems.rows[key].type.includes('Expense')){
                                                        invoiceLineItems.rows[key].ItemRef = req.body.expense_item;
                                                        invoiceLineItems.rows[key].ItemRefType = 'Expense';
                                                    } else {
                                                        invoiceLineItems.rows[key].ItemRef = req.body.other_item;
                                                        invoiceLineItems.rows[key].ItemRefType = 'Others';
                                                    }
                                                    let lineItemObj = {
                                                      "DetailType": "SalesItemLineDetail",
                                                      "Amount": invoiceLineItems.rows[key].total_amount,
                                                      "Description":invoiceLineItems.rows[key].note,
                                                      "SalesItemLineDetail": {
                                                        "ItemRef": {
                                                          "name": invoiceLineItems.rows[key].type,
                                                          "value": invoiceLineItems.rows[key].ItemRef
                                                        },
                                                        "TaxCodeRef": {
                                                            "value": "TAX"
                                                         },
                                                        "UnitPrice":invoiceLineItems.rows[key].unit_price,
                                                        "Qty":invoiceLineItems.rows[key].quantity,
                                                      }
                                                    }
                                                    if(invoiceLineItems.rows[key].quickbook_invoice_line_id){
                                                      lineItemObj.Id = invoiceLineItems.rows[key].quickbook_invoice_line_id;
                                                    }
                                                    lineItemArray.push(lineItemObj);
                                                  }

                                                  let invoiceData={
                                                    "Line": lineItemArray,
                                                    "TxnDate":invoiceDetails.rows[0].due_date,
                                                    "ApplyTaxAfterDiscount":false,
                                                    "AllowOnlinePayment":true,
                                                    "TxnTaxDetail": {
                                                        "TxnTaxCodeRef": {
                                                           "value": "3",
                                                           "name": "Tucson"
                                                        },
                                                        "TotalTax": invoiceDetails.rows[0].final_amount - invoiceDetails.rows[0].total_amount
                                                     },
                                                    "CustomerRef": {
                                                      "value": accountDetails.rows[0].quickbook_customer_id
                                                    }
                                                  }
                                                  if(invoiceDetails.rows[0].quickbook_invoice_id){
                                                      invoiceData.Id = invoiceDetails.rows[0].quickbook_invoice_id;
                                                      invoiceData.sparse =  true;
                                                      oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/query?query=select SyncToken from Invoice Where id = \''+invoiceData.Id +'\''})
                                                      .then(function(invoiceDetailData){
                                                        console.log("The response for API call is :"+JSON.stringify(invoiceDetailData));
                                                        invoiceData.SyncToken = invoiceDetailData.json.QueryResponse.Invoice[0].SyncToken;
                                                        oauthClient.postApiCall({url: url + 'v3/company/' + companyID +'/invoice',body:invoiceData})
                                                        .then(function(invoiceResponse){
                                                          console.log("The response for API call is for posting account:"+JSON.stringify(invoiceResponse));
                                                          invoiceResponse = invoiceResponse.json.Invoice;

                                                          invoiceLineItems.rows.forEach((lineItem,index) => {
                                                            client.query('UPDATE INVOICE_LINE_ITEM set quickbook_invoice_line_id=$1 where id=$2',[invoiceResponse.Line[index].Id,lineItem.id], function(err, updatedInvoiceLineInfo) {
                                                              if (err){
                                                                handleResponse.shouldAbort(err, client, done);
                                                                handleResponse.handleError(res, err, ' Error in updating invoice line item');
                                                              } else {

                                                                  if(index == (invoiceLineItems.rows.length-1)){
                                                                    client.query('UPDATE INVOICE set quickbook_invoice_id=$1 where id=$2',[invoiceResponse.Id,req.body.invoiceId], function(err, updatedInvoiceInfo) {
                                                                      if (err){
                                                                        handleResponse.shouldAbort(err, client, done);
                                                                        handleResponse.handleError(res, err, ' Error in updating invoice');
                                                                      } else {
                                                                        done();
                                                                        handleResponse.sendSuccess(res,'Quickbook invoice updated successfully',{});
                                                                      }
                                                                    });
                                                                  }
                                                                  // done();
                                                                  // handleResponse.sendSuccess(res,'Quickbook invoice created successfully',{});
                                                              }
                                                            });
                                                          })

                                                        })
                                                        .catch(function(e) {
                                                          console.error(e);
                                                          handleResponse.handleError(res, e, ' Error in posting customer info'+e);
                                                        });
                                                      })
                                                      .catch(function(e) {
                                                        console.error(e);
                                                        handleResponse.handleError(res, e, ' Error in getting item info'+e);
                                                      });
                                                  }else{
                                                    oauthClient.postApiCall({url: url + 'v3/company/' + companyID +'/invoice',body:invoiceData})
                                                    .then(function(invoiceResponse){
                                                      console.log("The response for API call is for posting account:"+JSON.stringify(invoiceResponse));
                                                      invoiceResponse = invoiceResponse.json.Invoice;
                                                      console.log(invoiceResponse.invoiceResponse)
                                                      invoiceLineItems.rows.forEach((lineItem,index) => {
                                                        client.query('UPDATE INVOICE_LINE_ITEM set quickbook_invoice_line_id=$1 where id=$2',[invoiceResponse.Line[index].Id,lineItem.id], function(err, updatedInvoiceLineInfo) {
                                                          if (err){
                                                            handleResponse.shouldAbort(err, client, done);
                                                            handleResponse.handleError(res, err, ' Error in updating invoice line item');
                                                          } else {

                                                            if(index == (invoiceLineItems.rows.length-1)){
                                                              client.query('UPDATE INVOICE set quickbook_invoice_id=$1 where id=$2',[invoiceResponse.Id,req.body.invoiceId], function(err, updatedInvoiceInfo) {
                                                                if (err){
                                                                  handleResponse.shouldAbort(err, client, done);
                                                                  handleResponse.handleError(res, err, ' Error in updating invoice');
                                                                } else {
                                                                  done();
                                                                  handleResponse.sendSuccess(res,'Quickbook invoice created successfully',{});
                                                                }
                                                              });
                                                            }
                                                            // done();
                                                            // handleResponse.sendSuccess(res,'Quickbook invoice created successfully',{});
                                                          }
                                                        });
                                                      })

                                                    })
                                                    .catch(function(e) {
                                                      console.error(e);
                                                      handleResponse.handleError(res, e, ' Error in posting customer info'+e);
                                                    });

                                                  }

                                                } else {
                                                    handleResponse.handleError(res, 'Invoice line item for this invoice does not exist.', 'Invoice line item for this invoice does not exist.');
                                                }
                                            }
                                          });
                                        }
                                      });

                                    } else {
                                      handleResponse.handleError(res, 'Error in getting invoice information', 'Error in getting invoice information');
                                    }
                                  }
                              });
                            }
                          });

                       }
                     })
                 })
                 .catch(function(e) {
                     console.error("The error message for refreshing token  is :");
                     console.error(e);
                     handleResponse.handleError(res, e, ' Error in refreshing token'+e);
                 });

            }else{
              handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
            }
        }
      });
  });

}

exports.quickbookInvoiceUpdate = (req,res) => {
  console.log('quickbookInvoiceUpdate');
  console.log(req.body);
  console.log(req.body.eventNotifications[0].dataChangeEvent.entities);
  let itemListFromWebhook = req.body.eventNotifications[0].dataChangeEvent.entities;
  itemListFromWebhook = itemListFromWebhook.filter(item => item.operation == 'Create').map(payment => payment.id );
  console.log('itemListFromWebhook')
  console.log(itemListFromWebhook)
  pool.connect((err, client, done) => {
    if(itemListFromWebhook.length>0){
      itemListFromWebhook.forEach((paymentItem,index) => {
          client.query('SELECT quickbook_token FROM SETTING where company_id=$1',[req.params.companyId], function(err, companySetting) {
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
                  client.query('UPDATE SETTING set quickbook_token=$1 where company_id=$2 RETURNING *',[quickbook_token,req.params.companyId], function(err, updatedCompSetting) {
                    if (err){
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in updating settings');
                    } else {
                      var companyID = oauthClient.getToken().realmId;
                      var url = oauthClient.environment == 'Sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production ;
                      console.log(companyID+' companyID');
                      console.log(paymentItem);
                      oauthClient.makeApiCall({url: url + 'v3/company/' + companyID +'/query?query=select Line from Payment Where Id= \''+paymentItem+'\''})
                      .then(function(paymentData){
                        console.log("The response for API call is :"+JSON.stringify(paymentData));
                        let paymentLineItem = paymentData.json.QueryResponse.Payment[0].Line;

                        console.log('----------paymentLineItem-------');
                        console.log(paymentLineItem);

                        if(paymentLineItem[0].LinkedTxn.length>0){
                          let linkedTxnForInvoice = paymentLineItem[0].LinkedTxn.filter(transaction =>  transaction.TxnType == 'Invoice');

                          console.log('--------------linkedTxnForInvoice-------------');
                          console.log(linkedTxnForInvoice);

                          linkedTxnForInvoice.forEach(linkedInvoiceData => {
                            console.log('------linkedInvoiceData-----');
                            console.log(linkedInvoiceData);
                            client.query('UPDATE INVOICE set status=$1 where quickbook_invoice_id=$2',['PAID',linkedInvoiceData.TxnId], function(err, updatedInvoice) {
                              if (err){
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in updating invoice');
                              } else {

                              }
                            });

                          })
                        }
                        if(index == itemListFromWebhook.length-1){
                          done();
                          handleResponse.sendSuccess(res,'Invoices updated successfully',{});
                        }
                      })
                      .catch(function(e) {
                        console.error(e);
                        handleResponse.handleError(res, e, ' Error in getting item info'+e);
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
                if(index == itemListFromWebhook.length-1){
                  handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
                }
              }
            }
          });



      })
    }else{
        handleResponse.sendSuccess(res,'No invoice to update',{});
    }
  });
  // itemListFromWebhook.forEach(paymentItem => {
  //   pool.connect((err, client, done) => {
  //     client.query('UPDATE SETTING set stripe_customer_id=$1,stripe_subscription_id=$2 where stripe_subscription_id=$3',[null,null,req.body.data.object.id], function(err, stripeSetting) {
  //         if (err){
  //           handleResponse.shouldAbort(err, client, done);
  //           handleResponse.handleError(res, err, ' Error in updating settings');
  //         } else {
  //             done();
  //             handleResponse.sendSuccess(res,'Stripes subscription data deleted successfully',{});
  //         }
  //       });
  //   });
  // })
  // res.send(200);
  // pool.connect((err, client, done) => {
  //   client.query('UPDATE INVOICE set status=$1 where quickbook_invoice_id=$2',['PAID',req.body.data.object.id], function(err, invoiceUpdated) {
  //       if (err){
  //         handleResponse.shouldAbort(err, client, done);
  //         handleResponse.handleError(res, err, ' Error in updating invoice');
  //       } else {
  //           done();
  //           handleResponse.sendSuccess(res,'Invoice updated successfully',{});
  //       }
  //     });
  // });
}


exports.getQuickbookData = (req,res) => {
  console.log('getQuickbookData');
  console.log(req.body);
  pool.connect((err, client, done) => {
      client.query('SELECT quickbook_token,invoice_timesheet_item_id,invoice_other_item_id,invoice_fixedfee_item_id,invoice_expense_item_id FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
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
                                   let companyInfoObj = {
                                     "invoice_timesheet_item_id":companySetting.rows[0].invoice_timesheet_item_id,
                                     "invoice_other_item_id":companySetting.rows[0].invoice_other_item_id,
                                     "invoice_fixedfee_item_id":companySetting.rows[0].invoice_fixedfee_item_id,
                                     "invoice_expense_item_id":companySetting.rows[0].invoice_expense_item_id
                                   }
                                   handleResponse.sendSuccess(res,'Quickbook data fetched successfully',{itemArray:itemData.json.QueryResponse.Item,company_info:companyInfoObj});
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
                                      console.log(accountInfo.rows[0].email);
                                      let accountData={
                                        "FullyQualifiedName": accountInfo.rows[0].name,
                                        "PrimaryEmailAddr": {
                                          "Address": accountInfo.rows[0].email
                                        },
                                        "DisplayName": req.user.company_info.name+'_'+accountInfo.rows[0].name,
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
