const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const stripe = require("stripe")("sk_test_2sfwqXE4Fa4YVsV0yPD9KPAr00hTIfAuJD");
stripe.setApiVersion('2019-03-14');


// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys

function addStripeToken(req,res,customer){
  stripe.customers.createSource(
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
              billing :"send_invoice",
              days_until_due : 1,
              items: [
                {
                  plan: "plan_ErfnIcSqBtHxtY",
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
                  			client.query('UPDATE SETTING set stripe_customer_id=$1 where company_id=$2 RETURNING id',[customer.id, req.user.company_id], function(err, updatedSetting) {
          			          if (err){
          			            handleResponse.shouldAbort(err, client, done);
          			            handleResponse.handleError(res, err, ' Error in updating settings');
          			          } else {
          			            done();
          			            // handleResponse.sendSuccess(res,'settings updated successfully',{});
                            handleResponse.sendSuccess(res,'Stripes data updated successfully',{customer:customer});

          			          }
        		            });

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
    stripe.customers.list({
      limit: 1,
      email: req.user.email,
    }, function(err, customers) {
      console.log('customer data');
      console.log(customers.data.length);
      console.log(customers.data);
      if(customers.data.length>0){
          addStripeToken(req,res,customers.data[0]);
      }else{
        stripe.customers.create({
          email: req.user.email,
        }, function(err, customer) {
            if(err) {
              console.log('error in creating customer');
              handleResponse.handleError(res, err, 'Error in creating customer');
            }else{
                console.log('customer');
                console.log(customer);
                addStripeToken(req,res,customer);
            }
        });
      }
    // asynchronously called
  }
);


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

}

exports.invoicePaymentDeclined = (req, res) => {
  console.log('req')
  console.log(JSON.stringify(req.body));
  handleResponse.sendSuccess(res,'webhook found successfully',{});
  // console.log(req)
  // console.log('res')
  // console.log(res)
}
