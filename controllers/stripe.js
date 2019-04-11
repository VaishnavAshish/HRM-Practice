const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const stripe = require("stripe")("sk_test_2sfwqXE4Fa4YVsV0yPD9KPAr00hTIfAuJD");
stripe.setApiVersion('2019-03-14');


// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
exports.initiateStripe = (req, res) => {

    // const product = stripe.products.create({
    //   name: 'Timesheet Application',
    //   type: 'service',
    // });
    // const plan = stripe.plans.create({
    //   product: 'prod_CbvTFuXWh7BPJH',
    //   nickname: 'Timesheet Application',
    //   currency: 'usd',
    //   interval: 'month',
    //   amount: 10,
    // });
    stripe.customers.create({
      email: 'ruchika.mittal@athenalogics.com',
      // source: 'src_18eYalAHEMiOZZp1l9ZTjSU0',
    }, function(err, customer) {
        if(err) {
          console.log('error in creating customer');
          handleResponse.handleError(res, err, 'Error in creating customer');
        }else{
            console.log('customer');
            console.log(customer);
            stripe.tokens.create({
              card: {
                number: '4242424242424242',
                exp_month: 12,
                exp_year: 2020,
                cvc: '123'
              }
            }, function(err, token) {
              // asynchronously called
              if(err) {
                console.log('error in creating token');
                console.log(err);
                handleResponse.handleError(res, err, 'Error in creating token');
              }else {
                stripe.customers.createSource(
                  customer.id,
                  {
                    source: token.id,
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
                                  handleResponse.sendSuccess(res,'invoices found successfully',{invoices:invoices});
                                }
                              );

                            }
                          })

                    }
                  }
                );
              }
            });
          }
    });




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
  // console.log(JSON.stringify(req.body));
  console.log('req')
  handleResponse.sendSuccess(res,'webhook found successfully',{});
  // console.log(req)
  // console.log('res')
  // console.log(res)
}
