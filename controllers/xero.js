const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const XeroClient = require('xero-node').AccountingAPIClient;
let company_id;
let companyDefaultTimezone;
const xeroConfig = {
  "appType":"public",
  "callbackUrl": process.env.XERO_CALLBACKURL,
  "consumerKey": process.env.XERO_CONSUMERKEY,
  "consumerSecret": process.env.XERO_CONSUMERSECRET,
  "redirectOnError": true
};
// "privateKeyPath": "./privatekey.pem",
let xero = new XeroClient(xeroConfig);
let requestToken = null;

exports.initiateXero = (req, res) => {
  console.log('inside initiate xero');
  company_id = req.user.company_id;
  // console.log('xero');
  // console.log(xero);
  (async () => {
     try {
        requestToken = await xero.oauth1Client.getRequestToken();
        // console.log('Received Request Token:', requestToken);

        var authUrl = xero.oauth1Client.buildAuthoriseUrl(requestToken);
        // console.log('Authorisation URL:', authUrl);
        res.redirect(authUrl);
      } catch(err){
        console.log(err);
        res.redirect('/integration-dashboard');
      }

  })();
};

exports.getAuthCodeXero = (req,res) => {
  console.log('req');
  console.log(req.user);

  (async () => {
    try {
      const oauth_verifier = req.query.oauth_verifier;
      const savedRequestToken = {
          oauth_token: requestToken.oauth_token,
          oauth_token_secret: requestToken.oauth_token_secret
      };
      const accessToken = await xero.oauth1Client.swapRequestTokenforAccessToken(savedRequestToken, oauth_verifier);

      console.log('xero.oauth1Client');
      console.log(xero.oauth1Client._state);
      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            res.redirect('/integration-dashboard');
          } else {
             client.query('UPDATE SETTING set xero_token=$1,xero_enabled=$2 where company_id=$3 RETURNING *',[xero,true, req.user.company_id], function(err, updatedSetting) {
               if (err){
                 console.log(err);
                 handleResponse.shouldAbort(err, client, done);
                  //  handleResponse.handleError(res, err, ' Error in updating settings');
                  res.redirect('/integration-dashboard');
               } else {
                 client.query('COMMIT', (err) => {
                   if (err) {
                     handleResponse.shouldAbort(err, client, done);
                     res.redirect('/integration-dashboard');
                   } else {
                     done();
                    //  console.log('Received Access Token: '+accessToken);
                    //  console.log(updatedSetting.rows[0].xero_token);
                     res.redirect('/integration-dashboard');
                   }
                 })
               }
             })
           }
         })
       })

    } catch(err){
        console.log(err);
        res.redirect('/integration-dashboard');
      }

    })();

}


exports.getXeroConfirmation =(req,res) => {
  // console.log(req.query.newCompanyData);
  pool.connect((err, client, done) => {
    client.query('SELECT xero_token from SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/quickbook-company-confirmation',{user:req.user,error:err},"error"," error in finding company setting");
      } else {
        done();
        handleResponse.responseToPage(res,'pages/quickbook-company-confirmation',{companyData:companySetting.rows[0].quickbook_token,newCompanyData:req.query.newCompanyData},"success","Successfully rendered");
      }
    })
  })
}

exports.changeXeroAccount = (req,res) => {
    console.log('changeXeroAccount req.body');
    console.log(JSON.parse(req.body.newCompanyData));
    console.log(req.user.company_id);
    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          res.redirect('/integration-dashboard');
        } else {
           client.query('UPDATE INVOICE_LINE_ITEM set quickbook_invoice_line_id=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedInvoice) {
             if (err){
               handleResponse.shouldAbort(err, client, done);
              //  handleResponse.handleError(res, err, ' Error in updating invoice line item');
              res.redirect('/integration-dashboard');
             } else {
               client.query('UPDATE INVOICE set quickbook_invoice_id=$1,status=$2 where company_id=$3 AND status=$4 RETURNING id',[null,'DRAFT', req.user.company_id,'POSTED'], function(err, updatedInvoice) {
                 if (err){
                   handleResponse.shouldAbort(err, client, done);
                  //  handleResponse.handleError(res, err, ' Error in updating invoice');
                  res.redirect('/integration-dashboard');
                 } else {
                   client.query('UPDATE ACCOUNT set quickbook_customer_id=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedInvoice) {
                     if (err){
                       handleResponse.shouldAbort(err, client, done);
                      //  handleResponse.handleError(res, err, ' Error in updating account');
                      res.redirect('/integration-dashboard');
                     } else {
                        client.query('UPDATE SETTING set quickbook_token=$1,quickbook_enabled=$2,invoice_timesheet_item_id=$3,invoice_other_item_id=$3,invoice_fixedfee_item_id=$3,invoice_expense_item_id=$3 where company_id=$4 RETURNING id',[JSON.parse(req.body.newCompanyData) ,true,null,req.user.company_id], function(err, updatedSetting) {
                          if (err){
                            handleResponse.shouldAbort(err, client, done);
                            res.redirect('/integration-dashboard');
                          } else {
                            client.query('COMMIT', (err) => {
                              if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                res.redirect('/integration-dashboard');
                              } else {
                                done();
                                res.redirect('/integration-dashboard');
                              }
                            })
                          }
                        });
                      }
                    })
                  }
                })
              }
          })
        }
      })
    })
}

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

exports.postInvoiceToXero = (req,res) => {
  console.log('postInvoiceToXero');
  console.log(req.body);
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
          client.query('SELECT xero_token,xero_enabled FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
            if (err){
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in fetching settings');
            } else {
                if(companySetting.rows[0].xero_token!=null&&companySetting.rows[0].xero_enabled){
                  let quickbook_token = JSON.parse(companySetting.rows[0].xero_token);
                   client.query('SELECT * FROM setting WHERE company_id=$1',[req.user.company_id], function (err, companySetting) {
                     if (err){
                       handleResponse.shouldAbort(err, client, done);
                       handleResponse.handleError(res, err, ' Error in fetching company data');
                     } else {
                        let companyDefaultTimezone = companySetting.rows[0].timezone;
                         client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax,i.final_amount,i.xero_invoice_id  FROM invoice i WHERE id=$1',[req.body.invoiceId], function (err, invoiceDetails) {
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
                                    client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM invoice_line_item il WHERE  invoice_id=$1',[req.body.invoiceId], function (err, invoiceLineItems) {
                                      if (err){
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.handleError(res, err, ' Error in fetching invoice line item data');
                                      } else {
                                        client.query('UPDATE SETTING set invoice_timesheet_item_id=$1,invoice_expense_item_id=$2,invoice_fixedfee_item_id=$3,invoice_other_item_id=$4,xero_account_code=$5 where company_id=$6 RETURNING *',[req.body.timesheet_item,req.body.expense_item,req.body.fixed_fee_item,req.body.other_item,req.body.account_code,req.user.company_id], function(err, updatedCompSetting) {
                                          if (err){
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in updating settings');
                                          } else {
                                              if(invoiceLineItems.rows.length>0){
                                                let lineItemArray = [];
                                                for(let key=0 ; key<invoiceLineItems.rows.length;key++){
                                                  // console.log(key);
                                                  if(invoiceLineItems.rows[key].timesheet_id!=null){
                                                    invoiceLineItems.rows[key].quantity = minuteToHours(invoiceLineItems.rows[key].quantity);
                                                  }
                                                  if(invoiceLineItems.rows[key].type.includes('Timesheet')){
                                                      invoiceLineItems.rows[key].ItemCode = req.body.timesheet_item;
                                                  } else if(invoiceLineItems.rows[key].type.includes('Fixed Fee')){
                                                      invoiceLineItems.rows[key].ItemCode = req.body.fixed_fee_item;
                                                  } else if(invoiceLineItems.rows[key].type.includes('Expense')){
                                                      invoiceLineItems.rows[key].ItemCode = req.body.expense_item;
                                                  } else {
                                                      invoiceLineItems.rows[key].ItemCode = req.body.other_item;
                                                  }
                                                  let lineItemObj = {
                                                    "ItemCode": invoiceLineItems.rows[key].ItemCode,
                                                    "Description": invoiceLineItems.rows[key].note,
                                                    "Quantity": invoiceLineItems.rows[key].quantity,
                                                    "UnitAmount": invoiceLineItems.rows[key].unit_price,
                                                    "LineAmount": invoiceLineItems.rows[key].total_amount,
                                                    "AccountCode": req.body.account_code
                                                  }
                                                  // if(invoiceLineItems.rows[key].quickbook_invoice_line_id){
                                                  //   lineItemObj.Id = invoiceLineItems.rows[key].quickbook_invoice_line_id;
                                                  // }
                                                  lineItemArray.push(lineItemObj);
                                                }

                                                // "TxnDate":invoiceDetails.rows[0].due_date,
                                                // "InvoiceNumber": 'INV-0007',
                                                let invoiceData={
                                                  "Type": "ACCREC",
                                                  "Contact": {
                                                      "Name": accountDetails.rows[0].name,
                                                      "EmailAddress": accountDetails.rows[0].email
                                                  },
                                                  "Date": invoiceDetails.rows[0].created_date,
                                                  "DueDate": invoiceDetails.rows[0].due_date,
                                                  "LineAmountTypes": "Exclusive",
                                                  "Status":"AUTHORISED",
                                                  "LineItems":lineItemArray
                                                }
                                                // console.log('invoiceData');
                                                // console.log(invoiceData);
                                                if(invoiceDetails.rows[0].xero_invoice_id){
                                                  invoiceData.InvoiceNumber =  invoiceDetails.rows[0].xero_invoice_id;
                                                  (async () => {
                                                    try {
                                                        let invoiceResult = await xero.invoices.update(invoiceData);
                                                        console.log(invoiceResult);
                                                        done();
                                                        handleResponse.sendSuccess(res,'Xero invoice updated successfully',{});
                                                    } catch(err){
                                                      handleResponse.shouldAbort(err, client, done);
                                                      handleResponse.handleError(res, err, ' error in updating invoice to xero');
                                                    }
                                                  })();
                                                }else{
                                                  (async () => {
                                                    try {
                                                      let invoiceResult = await xero.invoices.create(invoiceData);
                                                      console.log('invoiceResult')
                                                      console.log(invoiceResult)
                                                      console.log(invoiceResult.Invoices[0].InvoiceNumber);
                                                      console.log(invoiceResult.Invoices[0].ValidationErrors);

                                                      client.query('UPDATE INVOICE set xero_invoice_id=$1,status=$2 where id=$3',[invoiceResult.Invoices[0].InvoiceNumber,'POSTED',req.body.invoiceId], function(err, updatedInvoiceInfo) {
                                                         if (err){
                                                           handleResponse.shouldAbort(err, client, done);
                                                           handleResponse.handleError(res, err, ' Error in updating invoice');
                                                         } else {
                                                           client.query('COMMIT', (err) => {
                                                             if (err) {
                                                               // console.log('Error committing transaction', err.stack)
                                                               handleResponse.shouldAbort(err, client, done);
                                                               handleResponse.handleError(res, err, ' Error in committing transaction');
                                                             } else {
                                                               done();
                                                               handleResponse.sendSuccess(res,'Xero invoice created successfully',{});
                                                             }
                                                           })
                                                         }
                                                       });
                                                      // done();
                                                      // handleResponse.sendSuccess(res,'Xero invoice created successfully',{});
                                                    } catch(err){
                                                      handleResponse.shouldAbort(err, client, done);
                                                      handleResponse.handleError(res, err, ' error in posting invoice to xero');
                                                    }
                                                  })();
                                                }

                                              } else {
                                                  handleResponse.shouldAbort('Invoice line item for this invoice does not exist.', client, done);
                                                  handleResponse.handleError(res, 'Invoice line item for this invoice does not exist.', 'Invoice line item for this invoice does not exist.');
                                              }
                                            }
                                          })
                                      }
                                    });
                                  }
                                });

                              } else {
                                handleResponse.shouldAbort(e, client, done);
                                handleResponse.handleError(res, 'Error in getting invoice information', 'Error in getting invoice information');
                              }
                            }
                        });
                      }
                    });

                }else{
                  handleResponse.shouldAbort('Error in fetching xero settings', client, done);
                  handleResponse.handleError(res, 'Error in fetching xero settings', 'Error in fetching xero settings');
                }
            }
          });
        }
      })
  });

}

exports.xeroInvoiceUpdate = (req,res) => {
  console.log('xeroInvoiceUpdate');
  // console.log(cryptr.decrypt(req.params.companyId));
  // console.log(req.body);
  // console.log(req.headers);
  console.log(req.body.eventNotifications[0].dataChangeEvent.entities);
  let itemListFromWebhook = req.body.eventNotifications[0].dataChangeEvent.entities;
  itemListFromWebhook = itemListFromWebhook.filter(item => item.operation == 'Create').map(payment => payment.id );
  console.log('itemListFromWebhook')
  console.log(itemListFromWebhook)
  // req.params.companyId= cryptr.decrypt(req.params.companyId);
  // console.log(req.params.companyId);
  if(itemListFromWebhook.length>0){
    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' error in connecting to database');
        } else {
          console.log('transaction begins');
            itemListFromWebhook.forEach((paymentItem,index) => {
                client.query('SELECT quickbook_token,company_id FROM SETTING WHERE quickbook_token IS NOT NULL',function(err, companySetting) {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in fetching settings');
                  } else {
                    if(companySetting.rows.length>0){
                      let selectedCompSet = companySetting.rows.filter(setting => JSON.parse(setting.quickbook_token).token.realmId == req.body.eventNotifications[0].realmId);
                      // console.log('selectedCompSet');
                      // console.log(selectedCompSet);
                      if(selectedCompSet.length>0){
                        let quickbook_token = JSON.parse(selectedCompSet[0].quickbook_token);
                        oauthClient = new OAuthClient({
                          clientId: quickbook_token.clientId,
                          clientSecret: quickbook_token.clientSecret,
                          environment: quickbook_token.environment,
                          redirectUri: quickbook_token.redirectUri,
                          logging:true,
                          token:quickbook_token.token
                        });

                        let selectedCompSetId = selectedCompSet.map(compSet => parseInt(compSet.company_id));
                        console.log('selectedCompSetId');
                        console.log(selectedCompSetId);

                        oauthClient.refresh()
                        .then(function(authResponse) {
                          //  console.log('Tokens refreshed : ' + JSON.stringify(authResponse));
                          quickbook_token.token =authResponse.token;
                          client.query('UPDATE SETTING set quickbook_token=$1 where company_id = ANY($2) RETURNING *',[quickbook_token,selectedCompSetId], function(err, updatedCompSetting) {
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
                                if(paymentData.json.QueryResponse.Payment){
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
                                }
                                if(index == itemListFromWebhook.length-1){
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      console.log('Error committing transaction', err);
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                      console.log('transaction ends');
                                      done();
                                      handleResponse.sendSuccess(res,'Invoices updated successfully',{});
                                    }
                                  })
                                }
                              })
                              .catch(function(e) {
                                console.error(e);
                                handleResponse.shouldAbort(e, client, done);
                                handleResponse.handleError(res, e, ' Error in getting item info'+e);
                              });
                            }
                          })
                        })
                        .catch(function(e) {
                          console.error("The error message for refreshing token  is :"+e.originalMessage);
                          console.error(e.intuit_tid);
                          handleResponse.shouldAbort(e, client, done);
                          handleResponse.handleError(res, e, ' Error in refreshing token '+e);

                        });

                      } else {
                        if(index == itemListFromWebhook.length-1){
                          handleResponse.shouldAbort('Error in fetching quickbook settings', client, done);
                          handleResponse.handleError(res, 'Error in fetching quickbook settings.Please reconnect to quickbook.', 'Error in fetching quickbook settings.Please reconnect to quickbook.');
                        }
                      }
                    }else{
                      if(index == itemListFromWebhook.length-1){
                        handleResponse.shouldAbort('Error in fetching quickbook settings', client, done);
                        handleResponse.handleError(res, 'Error in fetching quickbook settings', 'Error in fetching quickbook settings');
                      }
                    }
                  }
                });
            })
          }
        })
      });
  } else {
    handleResponse.sendSuccess(res,'No invoice to update',{});
  }

}

function getXeroContactItem(req,res,xero_token,companySetting){
  console.log(xero_token);
  xero.oauth1Client._state = xero_token.oauth1Client._state;
    (async () => {
      try {

        let itemList = await xero.items.get();
        let accountList = await xero.accounts.get();
        console.log(itemList);
         let companyInfoObj = {
           "invoice_timesheet_item_id":companySetting.rows[0].invoice_timesheet_item_id,
           "invoice_other_item_id":companySetting.rows[0].invoice_other_item_id,
           "invoice_fixedfee_item_id":companySetting.rows[0].invoice_fixedfee_item_id,
           "invoice_expense_item_id":companySetting.rows[0].invoice_expense_item_id,
           "xero_account_code":companySetting.rows[0].xero_account_code
         }
         handleResponse.sendSuccess(res,'Xero data fetched successfully',{itemArray:itemList.Items,accountArray:accountList.Accounts,company_info:companyInfoObj});
      } catch(err){
        console.log('err');
        console.log(err);
        // handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in getting account and item info from xero '+err);
      }

    })();
}


exports.getXeroData = (req,res) => {
  console.log('getXeroData');
  console.log(req.body);
  setting.getCompanySetting(req, res ,(err,result)=>{
    if(err==true){
      // console.log('error in setting');
      // console.log(err);
      handleResponse.handleError(res, err, "Error in finding company setting.Please Restart.");

    }else{
        companyDefaultTimezone=result.timezone;
        pool.connect((err, client, done) => {
          client.query('BEGIN', (err) => {
            if (err){
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' error in connecting to database');
            } else {
                client.query('SELECT xero_enabled,xero_token,invoice_timesheet_item_id,invoice_other_item_id,invoice_fixedfee_item_id,invoice_expense_item_id,xero_account_code FROM SETTING where company_id=$1',[req.user.company_id], function(err, companySetting) {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in fetching settings');
                  } else {
                      // console.log(companySetting.rows[0].xero_token);
                      if(companySetting.rows[0].xero_token!=null&&companySetting.rows[0].xero_enabled){
                        let xero_token = JSON.parse(companySetting.rows[0].xero_token);
                        let oauth_expires_at = xero_token.oauth1Client._state.oauth_expires_at;
                        // console.log(moment.tz(oauth_expires_at, companyDefaultTimezone).format());
                        // console.log(moment.tz(companyDefaultTimezone).format());
                        // console.log(moment.tz(oauth_expires_at, companyDefaultTimezone).diff(moment.tz(companyDefaultTimezone)));
                        if((moment.tz(oauth_expires_at, companyDefaultTimezone).diff(moment.tz(companyDefaultTimezone))) > (60*30*1000)){
                          (async () => {
                            try {
                              xero.oauth1Client._state = xero_token;
                		          let newToken = await xero.oauth1Client.refreshAccessToken();
                              xero_token.oauth1Client._state = newToken;
                              client.query('UPDATE SETTING set xero_token=$1 where company_id=$2 RETURNING id',[xero_token, req.user.company_id], function(err, updatedSetting) {
                                if (err){
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in updating settings');
                                } else {
                                  console.log('settings updated');
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      console.log(err);
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                      console.log('transaction ends');
                                      getXeroContactItem(req,res,xero_token,companySetting);
                                    }
                                  })
                                }
                              });
                            } catch(err){
                              console.log(err);
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in getting refresh token from xero '+err);
                            }
                          })();
                      		// Remember to store the new access token in your data store
                      	}else{
                            getXeroContactItem(req,res,xero_token,companySetting);
                        }
                      }else{
                        done();
                        handleResponse.handleError(res, 'Error in xero integration settings', 'Error in xero integration settings');
                      }
                    // }else{
                    //   done();
                    //   handleResponse.handleError(res, 'Error in fetching xero settings', 'Error in fetching xero settings');
                    // }
                  }
                });
              }
            })
        });
      }
    })
}

exports.disconnectXero = (req,res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
          client.query('UPDATE SETTING set xero_enabled=$1 where company_id=$2 RETURNING id',[false, req.user.company_id], function(err, updatedSetting) {
            if (err){
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in updating settings');
            } else {
              client.query('COMMIT', (err) => {
                if (err) {
                  // console.log('Error committing transaction', err.stack)
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in committing transaction');
                } else {
                  done();
                  handleResponse.sendSuccess(res,'settings updated successfully',{});
                }
              })
            }
          });
        }
      })
  });
}
