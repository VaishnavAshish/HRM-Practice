const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
stripe.setApiVersion(process.env.STRIPE_VERSION);


// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys

function addStripeToken(req,res,customer){
  stripe.customers.update(
    customer.id,
    {
      source: req.body.stripeToken,
    },
    function(err, card) {
      if(err) {
        console.log('error in creating payment');
        console.log(err);
        handleResponse.handleError(res, err, 'Error in creating payment');
      }else{
        stripe.subscriptions.create({
              customer: customer.id,
              billing :"charge_automatically",
              items: [
                {
                  plan: process.env.STRIPE_PLAN_ID,
                },
              ]
            }, function(err, subscription) {
              if(err) {
                console.log('error in creating subscription');
                console.log(err);
                handleResponse.handleError(res, err, 'Error in creating subscription');
              }else{
                stripe.invoices.list(
                  { customer: customer.id },
                  function(err, invoices) {
                    // asynchronously called
                    pool.connect((err, client, done) => {
                      client.query('BEGIN', (err) => {
                        if (err){
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' error in connecting to database');
                        } else {
                      			client.query('UPDATE SETTING set stripe_customer_id=$1,stripe_subscription_id=$2 where company_id=$3 RETURNING id',[customer.id, subscription.id, req.user.company_id], function(err, updatedSetting) {
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
                  			            // handleResponse.sendSuccess(res,'settings updated successfully',{});
                                    handleResponse.sendSuccess(res,'Your account has been successfully upgraded to paid version.Now you can integrate with other softwares. ',{customer:customer,subscription:subscription});
                                  }
                                })
              			          }
            		            });
                          }
                        })

                    });
                  }
                );

              }
            })

      }
    }
  );
}

exports.initiateStripe = (req, res) => {
    console.log(req.user);
    console.log(req.body);
    if(req.user.company_info.stripe_customer_id){
      handleResponse.handleError(res, 'Stripe subscription already enabled', 'Stripe subscription already enabled');
    }else{
        stripe.customers.list({
          limit: 1,
          email: req.user.email,
        }, function(err, customers) {
          // console.log('customer data');
          // console.log(customers.data.length);
          // console.log(customers.data);
          if(customers.data.length>0){
            addStripeToken(req,res,customers.data[0]);
          }else{
            stripe.customers.create({
              email: req.user.email,
            }, function(err, customer) {
              if(err) {
                // console.log('error in creating customer');
                handleResponse.handleError(res, err, 'Error in creating customer');
              }else{
                // console.log('customer');
                // console.log(customer);
                addStripeToken(req,res,customer);
              }
            });
          }
          // asynchronously called
        });

    }
}

exports.disableStripe = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
        console.log('SELECT stripe_customer_id,stripe_subscription_id FROM SETTING WHERE company_id=$1'+req.user.company_id);
        client.query('SELECT stripe_customer_id,stripe_subscription_id FROM SETTING WHERE company_id=$1',[req.user.company_id], function(err, stripeSetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in finding settings');
          } else {
            // done();
            stripe.subscriptions.del(
                stripeSetting.rows[0].stripe_subscription_id,
                function(err, confirmation) {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding settings');
                  } else {
                    // asynchronously called
                    // client.query('UPDATE INVOICE_LINE_ITEM set quickbook_invoice_line_id=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedInvoice) {
                    //   if (err){
                    //     handleResponse.shouldAbort(err, client, done);
                    //     handleResponse.handleError(res, err, ' Error in updating settings');
                    //   } else {
                    //     client.query('UPDATE INVOICE set quickbook_invoice_id=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedInvoice) {
                    //       if (err){
                    //         handleResponse.shouldAbort(err, client, done);
                    //         handleResponse.handleError(res, err, ' Error in updating settings');
                    //       } else {
                    //         client.query('UPDATE ACCOUNT set quickbook_customer_id=$1 where company_id=$2 RETURNING id',[null, req.user.company_id], function(err, updatedInvoice) {
                    //           if (err){
                    //             handleResponse.shouldAbort(err, client, done);
                    //             handleResponse.handleError(res, err, ' Error in updating settings');
                    //           } else {
                                  client.query('UPDATE SETTING set stripe_customer_id=$1,stripe_subscription_id=$2,quickbook_enabled=$3 where company_id=$4',[null,null,false,req.user.company_id], function(err, stripeSetting) {
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
                                          handleResponse.sendSuccess(res,'Your account has been downgrade to free version.Now you cannot integrate with other softwares.',{});
                                        }
                                      })
                                    }
                                  });
                      //           }
                      //         })
                      //       }
                      //     })
                      //   }
                      // })
                  }
                });
            }
          });
        }
      })

  });
}

exports.invoicePaymentDeclined = (req, res) => {
  console.log('req')
  console.log(JSON.stringify(req.body));
  // handleResponse.sendSuccess(res,'webhook found successfully',{});
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
        client.query('UPDATE SETTING set stripe_customer_id=$1,stripe_subscription_id=$2,quickbook_enabled=$3 where stripe_subscription_id=$4 RETURNING *',[null,null,false,req.body.data.object.id], function(err, stripeCompanySetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in updating settings');
          } else {
            // if(stripeCompanySetting.rows.length>0){
            //   client.query('UPDATE INVOICE_LINE_ITEM set quickbook_invoice_line_id=$1 where company_id=$2 RETURNING id',[null, stripeCompanySetting.rows[0].id], function(err, updatedInvoiceLineItem) {
            //     if (err){
            //       handleResponse.shouldAbort(err, client, done);
            //       handleResponse.handleError(res, err, ' Error in updating settings');
            //     } else {
            //       client.query('UPDATE INVOICE set quickbook_invoice_id=$1 where company_id=$2 RETURNING id',[null, stripeCompanySetting.rows[0].id], function(err, updatedInvoice) {
            //         if (err){
            //           handleResponse.shouldAbort(err, client, done);
            //           handleResponse.handleError(res, err, ' Error in updating settings');
            //         } else {
            //           client.query('UPDATE ACCOUNT set quickbook_customer_id=$1 where company_id=$2 RETURNING id',[null, stripeCompanySetting.rows[0].id], function(err, updatedAccount) {
            //             if (err){
            //               handleResponse.shouldAbort(err, client, done);
            //               handleResponse.handleError(res, err, ' Error in updating settings');
            //             } else {

                            client.query('COMMIT', (err) => {
                              if (err) {
                                // console.log('Error committing transaction', err.stack)
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in committing transaction');
                              } else {
                                done();
                                handleResponse.sendSuccess(res,'Stripes subscription data deleted successfully',{});
                              }
                            })
              //             }
              //           });
              //         }
              //       })
              //     }
              //   })
              // }else{
              //   client.query('COMMIT', (err) => {
              //     if (err) {
              //       // console.log('Error committing transaction', err.stack)
              //       handleResponse.shouldAbort(err, client, done);
              //       handleResponse.handleError(res, err, ' Error in committing transaction');
              //     } else {
              //       done();
              //       handleResponse.sendSuccess(res,'Stripes subscription data deleted successfully',{});
              //     }
              //   })
              // }
            }
          })
      }
    })
  });
}

exports.getIntegrationDashboard = (req, res) => {
  pool.connect((err, client, done) => {
      client.query('SELECT stripe_customer_id,stripe_subscription_id FROM SETTING WHERE company_id=$1',[req.user.company_id], function(err, stripeSetting) {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.responseToPage(res,'pages/integration-dashboard',{user:req.user,error:err,stripeCustomerId:''},"error"," error in finding company setting");
        } else {
          done();
          handleResponse.responseToPage(res,'pages/integration-dashboard',{user:req.user,error:err,stripeCustomerId:stripeSetting.rows[0].stripe_customer_id},"success","Successfully rendered");
        }
      })
    });
}

    // stripe.tokens.create({
    //   card: {
    //     number: req.body.cardNumber,
    //     exp_month: req.body.exp_month,
    //     exp_year: req.body.exp_year,
    //     cvc: req.body.cvc
    //   }
    // }, function(err, token) {
    //   // asynchronously called
    //   if(err) {
    //     console.log('error in creating token');
    //     console.log(err);
    //     handleResponse.handleError(res, err, 'Error in creating token');
    //   }else {

    // }
    // });



//     stripe.invoices.sendInvoice(invoice.id, function(err, invoice) {
//   // asynchronously called
// });

  //   const payment = stripe.paymentMethods.create({
  //     type: "card",
  //     card: {
  //       number: '4242424242424242',
  //       exp_month: 12,
  //       exp_year: 2020,
  //       cvc: '123'
  //     }
  //   }, function(err, token) {
  //     if(err) console.log('error in creating payment');
  //     const subscription = stripe.subscriptions.create({
  //       customer: "cus_4fdAW5ftNQow1a",
  //       items: [
  //         {
  //           plan: "plan_ErIx8SpaPOLjei",
  //         },
  //       ]
  //     }, function(err, subscription) {
  //       // asynchronously called
  //     }
  //   );
  // });
    // const payment = stripe.paymentMethods.create({
    //   type: "card",
    //   card: {
    //     number: '4242424242424242',
    //     exp_month: 12,
    //     exp_year: 2020,
    //     cvc: '123'
    //   }
    // }, function(err, token) {
    //
    // });


    // stripe.charges.create({
    //     amount: 2000,
    //     currency: "gbp",
    //     source: "tok_visa", // obtained with Stripe.js
    //     description: "Charge for jenny.rosen@example.com"
    //   }, function(err, charge) {
    //     // asynchronously called
    //   });
    // (async () => {
    //     // Create a Customer:
    //     const customer = await stripe.customers.create({
    //       source: 'tok_mastercard',
    //       email: 'paying.user@example.com',
    //     });
    //
    //     // Charge the Customer instead of the card:
    //     const charge = await stripe.charges.create({
    //       amount: 1000,
    //       currency: 'usd',
    //       customer: customer.id,
    //     });
    //
    //     // YOUR CODE: Save the customer ID and other info in a database for later.
    //
    //   })();
    //
    //   (async () => {
    //     // When it's time to charge the customer again, retrieve the customer ID.
    //     const charge = await stripe.charges.create({
    //       amount: 1500, // $15.00 this time
    //       currency: 'usd',
    //       customer: customer.id, // Previously stored, then retrieved
    //     });
    //   })();
    // const subscription = stripe.subscriptions.create({
    //       customer: "cus_4fdAW5ftNQow1a",
    //       items: [
    //         {
    //           plan: "plan_ErIx8SpaPOLjei",
    //         },
    //       ]
    //     }, function(err, subscription) {
    //         // asynchronously called
    //       }
    //     );
