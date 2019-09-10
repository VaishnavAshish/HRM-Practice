const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const request = require('request');
const pdf = require('html-pdf');
const fs = require('fs');
const Fixer = require('fixer-node')
const fixer = new Fixer('bb5ebdb737191fd21bb0866be1706d33')
const moment = require('moment-timezone');
const setting = require('./company-setting');
const companySettingFile = require('./setting');
const jsonexport = require('jsonexport');
const email = require('./email');
let companyDefaultTimezone;
let companyDefaultCurrency;

let latestRates={'USD':1,'INR':72.41,'EUR':0.86,'CAD':1.16,'GBP':0.69,'MXN':16.69,'AUD':1.22,'VND':17460.00,'JPY':99.72,'CNY':6.05,'IDR':12574.98,'BRL':3.72,'XCD':2.42,'AWG':1.60};
const path = require('path');
/*handleError = (res, reason, message, code) => {
    // console.log("ERROR: " + reason);
    res.status(code || 500).json({"success":false,"message": message});

}
shouldAbort = (err, client, done) => {
    if (err) {
        console.error('Error in transaction', err.stack)
        client.query('ROLLBACK', (err) => {
            if (err) {
                console.error('Error rolling back client', err.stack)
            }
            // release the client back to the pool
            done();
        })
    }
    return !!err
}*/

function dateFormat(gDate) {
  return(gDate.split(' ')[0]);
}

// function dateFormat(gDate) {
//   var sDate = new Date(gDate);
//   var date = sDate.getDate();
//   var month = sDate.getMonth() + 1;
//   var year = sDate.getFullYear();
//   var formatedDate = '';
//   if (month != 10 && month != 11 && month != 12) {
//     if(date<10){
//       formatedDate = year + '-0' + month + '-0' + date;
//     }else{
//       formatedDate = year + '-0' + month + '-' + date;
//     }
//
//   } else {
//     if(date<10){
//       formatedDate = year + '-' + month + '-0' + date;
//     }else{
//       formatedDate = year + '-' + month + '-' + date;
//     }
//
//   }
//   // console.log(formatedDate);
//   return formatedDate;
// }
exports.generateInvoiceDetailCsv = (req, res) => {

  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;

         pool.connect((err, client, done) => {
           whereClause='WHERE company_id=$1 AND id=$2 '
           client.query('SELECT i.status ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id ', [req.user.company_id, req.params.invoiceId], function (err, invoice) {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in finding invoice data');
             } else {
               client.query('SELECT il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.user_role ,il.quantity ,il.record_id ,il.currency FROM INVOICE_LINE_ITEM il WHERE company_id=$1 AND invoice_id=$2', [req.user.company_id, req.params.invoiceId], function (err, invoiceItems) {
               if (err) {
                   console.error(err);
                   handleResponse.shouldAbort(err, client, done);
                   handleResponse.handleError(res, err, ' Error in finding invoice line item data');
                 } else {
                    //  console.log('---------invoice.rows---------');
                    //  console.log(invoice.rows);
                     done();
                     if(invoice.rowCount>0){
                       let invoiceCsv = 'Invoice Details: \n\n';
                         jsonexport([invoice.rows[0]],function(err, csv){
                             if(err) {
                               console.log('err');
                               console.log(err);
                               handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                             }
                            //  console.log(csv);
                            invoiceCsv += csv+'\n\n\n\n';
                            invoiceCsv += 'Invoice Item Details : \n\n';
                            jsonexport(invoiceItems.rows,function(err, invoiceItemCsv){
                                if(err) {
                                  console.log('err');
                                  console.log(err);
                                  handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                                }
                               //  console.log(csv);
                              invoiceCsv += invoiceItemCsv+'\n\n\n\n';
                               res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'invoice-' + Date.now() + '.csv\"');
                               res.writeHead(200, {
                                 'Content-Type': 'text/csv'
                               });
                               res.end(invoiceCsv);
                             });
                         });
                     }else{
                        handleResponse.handleError(res, err, ' No Invoice Found');
                     }
                   }
                 });

             }
           });
         })
       }
     });

}

exports.generateInvoiceCsv = (req, res) => {

  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;

         pool.connect((err, client, done) => {
           whereClause='WHERE company_id=$1 AND archived=$2 AND account_id IN(SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) '
           client.query('SELECT i.id ,i.status ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id ', [req.user.company_id, false], function (err, invoice) {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in finding invoice data');
             } else {
              //  console.log('---------invoice.rows---------');
              //  console.log(invoice.rows);
               done();
                   let invoiceCSV = 'Invoice Details : \n\n';
                   invoice.rows.forEach(invoiceData=>{
                     invoiceData.created_date = invoiceData.created_date?moment.tz(invoiceData.created_date, companyDefaultTimezone).format('MM-DD-YYYY'):'';
                     invoiceData.updated_date = invoiceData.updated_date?moment.tz(invoiceData.updated_date, companyDefaultTimezone).format('MM-DD-YYYY'):'';
                     invoiceData.start_date = invoiceData.start_date?moment.tz(invoiceData.start_date, companyDefaultTimezone).format('MM-DD-YYYY'):'';
                     invoiceData.due_date = invoiceData.due_date?moment.tz(invoiceData.due_date, companyDefaultTimezone).format('MM-DD-YYYY'):'';
                   })
                   jsonexport(invoice.rows,function(err, csv){
                       if(err) {
                         console.log('err');
                         console.log(err);
                         handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                       }
                      //  console.log(csv);
                      invoiceCSV += csv+'\n\n\n\n';
                       res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'invoice-' + Date.now() + '.csv\"');
                       res.writeHead(200, {
                         'Content-Type': 'text/csv'
                       });
                       res.end(invoiceCSV);
                   });


             }
           });
         })
       }
     });

}


exports.getInvoice = (req, res) => {
   setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.user, error:err},"error"," Error in finding account data");
        /*handleResponse.handleError(res, err, ' error in finding company setting');*/
      }else{
            companyDefaultTimezone = result.timezone;
            companyDefaultCurrency =result.currency;
            // console.log('companyDefaultTimezone');
            // console.log(companyDefaultTimezone);
            // console.log('companyDefaultCurrency');
            // console.log(companyDefaultCurrency);
            pool.connect((err, client, done) => {
                client.query('SELECT id, name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.user, error:err},"error"," Error in finding account data");
                        /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                    } else {

                        let accountIdArr = accountList.rows.map(function (ele) {
                            return ele.id;
                        });
                        // console.log(" *** accountIdArr *** ");
                        // console.log(accountIdArr);
                        whereClause='WHERE company_id=$1 AND archived=$2 AND account_id IN(SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) '
                        client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax,i.final_amount ,(SELECT count(*) FROM INVOICE '+whereClause+') as totalCount,(SELECT count(*) FROM INVOICE '+whereClause+' AND status ilike $3) as draftCount,(SELECT count(*) FROM INVOICE '+whereClause+' AND status ilike $4) as paidCount FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id OFFSET 0 LIMIT ' + process.env.PAGE_RECORD_NO, [req.user.company_id, false,'Draft','Paid'], function (err, invoiceList) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.user, error:err},"error"," Error in finding invoice data");
                                /*handleResponse.handleError(res, err, ' Error in finding invoice data');*/
                            } else {
                                let invoiceListArr = [];
                                /*let draftInvoice=[];
                                let approvedInvoice=[];*/
                                let totalCount=0,draftCount=0,paidCount=0;
                                if(invoiceList.rows.length>0){
                                    invoiceList.rows.forEach(function (invoice) {
                                        if(accountIdArr.includes(invoice.account_id)) {
                                            invoice['startDateFormatted'] = invoice.start_date == null ? '' : moment.tz(invoice.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                            invoice['dueDateFormatted'] = invoice.due_date == null ? '' : moment.tz(invoice.due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                            // invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                            // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
                                            invoiceListArr.push(invoice);
                                        }
                                    });
                                    totalCount=invoiceList.rows[0].totalcount;
                                    draftCount=invoiceList.rows[0].draftcount;
                                    paidCount=invoiceList.rows[0].paidcount;
                                }
                                // console.log("invoiceList");
                                // console.log(invoiceListArr);
                                done();
                                /*draftInvoice=invoiceListArr.filter(inv => inv.status=="DRAFT");
                                paidInvoice=invoiceListArr.filter(inv => inv.status=="PAID");*/
                                handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: accountList.rows, invoiceList: invoiceListArr,totalCount:totalCount, draftCount:draftCount, paidCount:paidCount, user: req.user ,companyDefaultTimezone:companyDefaultTimezone,currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD')},"success","Successfully rendered");
                                /*res.render('pages/invoices-listing', { accounts: accountList.rows, invoiceList: invoiceList.rows, user: req.user });*/
                            }
                        });
                    }
                });
            });
        }
      });

};

exports.postAddInvoice = (req, res) => {
    if(req.user){
        pool.connect((err, client, done) => {
          client.query('BEGIN', (err) => {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in connecting to database.');
            } else {
              // let start_date = dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
                client.query('SELECT * FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, defaultCompanySetting) {
                    if (err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding default invoice for the company');
                    }
                    else {
                        let companySetting=defaultCompanySetting.rows[0];
                        // let createdDate=moment.tz(new Date(), companyDefaultTimezone).format();
                        client.query('INSERT INTO INVOICE ( account_id, company_id, created_by, created_date, due_date,updated_date, account_name, start_date, currency, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [req.body.accountId, req.user.company_id, req.user.id, 'now()', 'now()' , 'now()', req.body.accountName, 'now()', companySetting.currency,companySetting.invoice_note], function (err, invoiceId) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in adding invoice data to the database');
                            } else {
                              client.query('COMMIT', (err) => {
                                if (err) {
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in committing transaction');
                                } else {
                                  done();
                                  handleResponse.sendSuccess(res,'Invoice added successfully',{"id": invoiceId.rows[0].id});
                                }
                              })
                            }
                        });
                    }
                });
              }
            })
        });
    } else{
        done();
        res.redirect('/domain');
      }

};
exports.updateInvoiceItemData = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in connecting to database.');
      } else {
        client.query('UPDATE INVOICE_LINE_ITEM set note=$1 WHERE id=$2 RETURNING id', [req.body.description, req.body.invoiceItemId], function (err, invoiceLineItem) {
            if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in updating invoice line item data');
            } else {
              client.query('COMMIT', (err) => {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in committing transaction');
                } else {
                  done();
                  handleResponse.sendSuccess(res,'Invoice line item updated successfully',{});
                  /*res.status(200).json({ "success": true, "id": id = invoiceLineItem.rows[0].id,"message":"success" });*/
                }
              })
            }
        });
      }
    })
  });
}
exports.postAddInvoiceItem = (req, res) => {
  // console.log(req.body);
  /*req.assert('expense_id', 'Expense cannot be blank').notEmpty();*/

    // console.log(req.body.invoiceItemArray);
    let count=0;
    // let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
    if(req.body.invoiceItemArray.length>0){
          req.body.invoiceItemArray.forEach( function(invoiceItemData, index) {
              // console.log(invoiceItemData);

                pool.connect((err, client, done) => {
                  client.query('BEGIN', (err) => {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in connecting to database.');
                    } else {
                        if(invoiceItemData.id!=undefined&&invoiceItemData.id!=null&&invoiceItemData.id!=""){
                            client.query('UPDATE INVOICE_LINE_ITEM set type=$1,item_date=$2,project_id=$3,updated_date=$4,total_amount=$5,note=$6 WHERE id=$7 RETURNING id', [invoiceItemData.type, moment.tz(invoiceItemData.item_date.split('T')[0], companyDefaultTimezone).format(), invoiceItemData.project_id,'now()', invoiceItemData.total_amount, invoiceItemData.note,invoiceItemData.id], function (err, invoiceLineItem) {
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in updating invoice line item data');
                                } else {
                                    // console.log(invoiceLineItem);
                                    count++;
                                    if(req.body.invoiceItemArray.length===count){
                                      client.query('COMMIT', (err) => {
                                        if (err) {
                                          // console.log('Error committing transaction', err.stack)
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.handleError(res, err, ' Error in committing transaction');
                                        } else {
                                            done();
                                            handleResponse.sendSuccess(res,'Invoice line item updated successfully',{"id": invoiceLineItem.rows[0].id});
                                        }
                                      })
                                        /*res.status(200).json({ "success": true, "id": id = invoiceLineItem.rows[0].id,"message":"success" });*/
                                    }
                                }
                            });
                        }else{
                            client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date,total_amount,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [invoiceItemData.type, moment.tz(invoiceItemData.item_date.split('T')[0], companyDefaultTimezone).format(), invoiceItemData.project_id, invoiceItemData.account_id, invoiceItemData.invoice_id, req.user.company_id, 'now()', 'now()', invoiceItemData.total_amount, invoiceItemData.note], function (err, invoiceLineItem) {
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in adding invoice line item data to the database');
                                } else {
                                    // console.log(invoiceLineItem);
                                    count++;
                                    if(req.body.invoiceItemArray.length===count){
                                      client.query('COMMIT', (err) => {
                                        if (err) {
                                          // console.log('Error committing transaction', err.stack)
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.handleError(res, err, ' Error in committing transaction');
                                        } else {
                                          done();
                                          handleResponse.sendSuccess(res,'Invoice line item updated successfully',{"id": invoiceLineItem.rows[0].id});
                                          /*res.status(200).json({ "success": true, "id": id = invoiceLineItem.rows[0].id,"message":"success" });*/
                                        }
                                      })
                                    }
                                }
                            });
                        }
                      }
                    })
                });
          });
    } else{
        handleResponse.handleError(res, err, ' Invoice item data is empty');
    }

};

function getUserBRandCR(req, res, client, err, done, userId, projectId, userRole, taskId, result) {
    // console.log('userId in getUserBRandCR');
    // console.log(userId);
    // console.log('get data for task assignment');
    // console.log(userId+' '+userRole+' '+projectId+' '+taskId);
    client.query('SELECT bill_rate, cost_rate FROM project_assignment where user_id=$1 AND user_role=$2 AND project_id=$3', [userId, userRole, projectId], function (err, userData) {
    if(err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in finding br and cr for timesheet data with task_id');
    } else {
        // console.log('-----userData.rows--');
        // console.log(userData.rows);
        if(userData.rowsCount > 0 || userRole == undefined) {
            // console.log('inside userData length greater than 0')
            return result(userData.rows[0]);
        } else {
          console.log('inside userData length less than equal to 0'+userId);
            client.query('SELECT bill_rate, cost_rate FROM users where id=$1', [userId], function (err, userBrCr) {
                if(err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding br and cr for timesheet data with user_id');
                } else {
                    // console.log('-----userData.rows--');
                    // console.log(userBrCr.rows);
                    return result(userBrCr.rows[0]);
                }
            });
        }
    }
    });
}
exports.insertNewInvoiceItem = (req, res) => {
  console.log('Inside insertNewInvoiceItem ');
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       handleResponse.handleError(res, err, ' Error in finding company setting data');
     }else{
         companyDefaultTimezone=result.timezone;
         pool.connect((err, client, done) => {
           client.query('BEGIN', (err) => {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in connecting to database.');
             } else {
               client.query('SELECT invoice_timesheet_note,invoice_fixedfee_note,invoice_expense_note,invoice_other_note FROM setting WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
                 if (err) {
                     console.error(err);
                     handleResponse.shouldAbort(err, client, done);
                     handleResponse.handleError(res, err, ' Error in finding company setting ');
                 } else {
                   client.query('SELECT currency FROM invoice WHERE id=$1', [req.body.invoiceId], function (err, invoiceDetail) {
                       if (err) {
                           console.error(err);
                           handleResponse.shouldAbort(err, client, done);
                           handleResponse.handleError(res, err, ' Error in finding invoice data for inserting new line item. ');
                       } else {
                           if(invoiceDetail.rowCount>0){
                             let invoiceLineData = {};
                             invoiceLineData.amount = parseFloat(req.body.invoice_unit_price)*parseFloat(req.body.invoice_quantity);
                             invoiceLineData.user_id = req.user.id;
                             invoiceLineData.quantity = parseFloat(req.body.invoice_quantity);
                             invoiceLineData.unit_price = parseFloat(req.body.invoice_unit_price);
                             if(req.body.description){
                               invoiceLineData.note = req.body.description;
                             }else{
                               if(req.body.invoice_line_type == 'Timesheet'){
                                  invoiceLineData.note = companySetting.rows[0].invoice_timesheet_note;
                               }else if(req.body.invoice_line_type == 'Expense'){
                                 invoiceLineData.note = companySetting.rows[0].invoice_expense_note;
                               }else if(req.body.invoice_line_type == 'Other'){
                                 invoiceLineData.note = companySetting.rows[0].invoice_other_note;
                               }
                             }
                             invoiceLineData.id = null;
                             invoiceLineData.user_role = '';
                             invoiceLineData.type = req.body.invoice_line_type;
                             invoiceLineData.currency = invoiceDetail.rows[0].currency;
                             req.body.projectId =  req.body.invoice_manual_entry_project;
                             // ['Expense', new Date(), req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, new Date(), new Date(), data.amount, data.user_id, data.quantity, data.amount, data.note, data.id, data.user_role]
                             addInvoiceLineItem(req, res, client, err, done, invoiceLineData, function (result) {
                                 if(result) {
                                   //console.log('Adding new manual entry result is :')
                                   //console.log(result);
                                   client.query('COMMIT', (err) => {
                                     if (err) {
                                       console.error('Error committing transaction', err.stack)
                                       handleResponse.shouldAbort(err, client, done);
                                       handleResponse.handleError(res, err, ' Error in committing transaction');
                                     } else {
                                        done();
                                        handleResponse.sendSuccess(res,'New invoice line item added successfully',{});
                                    }
                                  })
                                } else{
                                  handleResponse.shouldAbort('Error in creating invoice data', client, done);
                                  handleResponse.handleError(res, 'Error in creating invoice data', 'Error in creating invoice data.');
                                }
                             });
                           }else{
                             handleResponse.shouldAbort('Error in finding invoice data', client, done);
                             handleResponse.handleError(res, 'Error in finding invoice data', 'Error in finding invoice data.');
                           }
                         }
                     });
                   }
                 })
               }
             })
         });
    }
  })
}
exports.insertTimesheetInvoiceItem = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
       handleResponse.handleError(res, err, ' Error in finding company setting data');
     }else{
       companyDefaultTimezone=result.timezone;
       companyDefaultCurrency =result.currency;
        // console.log("Inside timesheet add");
        req.assert('accountId', 'Account cannot be blank').notEmpty();
        req.assert('projectId', 'Project cannot be blank').notEmpty();
        req.assert('invoiceId', 'Invoice id cannot be blank').notEmpty();
        const errors = req.validationErrors();
          if (errors) {
            if(errors.length>0){
                // console.log(errors[0].msg);
                handleResponse.handleError(res, errors, ""+errors[0].msg);
              }else{
                 handleResponse.handleError(res, errors, " Error in validating data.");
              }
          }else{

              // console.log("req.body.project_type");
              // console.log(req.body.project_type);
                if(req.body.project_type == "fixed_fee") {
                    pool.connect((err, client, done) => {
                      client.query('BEGIN', (err) => {
                        if (err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in connecting to database.');
                        } else {
                          client.query('SELECT * FROM invoice_line_item WHERE project_id=$1 AND expense_id is null', [req.body.projectId], function (err, invoiceLineItemDetail) {
                              if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in finding line item for fixed fee project ');
                              } else {
                                if(invoiceLineItemDetail.rowCount>0){
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, "Invoice for this project had already been added.Please review invoice detail.");
                                }else{
                                  client.query('SELECT *,(SELECT currency FROM ACCOUNT WHERE id=$2) as currency FROM project WHERE id=$1', [req.body.projectId,req.body.accountId], function (err, projectDetails) {
                                      if (err) {
                                          console.error(err);
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.handleError(res, err, ' Error in finding currency from project for timesheet data');
                                      } else {
                                        client.query('SELECT invoice_fixedfee_note FROM setting WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
                                            if (err) {
                                                console.error(err);
                                                handleResponse.shouldAbort(err, client, done);
                                                handleResponse.handleError(res, err, ' Error in finding company setting ');
                                            } else {

                                              if(projectDetails.rowCount > 0) {
                                                  let projectData = {};
                                                  projectData.amount = projectDetails.rows[0].project_cost != null ? parseInt(projectDetails.rows[0].project_cost) : 0;
                                                  projectData.user_id = req.user.id;
                                                  projectData.quantity = 1;
                                                  projectData.unit_price = projectDetails.rows[0].project_cost != null ? parseInt(projectDetails.rows[0].project_cost) : 0;
                                                  projectData.note = companySetting.rows[0].invoice_fixedfee_note;
                                                  projectData.id = null;
                                                  projectData.user_role = '';
                                                  projectData.type = 'Fixed Fee Project';
                                                  projectData.currency = projectDetails.rows[0].currency;
                                                  // ['Expense', new Date(), req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, new Date(), new Date(), data.amount, data.user_id, data.quantity, data.amount, data.note, data.id, data.user_role]
                                                  addInvoiceLineItem(req, res, client, err, done, projectData, function (result) {
                                                      if(result) {
                                                        client.query('COMMIT', (err) => {
                                                          if (err) {
                                                            console.error('Error committing transaction', err.stack)
                                                            handleResponse.shouldAbort(err, client, done);
                                                            handleResponse.handleError(res, err, ' Error in committing transaction');
                                                          } else {
                                                              handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
                                                          }
                                                        })
                                                      } else {
                                                        handleResponse.shouldAbort('Error in creating invoice data', client, done);
                                                        handleResponse.handleError(res, 'Error in creating invoice data', 'Error in creating invoice data');
                                                      }
                                                  });
                                                  // INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, total_amount, user_id, quantity, unit_price, note, expense_id, user_role)
                                              }
                                            }
                                          })

                                        }
                                    });
                                }

                              }
                          });
                        }
                      })
                    });
                } else {
                    // let newDate=moment.tz(new Date(), companyDefaultTimezone).format()
                    // console.log("Steps Start");
                    // console.log("Step 1");
                    if(req.body.start_date!=null&&req.body.start_date!=undefined&&req.body.start_date!='') {
                        // console.log("Step 2");
                        pool.connect((err, client, done) => {
                          client.query('BEGIN', (err) => {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in connecting to database.');
                            } else {
                              client.query('SELECT invoice_timesheet_note FROM setting WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
                                  if (err) {
                                      console.error(err);
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in finding company setting ');
                                  } else {
                                  // select resource_id, project_id, task_id, user_role, SUM(total_work_hours) as TWH from timesheet_line_item where project_id=7 AND invoiced=false AND created_date>= '2018-09-01' AND created_date<='2018-09-20' AND submitted=true GROUP BY resource_id, project_id, task_id, user_role
                                    client.query('select tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,tl.week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime  ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id from timesheet_line_item tl where submitted=$1 and invoiced=$2 and billable=$3 and project_id=$4 AND created_date>= $5 AND created_date<=$6 order by project_id, resource_id, user_role', [true, false, true, req.body.projectId, moment.tz(req.body.start_date.split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.end_date.split('T')[0], companyDefaultTimezone).format()], function (err, lineItems) {
                                        if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in finding timesheet data with start_date');
                                        }  else {
                                            if(lineItems.rows.length>0) {
                                              createGroupedObjWithProject(lineItems.rows, function (concatData) {
                                                  // console.log("response get");
                                                  // console.log(concatData);
                                                  client.query('SELECT pa.id ,pa.company_id ,pa.account_id ,pa.user_id ,pa.project_id ,pa.created_by ,pa.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,pa.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,pa.bill_rate ,pa.cost_rate ,pa.user_role ,pa.record_id FROM PROJECT_ASSIGNMENT pa WHERE project_id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, projectAssignments) {
                                                      if (err) {
                                                          handleResponse.shouldAbort(err, client, done);
                                                          handleResponse.handleError(res, err, ' Error in finding project assginment for timesheet data');
                                                      } else {
                                                          calculateBR_CR_andGrouped(req, res, client, err, done, concatData, projectAssignments.rows, function(projectRows) {
                                                              console.log("Grouped and calculate data");
                                                              console.log(JSON.stringify(projectRows));
                                                              console.log(companySetting.rows[0].invoice_timesheet_note);
                                                              projectRows.forEach(function (projectRow, index) {
                                                                  client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, amount, total_amount, quantity, currency, timesheet_row_id, user_id, user_role, unit_price,timesheet_id,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id', ['Timesheet', 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', projectRow.totalProjectCost, projectRow.totalProjectCost, parseInt(projectRow.totalHours), companyDefaultCurrency, projectRow.lineItemIds, projectRow.resource_id, projectRow.user_role, parseInt(projectRow.unit_price), projectRow.timesheet_id,companySetting.rows[0].invoice_timesheet_note], function (err, invoiceLineItem) {
                                                                      if (err) {
                                                                          console.error(err);
                                                                          handleResponse.shouldAbort(err, client, done);
                                                                          handleResponse.handleError(res, err, ' Error in adding invoice line item data to the database');
                                                                      } else {
                                                                          // console.log("Line Item inserted");
                                                                          createRecordArr(projectRow.lineItemIds, function (lineItemIds) {
                                                                              // console.log(lineItemIds);
                                                                              client.query('UPDATE TIMESHEET_LINE_ITEM SET invoiced=$1,invoice_id=$2 WHERE id IN '+lineItemIds, [true,req.body.invoiceId], function (err, timesheetUpdatedItem) {
                                                                                  if (err) {
                                                                                      console.error(err);
                                                                                      handleResponse.shouldAbort(err, client, done);
                                                                                      handleResponse.handleError(res, err, ' Error in updating timesheet data');
                                                                                  } else {
                                                                                      if(projectRows.length == (index+1)) {
                                                                                        client.query('COMMIT', (err) => {
                                                                                          if (err) {
                                                                                            console.error('Error committing transaction', err.stack)
                                                                                            handleResponse.shouldAbort(err, client, done);
                                                                                            handleResponse.handleError(res, err, ' Error in committing transaction');
                                                                                          } else {
                                                                                            done();
                                                                                            handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
                                                                                          }
                                                                                        })
                                                                                      }
                                                                                  }
                                                                              });
                                                                          });
                                                                      }
                                                                  });
                                                              });
                                                          });
                                                      }
                                                  });
                                              });

                                            } else {
                                                // console.log("Step 18");
                                                done();
                                                handleResponse.handleError(res, 'timesheet not found', ' No timesheet associated with this project is left for invoicing');
                                            }
                                        }
                                    });
                                  }
                                })
                              }
                            })
                         });
                    }else{
                        pool.connect((err, client, done) => {
                          client.query('BEGIN', (err) => {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in connecting to database.');
                            } else {
                              client.query('SELECT invoice_timesheet_note FROM setting WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
                                  if (err) {
                                      console.error(err);
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in finding company setting ');
                                  } else {
                                    client.query('select tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,tl.week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime  ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id from timesheet_line_item tl where submitted=$1 and invoiced=$2 and billable=$3 and project_id=$4 order by project_id, resource_id, user_role', [true, false, true, req.body.projectId], function (err, lineItems) {
                                        if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in finding timesheet data');
                                        }  else {
                                            if(lineItems.rows.length>0) {
                                                console.log('lineitem data is')
                                                console.log(JSON.stringify(lineItems.rows));
                                                createGroupedObjWithProject(lineItems.rows, function (concatData) {
                                                    console.log("response get");
                                                    console.log("concatdata"+JSON.stringify(concatData));
                                                    client.query('SELECT pa.id ,pa.company_id ,pa.account_id ,pa.user_id ,pa.project_id ,pa.created_by ,pa.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,pa.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,pa.bill_rate ,pa.cost_rate ,pa.user_role ,pa.record_id FROM PROJECT_ASSIGNMENT pa WHERE project_id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, projectAssignments) {
                                                        if (err) {
                                                            handleResponse.shouldAbort(err, client, done);
                                                            handleResponse.handleError(res, err, ' Error in finding project assginment for timesheet data');
                                                        } else {
                                                            calculateBR_CR_andGrouped(req, res, client, err, done, concatData, projectAssignments.rows, function(projectRows) {
                                                                console.log("Grouped and calculate data");
                                                                console.log(JSON.stringify(projectRows));
                                                                projectRows.forEach(function (projectRow, index) {
                                                                    client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, amount, total_amount, quantity, currency, timesheet_row_id, user_id, user_role, unit_price,timesheet_id,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id', ['Timesheet', 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', projectRow.totalProjectCost, projectRow.totalProjectCost, parseInt(projectRow.totalHours), companyDefaultCurrency, projectRow.lineItemIds, projectRow.resource_id, projectRow.user_role, parseInt(projectRow.unit_price),projectRow.timesheet_id,companySetting.rows[0].invoice_timesheet_note], function (err, invoiceLineItem) {
                                                                        if (err) {
                                                                            console.error(err);
                                                                            handleResponse.shouldAbort(err, client, done);
                                                                            handleResponse.handleError(res, err, ' Error in adding invoice line item data to the database');
                                                                        } else {
                                                                            // console.log("Line Item inserted");
                                                                            createRecordArr(projectRow.lineItemIds, function (lineItemIds) {
                                                                                // console.log(lineItemIds);
                                                                                client.query('UPDATE TIMESHEET_LINE_ITEM SET invoiced=$1,invoice_id=$2 WHERE id IN '+lineItemIds, [true,req.body.invoiceId], function (err, timesheetUpdatedItem) {
                                                                                    if (err) {
                                                                                        console.error(err);
                                                                                        handleResponse.shouldAbort(err, client, done);
                                                                                        handleResponse.handleError(res, err, ' Error in updating timesheet data');
                                                                                    } else {
                                                                                        if(projectRows.length == (index+1)) {
                                                                                          client.query('COMMIT', (err) => {
                                                                                            if (err) {
                                                                                              console.error('Error committing transaction', err.stack)
                                                                                              handleResponse.shouldAbort(err, client, done);
                                                                                              handleResponse.handleError(res, err, ' Error in committing transaction');
                                                                                            } else {
                                                                                              done();
                                                                                              handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
                                                                                            }
                                                                                          })
                                                                                        }
                                                                                    }
                                                                                });
                                                                            });
                                                                        }
                                                                    });
                                                                });
                                                            });
                                                        }
                                                    });
                                                });
                                            } else {
                                                // console.log("Step 18");
                                                done();
                                                handleResponse.handleError(res, 'timesheet not found', ' No timesheet associated with this project is left for invoicing');
                                            }
                                        }
                                    });
                                  }
                                })
                              }
                            })
                         });
                    }
                }

          }
        }
      });

};

function createGroupedObjWithProject(lineItems, callback) {
    // console.log("method called");
    let groupedArr = [];
    let totalHours = 0;
    lineItems.forEach(function (line, index) {
        let arrLength = groupedArr.length;
        if(index == 0) {
            line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
            idArr = [];
            idArr.push(line.id);
            line.lineIds = idArr;
            groupedArr.push(line);
        } else {
            if(line.project_id != groupedArr[arrLength-1].project_id) {
                line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
                idArr = [];
                idArr.push(line.id);
                line.lineIds = idArr;
                groupedArr.push(line);
            } else {
                if(line.resource_id != groupedArr[arrLength-1].resource_id) {
                    line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
                    idArr = [];
                    idArr.push(line.id);
                    line.lineIds = idArr;
                    groupedArr.push(line);
                } else {
                    if(line.user_role != groupedArr[arrLength-1].user_role) {
                        line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
                        idArr = [];
                        idArr.push(line.id);
                        line.lineIds = idArr;
                        groupedArr.push(line);
                    } else {
                        groupedArr[arrLength-1].totalHours += parseInt(line.total_work_hours);
                        groupedArr[arrLength-1].lineIds.push(line.id);
                    }
                }
            }

        }
        if(lineItems.length == (index+1)) {
            return callback(groupedArr);
        }
    });
}

// function createGroupedObjWithTask(lineItems, callback) {
//     // console.log("method called");
//     let groupedArr = [];
//     let totalHours = 0;
//     lineItems.forEach(function (line, index) {
//         let arrLength = groupedArr.length;
//         if(index == 0) {
//             line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
//             idArr = [];
//             idArr.push(line.id);
//             line.lineIds = idArr;
//             groupedArr.push(line);
//         } else {
//             if(line.task_id != groupedArr[arrLength-1].task_id) {
//                 line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
//                 idArr = [];
//                 idArr.push(line.id);
//                 line.lineIds = idArr;
//                 groupedArr.push(line);
//             } else {
//                 if(line.resource_id != groupedArr[arrLength-1].resource_id) {
//                     line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
//                     idArr = [];
//                     idArr.push(line.id);
//                     line.lineIds = idArr;
//                     groupedArr.push(line);
//                 } else {
//                     if(line.user_role != groupedArr[arrLength-1].user_role) {
//                         line.totalHours = parseInt(totalHours) + parseInt(line.total_work_hours);
//                         idArr = [];
//                         idArr.push(line.id);
//                         line.lineIds = idArr;
//                         groupedArr.push(line);
//                     } else {
//                         groupedArr[arrLength-1].totalHours += parseInt(line.total_work_hours);
//                         groupedArr[arrLength-1].lineIds.push(line.id);
//                     }
//                 }
//             }
//
//         }
//         if(lineItems.length == (index+1)) {
//             return callback(groupedArr);
//         }
//     });
// }

function calculateBR_CR_andGrouped(req, res, client, err, done, concatData, projectAssignments, callback) {
    console.log('inside calculate br and cr and group');
    console.log(JSON.stringify(concatData));
    // console.log(JSON.stringify(projectAssignments));
    let projectArr = [];
    concatData.forEach(function (mergedRow, index) {
        // console.log('concatenated data is')
        // console.log(JSON.stringify(mergedRow));
        getUserBRandCR(req, res, client, err, done, mergedRow.resource_id, mergedRow.project_id, mergedRow.user_role, mergedRow.task_id, function(response) {
            // console.log('user bill rate and cost rates are');
            // console.log(JSON.stringify(response));
            let projectObj = {};
            let arrLength = projectArr.length;
            var perMinuteCost = parseInt(response.bill_rate)/60;

            //// console.log("perMinuteCost");
            //// console.log(perMinuteCost);

            let invoicedAmount = parseInt(mergedRow.totalHours) * perMinuteCost;

            //// console.log("invoicedAmount");
            //// console.log(invoicedAmount);

            let totalAmount = parseFloat(invoicedAmount);

            //// console.log("totalAmount");
            //// console.log(totalAmount);

            /* totalAmount += parseFloat(invoicedAmount); */
            // let unit_price = projectAssignments.filter(function (projectAssign) {
            //     if(projectAssign.user_id == mergedRow.resource_id && projectAssign.user_role == mergedRow.user_role) {
            //         return projectAssign.bill_rate;
            //     }
            // });
            // console.log('unit_price'+unit_price);
            console.log(projectArr[arrLength-1]+' '+mergedRow.resource_id+' '+index);

            if(index == 0) {
                projectObj.project_id = mergedRow.project_id;
                projectObj.timesheet_id = mergedRow.timesheet_id;
                projectObj.totalHours = parseInt(mergedRow.totalHours);
                projectObj.company_id = mergedRow.company_id;
                projectObj.resource_id = mergedRow.resource_id;
                projectObj.user_role = mergedRow.user_role;
                projectObj.totalProjectCost = totalAmount;
                projectObj.unit_price = response.bill_rate;
                projectObj.lineItemIds = mergedRow.lineIds;
                projectArr.push(projectObj);
            } else {
                if (mergedRow.resource_id != projectArr[arrLength-1].resource_id) {
                    projectObj.project_id = mergedRow.project_id;
                    projectObj.timesheet_id = mergedRow.timesheet_id;
                    projectObj.totalHours = parseInt(mergedRow.totalHours);
                    projectObj.company_id = mergedRow.company_id;
                    projectObj.resource_id = mergedRow.resource_id;
                    projectObj.user_role = mergedRow.user_role;
                    projectObj.totalProjectCost = totalAmount;
                    projectObj.unit_price = response.bill_rate;
                    projectObj.lineItemIds = mergedRow.lineIds;
                    projectArr.push(projectObj);
                } else {
                    if(mergedRow.user_role != projectArr[arrLength-1].user_role) {
                        projectObj.project_id = mergedRow.project_id;
                        projectObj.timesheet_id = mergedRow.timesheet_id;
                        projectObj.totalHours = parseInt(mergedRow.totalHours);
                        projectObj.company_id = mergedRow.company_id;
                        projectObj.resource_id = mergedRow.resource_id;
                        projectObj.user_role = mergedRow.user_role;
                        projectObj.totalProjectCost = totalAmount;
                        projectObj.unit_price = response.bill_rate;
                        projectObj.lineItemIds = mergedRow.lineIds;
                        projectArr.push(projectObj);
                    } else {
                        projectArr[arrLength-1].totalHours += parseInt(mergedRow.totalHours);
                        projectArr[arrLength-1].totalProjectCost += totalAmount;
                        projectArr[arrLength-1].lineItemIds = projectArr[arrLength-1].lineItemIds.concat(mergedRow.lineIds);
                    }
                }
            }
            if(concatData.length == (index + 1)) {
                // projectObj.totalProjectCost = totalAmount;
                return callback(projectArr);
            }
        });
    });
}

function createRecordArr(idsArr, callback) {
    // console.log("idsArr");
    // console.log(idsArr);
    // console.log(idsArr.length);
    let timesheetIds = '';
    idsArr.forEach(function (lineId, index) {
    let line_item = lineId;
    if((idsArr.length-1) == index) {
        timesheetIds = timesheetIds + line_item;
    } else {
        timesheetIds = timesheetIds + line_item + ', ';
    }
    });
    timesheetIds = '(' + timesheetIds + ')';
    return callback(timesheetIds);
}

function concatTimesheetData(timesheetData, callback) {
    // console.log("Function Called");
    // console.log(timesheetData.length);
    let responseArr = [];
    let billHours = 0;
    timesheetData.forEach(function (timesheetRow, index) {
        if(index == 0) {
            // console.log("0");
            timesheetRow.billHours = billHours + parseInt(timesheetRow.total_billable_hours);
            let idArr = [];
            idArr.push(timesheetRow.id);
            timesheetRow.rowIds = idArr;
            responseArr.push(timesheetRow);
        } else {
            if(parseInt(timesheetRow.resource_id) != responseArr[(responseArr.length)-1].resource_id) {
                // console.log("1");
                timesheetRow.billHours = billHours + parseInt(timesheetRow.total_billable_hours);
                let idArr = [];
                idArr.push(timesheetRow.id);
                timesheetRow.rowIds = idArr;
                responseArr.push(timesheetRow);
            } else {
                // console.log(responseArr[(responseArr.length)-1].user_role);
                // console.log(timesheetRow.user_role)
                if(timesheetRow.user_role != responseArr[(responseArr.length)-1].user_role) {
                    // console.log("2");
                    timesheetRow.billHours = billHours + parseInt(timesheetRow.total_billable_hours);
                    let idArr = [];
                    idArr.push(timesheetRow.id);
                    timesheetRow.rowIds = idArr;
                    responseArr.push(timesheetRow);
                } else {
                    // console.log("3");
                    responseArr[(responseArr.length)-1].billHours += parseInt(timesheetRow.total_billable_hours);
                    responseArr[(responseArr.length)-1].rowIds.push(timesheetRow.id);
                }
            }
        }

        if((index+1) == timesheetData.length) {
            return callback(responseArr);
        }
    })
}

exports.insertExpenseInvoiceItem = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
       handleResponse.handleError(res, err, ' Error in finding company setting data');
     }else{
         companyDefaultTimezone=result.timezone;
        req.assert('accountId', 'Account cannot be blank').notEmpty();
        req.assert('projectId', 'Project cannot be blank').notEmpty();
        req.assert('invoiceId', 'Invoice id cannot be blank').notEmpty();
        const err = req.validationErrors();
        if (err) {
            handleResponse.handleError(res, err, err.message);
        } else {
            // console.log(req.body.start_date);
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                  client.query('SELECT invoice_expense_note FROM setting WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding company setting ');
                    } else {
                    // console.log("Step 1");
                      if(req.body.start_date!=null&&req.body.start_date!=undefined&&req.body.start_date!='') {
                          client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id FROM EXPENSE e WHERE company_id=$1 AND account_id=$2 AND project_id=$3 AND invoiced=$4 AND expense_date>=$5 AND expense_date<=$6 AND billable=$7 AND submitted=$8', [req.user.company_id, req.body.accountId, req.body.projectId,false,moment.tz(req.body.start_date.split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.end_date.split('T')[0], companyDefaultTimezone).format(),true,true], function (err, expenseList) {
                              if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in finding expense data');
                              }  else {
                                  // console.log("Step 2");
                                  // console.log('expense list to be invoiced is '+JSON.stringify(expenseList));
                                  let count=0;
                                  if(expenseList.rows.length>0){
                                      expenseList.rows.forEach(function (expense) {
                                          expense.user_role = '';
                                          expense.quantity = '1';
                                          expense.note = companySetting.rows[0].invoice_expense_note;
                                          expense.type = 'Expense';
                                          expense.amount = expense.total_amount;
                                          expense.unit_price = expense.total_amount;
                                          addInvoiceLineItem(req, res, client, err, done, expense, function (result) {
                                              // console.log("Step 3");
                                              if(result) {
                                              updateExpenseRecord(req, res, client, err, done, expense, function (result) {
                                                  // console.log("Step 4");
                                                  if(result) {
                                                      count++;
                                                      // done();
                                                      console.log('expense added to invoice are');
                                                      console.log(expense);
                                                      console.log(count);

                                                      if(expenseList.rows.length===count){
                                                        client.query('COMMIT', (err) => {
                                                          if (err) {
                                                            // console.log('Error committing transaction', err.stack)
                                                            handleResponse.shouldAbort(err, client, done);
                                                            handleResponse.handleError(res, err, ' Error in committing transaction');
                                                          } else {
                                                            done();
                                                            handleResponse.sendSuccess(res,'Invoice line item for expense data added successfully',{});
                                                            /*res.status(200).json({ "success": true, "message":"success" });*/
                                                          }
                                                        })
                                                      } else{
                                                        // handleResponse.shouldAbort(' Error in creating invoice line item for expense data', client, done);
                                                        // handleResponse.handleError(res, ' Error in creating invoice line item for expense data', ' Error in creating invoice line item for expense data');
                                                          // console.log('count is '+count+' and length is '+expenseList.rows.length);
                                                      }
                                                  }
                                              });
                                              }
                                          });
                                      });
                                  } else {
                                      // console.log("Step 5");
                                      done();
                                      handleResponse.handleError(res, 'expense not found', ' No expense associated with this project is left for invoicing');
                                  }
                              }
                          });
                      } else {
                          // pool.connect((err, client, done) => {
                          client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id FROM EXPENSE e WHERE company_id=$1 AND account_id=$2 AND project_id=$3 AND invoiced=$4 AND billable=$5 AND submitted=$6', [req.user.company_id, req.body.accountId, req.body.projectId,false,true,true], function (err, expenseList) {
                              if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in finding expense data');
                              }  else {
                                  // console.log('expense list to be invoiced is '+JSON.stringify(expenseList));
                                  let count=0;
                                  if(expenseList.rows.length>0){
                                      expenseList.rows.forEach(function (expense) {
                                          expense.user_role = '';
                                          expense.quantity = '1';
                                          expense.note = companySetting.rows[0].invoice_expense_note;
                                          expense.type = 'Expense';
                                          expense.amount = expense.total_amount;
                                          expense.unit_price = expense.total_amount;
                                          addInvoiceLineItem(req, res, client, err, done, expense, function (result) {
                                              if(result) {
                                                  updateExpenseRecord(req, res, client, err, done, expense, function (result) {
                                                      if(result) {
                                                          count++;
                                                          // done();
                                                          console.log('expense added to invoice are');
                                                          console.log(expense);
                                                          console.log(count);

                                                          if(expenseList.rows.length===count){
                                                            client.query('COMMIT', (err) => {
                                                              if (err) {
                                                                // console.log('Error committing transaction', err.stack)
                                                                handleResponse.shouldAbort(err, client, done);
                                                                handleResponse.handleError(res, err, ' Error in committing transaction');
                                                              } else {
                                                                done();
                                                                handleResponse.sendSuccess(res,'Invoice line item for expense data added successfully',{});
                                                              }
                                                            })
                                                              /*res.status(200).json({ "success": true, "message":"success" });*/
                                                          } else{
                                                            // handleResponse.shouldAbort(' Error in creating invoice line item for expense data', client, done);
                                                            // handleResponse.handleError(res, ' Error in creating invoice line item for expense data', ' Error in creating invoice line item for expense data');
                                                              // console.log('count is '+count+' and length is '+expenseList.rows.length);
                                                          }
                                                      }
                                                  });
                                              }
                                          });
                                      });
                                  } else {
                                      done();
                                      handleResponse.handleError(res, 'expense not found', ' No expense associated with this project is left for invoicing');
                                  }
                              }
                          });
                      }
                    }
                  })
                }
              })
            });
        }
      }
    });
};

function addInvoiceLineItem(req, res, client, err, done, data, result) {

    // console.log("expense.note");
    // console.log(data);
    let timesheet_id=null;
    let expense_id = null;

    // let currency = companyDefaultCurrency;
    let type = data.type;
    let currency=data.currency;
    if(data.id){
      if(type == "Expense") {
        expense_id = data.id;
        timesheet_id = null;
        // data.note = 'Expenses';

      } else {
        timesheet_id = data.id;
        expense_id = null;
        // data.note = 'Hours';
      }
    }
    // if(!data.note) {
    //     data.note = ''
    // }
    // console.log('companyDefaultCurrency');
    // console.log(companyDefaultCurrency);
    // let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
    // client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, total_amount, user_id, quantity, unit_price, note, timesheet_id, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id', ['Timesheet', new Date(), req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, new Date(), new Date(), invoicedAmount, timesheet.resource_id, timesheet.user_role,parseInt(response.bill_rate), parseInt(timesheet.total_billable_hours), timesheet.id], function (err, invoiceLineItem) {
    console.log(req.body.projectId);
    client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, total_amount, user_id, quantity, unit_price, note, expense_id, timesheet_id, user_role,currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id', [type, 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', data.amount, data.user_id, data.quantity, data.unit_price, data.note, expense_id, timesheet_id, data.user_role, currency], function (err, invoiceLineItem) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in adding invoice line item data to the database');
        } else {
            // console.log("inserted invoiceLineItem");
            // console.log();
            return result(true);

        }
    });
}

function updateExpenseRecord(req, res, client, err, done, expense, result) {
    // let newD=moment.tz(new Date(), companyDefaultTimezone).format();
    client.query('UPDATE expense SET invoiced=$1,invoice_id=$2,modified_date=$3 WHERE id=$4', [true,req.body.invoiceId,'now()',expense.id], function (err, expenseUpdatedItem) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in updating expense data');
        } else {
            // console.log("updated expense");
            return result(true);
        }
    });
}

function getUserDetails(req, res, client, err, done, result) {
    client.query('SELECT u.id ,u.email ,u.password ,u.username ,u.company_id ,u.user_role ,u.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,u.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,u.first_name ,u.last_name ,u.phone ,u.mobile ,u.designation ,u.archived ,u.password_reset_token ,u.add_status ,u.bill_rate ,u.cost_rate ,u.permissions ,u.role ,u.record_id FROM users u WHERE company_id=$1', [req.user.company_id], function (err, userDetails) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            /*handleResponse.handleError(res, err, ' Error in finding invoice data');*/
        } else {
            return result(userDetails.rows);
        }
    });
}

function minuteToHours(min) {
    var num = min;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    rminutes = rminutes < 10 ? '0'+rminutes : rminutes;
    return rhours + ":" + rminutes;
}

exports.getInvoiceDetails = (req, res) => {
    setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.user, error:err},"error"," Error in finding account data");
        /*handleResponse.handleError(res, err, ' error in finding company setting');*/
      }else{
            companyDefaultTimezone = result.timezone;
            companyDefaultCurrency =result.currency;
            // console.log('companyDefaultTimezone');
            // console.log(companyDefaultTimezone);
            // console.log('companyDefaultCurrency');
            // console.log(companyDefaultCurrency);
            let invoiceId=req.query.invoiceId;
            if(invoiceId==''||invoiceId==null||invoiceId==undefined){
                handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:err},"error"," Invoice id is not correct");
            }else{

                pool.connect((err, client, done) => {
                  client.query('BEGIN', (err) => {
                    if (err){
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' error in connecting to database');
                    } else {
                      client.query('SELECT invoice_email_subject,invoice_email_body FROM setting WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
                          if (err) {
                              console.error(err);
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in finding company setting ');
                          } else {
                            client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax,i.final_amount  FROM INVOICE i WHERE company_id=$1 AND id=$2', [req.user.company_id, req.query.invoiceId], function (err, invoiceDetails) {
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:err},"error"," Error in finding invoice data");
                                    /*handleResponse.handleError(res, err, ' Error in finding invoice data');*/
                                }  else {
                                    if(invoiceDetails.rows.length>0){
                                      client.query('SELECT * FROM ACCOUNT WHERE id=$1', [invoiceDetails.rows[0].account_id], function (err, accountData) {
                                        if (err) {
                                          console.error(err);
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:err},"error"," Error in finding account data");
                                          /*handleResponse.handleError(res, err, ' Error in finding invoice data');*/
                                        }  else {
                                            // console.log('account id is '+invoiceDetails.rows[0].account_id)
                                            client.query('SELECT * FROM PROJECT WHERE company_id=$1 AND account_id=$2 AND archived=$3 AND billable=$4 ORDER BY id', [req.user.company_id, invoiceDetails.rows[0].account_id,false,true], function (err, projects) {
                                                if (err) {
                                                    console.error(err);
                                                        handleResponse.shouldAbort(err, client, done);
                                                        handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:err},"error"," Error in finding project data");
                                                        /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                                                    }  else {
                                                            // console.log('projects are '+JSON.stringify(projects));
                                                            client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM INVOICE_LINE_ITEM il WHERE company_id=$1 AND invoice_id=$2 AND archived=$3 ORDER BY project_id,timesheet_id,expense_id,created_date', [req.user.company_id, req.query.invoiceId, false], function (err, invoiceItems) {
                                                            if (err) {
                                                                console.error(err);
                                                                handleResponse.shouldAbort(err, client, done);
                                                                handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:err},"error"," Error in finding invoice line item data");
                                                                /*handleResponse.handleError(res, err, ' Error in finding invoice line item data');*/
                                                            } else {
                                                                let invoice_total_amount=0,invoice_taxable_amount=0;
                                                                if (invoiceItems.rows.length > 0) {
                                                                    invoiceItems.rows.forEach(function (lineItem) {
                                                                        // lineItem["item_date"] = dateFormat(moment.tz(lineItem.item_date, companyDefaultTimezone).format());
                                                                        lineItem["item_date"] = dateFormat(lineItem.item_date);
                                                                        lineItem.inv_qauntity = lineItem.quantity;
                                                                        // console.log('lineItem');
                                                                        // console.log(lineItem);
                                                                        if(lineItem.type == "Timesheet" && lineItem.timesheet_row_id) {
                                                                            lineItem.inv_qauntity = minuteToHours(lineItem.quantity);
                                                                        }
                                                                        // console.log(lineItem.total_amount+' '+typeof(lineItem.total_amount)+' '+parseFloat(lineItem.total_amount));
                                                                        /*let currentCurrency=currencyWithSymbolArray.filter(function(currency){
                                                                          return currency.name == invoiceDetails.rows[0].currency;
                                                                        })

                                                                        currentCurrency=parseFloat(currentCurrency[0].value);
                                                                        // console.log('currentCurrency '+JSON.stringify(currentCurrency));
                                                                        //
                                                                        // console.log('lineItem.currency' +lineItem.currency);
                                                                        let previousCurrency=currencyWithSymbolArray.filter(function(currency){
                                                                          return currency.name == lineItem.currency;
                                                                        })
                                                                        // console.log('previousCurrency '+JSON.stringify(previousCurrency));
                                                                        previousCurrency=parseFloat(previousCurrency[0].value);
                                                                        let line_total_amount=(currentCurrency/previousCurrency*parseFloat(lineItem.total_amount)).toFixed(2);
                                                                        lineItem.total_amount = line_total_amount;
                                                                        lineItem.unit_price = (currentCurrency/previousCurrency*parseFloat(lineItem.unit_price)).toFixed(2);*/
                                                                        // console.log('total_amount '+line_total_amount);
                                                                        if(lineItem.expense_id==null){
                                                                          invoice_taxable_amount+=parseFloat(lineItem.total_amount);
                                                                        }
                                                                        invoice_total_amount+=parseFloat(lineItem.total_amount);
                                                                        // console.log('total_amount '+invoice_total_amount);

                                                                    });
                                                                    // console.log("************ invoiceItems *************");
                                                                    // console.log(invoiceItems);
                                                                }
                                                                if(invoiceDetails.rows.length>0){
                                                                    /*// console.log('total_amount '+invoice_total_amount); */
                                                                    invoiceDetails.rows[0].total_amount=invoice_total_amount.toFixed(2);
                                                                    console.log('invoiceDetails.tax '+(invoice_taxable_amount*invoiceDetails.rows[0].tax/100)+' '+invoice_total_amount);
                                                                    invoiceDetails.rows[0].tax =parseInt(invoiceDetails.rows[0].tax);
                                                                    if(invoiceDetails.rows[0].tax&&invoiceDetails.rows[0].tax>0){
                                                                      invoiceDetails.rows[0].final_amount=parseFloat(invoice_total_amount.toFixed(2))+parseFloat(invoice_taxable_amount*invoiceDetails.rows[0].tax/100);
                                                                    }else{
                                                                      invoiceDetails.rows[0].final_amount=invoice_total_amount.toFixed(2);
                                                                    }

                                                                    // invoiceDetails.rows[0]['startDateFormatted'] = invoiceDetails.rows[0].start_date == null ? '' : dateFormat(moment.tz(invoiceDetails.rows[0].start_date, companyDefaultTimezone).format());
                                                                    // invoiceDetails.rows[0]['dueDateFormatted'] = invoiceDetails.rows[0].due_date == null ? '' : dateFormat(moment.tz(invoiceDetails.rows[0].due_date, companyDefaultTimezone).format());
                                                                    invoiceDetails.rows[0]['startDateFormatted'] = invoiceDetails.rows[0].start_date == null ? '' : dateFormat(invoiceDetails.rows[0].start_date);
                                                                    invoiceDetails.rows[0]['dueDateFormatted'] = invoiceDetails.rows[0].due_date == null ? '' : dateFormat(invoiceDetails.rows[0].due_date);
                                                                }
                                                                // let invoice_tax=(parseFloat(invoice_total_amount) * parseFloat(invoiceDetails.rows[0].tax)) / 100;
                                                                // invoice_total_amount=(parseFloat(invoice_total_amount)+parseFloat(invoice_tax)).toFixed(2);
                                                                let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
                                                                client.query('UPDATE INVOICE SET total_amount=$1,final_amount=$2 ,updated_date=$3 WHERE id=$4 RETURNING *', [invoiceDetails.rows[0].total_amount,invoiceDetails.rows[0].final_amount,'now()',req.query.invoiceId], function (err, invoiceUpdated) {
                                                                    if (err) {
                                                                        console.error(err);
                                                                        handleResponse.shouldAbort(err, client, done);
                                                                        handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:err},"error"," Error in updating invoice data");
                                                                        /*handleResponse.handleError(res, err, ' Error in updating invoice data');*/
                                                                    } else {
                                                                      client.query('COMMIT', (err) => {
                                                                        if (err) {
                                                                          // console.log('Error committing transaction', err.stack)
                                                                          handleResponse.shouldAbort(err, client, done);
                                                                          handleResponse.handleError(res, err, ' Error in committing transaction');
                                                                        } else {
                                                                            getUserDetails(req, res, client, err, done, function (response) {
                                                                                // console.log("response");
                                                                                // // console.log(projects.rows);
                                                                                // console.log('invoice detail is ');
                                                                                // console.log(invoiceDetails.rows[0]);
                                                                                // console.log('invoice_total_amount '+invoice_total_amount);
                                                                                accountData.rows[0].quickbook_customer_id=accountData.rows[0].quickbook_customer_id?accountData.rows[0].quickbook_customer_id:null;
                                                                                // console.log('accountData.rows[0].quickbook_customer_id '+accountData.rows[0].quickbook_customer_id)
                                                                                done();
                                                                                handleResponse.responseToPage(res,'pages/invoice-details',{projects:projects.rows, invoiceDetails: invoiceDetails.rows[0], invoiceItems: invoiceItems.rows, user: req.user,account:accountData.rows[0], userList:response ,companySetting:companySetting.rows[0],companyDefaultTimezone:companyDefaultTimezone,currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD') },"success","Successfully rendered");
                                                                            })
                                                                          }
                                                                        })
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                            });
                                          }
                                      });
                                  }else{
                                    done();
                                    handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.user, userList:[], error:'error'},"error"," Error in finding invoice data");
                                  }
                              }
                            });
                          }
                        })
                    }
                  })
                });
            }
        }
    });
};
exports.postInvoiceItemDetail = (req, res) => {

      // console.log(req.body);
      /*req.assert('expense_id', 'Expense cannot be blank').notEmpty();*/
      req.assert('account_id', 'Account cannot be blank').notEmpty();
      req.assert('project_id', 'Project cannot be blank').notEmpty();
      const errors = req.validationErrors();

      if (errors) {
        if(errors.length>0){
            // console.log(errors[0].msg);
            handleResponse.handleError(res, errors, ""+errors[0].msg);
          }else{
             handleResponse.handleError(res, errors, " Error in validating data.");
          }
      }else{


            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                  // console.log(req.body);
                  client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM INVOICE_LINE_ITEM il WHERE company_id=$1 AND id=$2', [req.user.company_id, req.body.invoice_item_id], function (err, invoiceItemDetails) {
                      if (err) {
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding invoice line item data');
                      } else {
                          // console.log(invoiceItemDetails);
                          let item_date=moment.tz(req.body.item_date, companyDefaultTimezone).format();
                          client.query('UPDATE INVOICE_LINE_ITEM SET type=$1,item_date=$2,hours=$3,unit_price=$4,tax=$5,project_id=$6,account_id=$7,expense_id=$8, updated_date=$9,amount=$10,total_amount=$11,note=$12 WHERE id=$13 AND company_id=$14 ', [req.body.type, item_date, req.body.hours, req.body.bill_rate, req.body.tax, req.body.project_id, req.body.account_id, req.body.expense_id, newDate, req.body.amount, req.body.total_amount, req.body.note, req.body.invoice_item_id, req.user.company_id], function (err, updatedData) {
                              // console.log('Error >>>>>>>>>>>>>');
                              // console.log(err);
                              if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in updating invoice line item data');
                              } else {
                                client.query('COMMIT', (err) => {
                                  if (err) {
                                    // console.log('Error committing transaction', err.stack)
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in committing transaction');
                                  } else {
                                    done();
                                    // console.log('Updated Invoice Item>>>>>>>>>>>>>');
                                    // console.log(updatedData);
                                    handleResponse.sendSuccess(res,'Invoice item detail updated successfully',{});
                                    /*res.status(200).json({ "success": true ,"message":"success"});*/
                                  }
                                })
                              }
                          });
                      }
                  });
              }
            })
        });

      }

};

exports.postInvoiceDetails = (req, res) => {
    let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' error in connecting to database');
        } else {
            /*req.body.start_date = req.body.start_date == '' ? null : req.body.start_date;*/
            req.body.due_date = req.body.due_date == '' ? null : moment.tz(req.body.due_date, companyDefaultTimezone).format();
            // console.log(req.body);
            client.query('SELECT * FROM INVOICE WHERE company_id=$1 AND id=$2', [req.user.company_id, req.body.invoiceId], function (err, invoiceDetails) {
                if (err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding invoice data');
                } else {
                    client.query('UPDATE INVOICE SET  due_date=$1, description=$2, updated_date=$3, currency=$4, total_amount=$7, tax=$8 , status= $9 WHERE id=$5 AND company_id=$6', [moment.tz(req.body.due_date.split('T')[0], companyDefaultTimezone).format(), req.body.description, 'now()',req.body.currency , req.body.invoiceId, req.user.company_id, req.body.total_amount, req.body.tax_per,req.body.status], function (err, updatedData) {
                        // console.log('Error >>>>>>>>>>>>>');
                        // console.log(err);
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in updating invoice data');
                        } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              // console.log('Error committing transaction', err.stack)
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
                              done();
                              // console.log('Updated Invoice >>>>>>>>>>>>>');
                              // console.log(updatedData);
                              handleResponse.sendSuccess(res,'Invoice updated successfully',{});
                              /*res.status(200).json({ "success": true ,"message":"success"});*/
                            }
                          })
                        }
                    });
                }
            });
          }
        })
    });

};
exports.deleteInvoiceItem = (req, res) => {
    if(req.user){
        // console.log('Archived Invoice item-------------' + req.body.invoiceItemId);
        let invoiceItemId=req.body.invoiceItemId;
        if(invoiceItemId==''||invoiceItemId==null||invoiceItemId==undefined){
            handleResponse.handleError(res, 'incorrect invoice item id', ' Invoice item id is not correct');
        } else {
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                  // console.log("Inv Type");
                  // console.log(req.body.deleteRecord);
                    if(req.body.deleteRecord == "TIMESHEET") {
                        client.query('SELECT * FROM invoice_line_item WHERE id=$1', [req.body.invoiceItemId], function (err, lineItemDetails) {
                           if (err) {
                            handleResponse.handleError(res, 'incorrect invoice item id', ' Invoice item id is not correct');
                           } else {
                                let timesheetIds = '';
                                lineItemDetails.rows[0].timesheet_row_id.forEach(function (lineId, index) {
                                  let line_item = lineId;
                                  if((lineItemDetails.rows[0].timesheet_row_id.length-1) == index) {
                                    timesheetIds = timesheetIds + line_item;
                                  } else {
                                    timesheetIds = timesheetIds + line_item + ', ';
                                  }
                                });
                                timesheetIds = '(' + timesheetIds + ')';
                                // console.log("timesheetIds");
                                // console.log(timesheetIds);
                                unInvoicedTimesheetLineItem(done, res, err, client, timesheetIds, function (result) {
                                   // console.log("Returned : "+result);
                                   if(result) {
                                       deleteInvoiceLineItem(done, res, err, client, req.body.invoiceItemId, function (response) {
                                         client.query('COMMIT', (err) => {
                                           if (err) {
                                             handleResponse.shouldAbort(err, client, done);
                                             handleResponse.handleError(res, err, ' Error in committing transaction');
                                           } else {
                                             done();
                                             handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                                           }
                                         })
                                       });
                                   } else {
                                     handleResponse.shouldAbort('Error in deleting invoice detail data', client, done);
                                     handleResponse.handleError(res, 'Error in deleting invoice detail data', 'Error in deleting invoice detail data');

                                   }
                               });
                           }
                        });
                    } else if (req.body.deleteRecord == "EXPENSE") {
                        unInvoicedExpense(done, res, err, client, req.body.expenseId, function (result) {
                            if(result) {
                                deleteInvoiceLineItem(done, res, err, client, req.body.invoiceItemId, function (response) {
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                      done();
                                      handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                                    }
                                  })
                                });
                            } else {
                              handleResponse.shouldAbort('Error in deleting invoice detail data', client, done);
                              handleResponse.handleError(res, 'Error in deleting invoice detail data', 'Error in deleting invoice detail data');
                            }
                        });
                    } else {
                        // console.log()
                        client.query('DELETE FROM invoice_line_item WHERE id=$1', [invoiceItemId], function (err, updatedIRec) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in deleting invoice line item.');
                            } else {
                              client.query('COMMIT', (err) => {
                                if (err) {
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in committing transaction');
                                } else {
                                  done();
                                  handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                                }
                              })
                            }
                        });
                    }

                  }
                })
            });
        }
  } else{
    res.redirect('/domain');
  }
}

function unInvoicedTimesheetLineItem(done, res, err, client, timesheetIds, result) {
    // console.log("TimeSheetId");
    // console.log(timesheetIds);
    client.query('UPDATE timesheet_line_item SET invoiced = $1, invoice_id=$2 WHERE id IN '+timesheetIds, [false, null], function (err, updatedTRec) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in deleting invoice line item.');
        } else {
            return result(true);
        }
    });
}

function unInvoicedExpense(done, res, err, client, expenseId, result) {
    client.query('UPDATE expense SET invoiced = $1, invoice_id=$2 WHERE id=$3', [false, null, expenseId], function (err, updatedIRec) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in deleting invoice line item.');
        } else {
            return result(true);
        }
    });
}

function deleteInvoiceLineItem(done, res, err, client, lineItemId, result) {
    // console.log("Inside Delete");
    // console.log(lineItemId);
    client.query('DELETE FROM invoice_line_item WHERE id=$1', [lineItemId], function (err, updatedIRec) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in deleting invoice line item.');
        } else {
            return result(true);
        }
    });
}

function deleteRelatedInvoiceItem(req,res,client,invoiceLineItem,done,error,cb) {
  console.log(invoiceLineItem);
  console.log(invoiceLineItem.timesheet_row_id != null);
  if(invoiceLineItem.timesheet_row_id != null) {
      client.query('SELECT * FROM invoice_line_item WHERE id=$1', [invoiceLineItem.id], function (err, lineItemDetails) {
         if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in getting invoice line item details');
         } else {
              let timesheetIds = '';
              lineItemDetails.rows[0].timesheet_row_id.forEach(function (lineId, index) {
                let line_item = lineId;
                if((lineItemDetails.rows[0].timesheet_row_id.length-1) == index) {
                  timesheetIds = timesheetIds + line_item;
                } else {
                  timesheetIds = timesheetIds + line_item + ', ';
                }
              });
              timesheetIds = '(' + timesheetIds + ')';

              unInvoicedTimesheetLineItem(done, res, error, client, timesheetIds, function (result) {
                 if(result) {
                     deleteInvoiceLineItem(done, res, error, client, invoiceLineItem.id, function (response) {
                       cb(true);
                      //  client.query('COMMIT', (err) => {
                      //    if (err) {
                      //      handleResponse.shouldAbort(err, client, done);
                      //      handleResponse.handleError(res, err, ' Error in committing transaction');
                      //    } else {
                      //      done();
                      //      handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                      //    }
                      //  })
                     });
                 } else {
                   handleResponse.shouldAbort('Error in deleting invoice detail data', client, done);
                   handleResponse.handleError(res, 'Error in deleting invoice detail data', 'Error in deleting invoice detail data');

                 }
             });
         }
      });
  } else if (invoiceLineItem.expense_id != null) {
    console.log(invoiceLineItem.expense_id != null);
      unInvoicedExpense(done, res, error, client, invoiceLineItem.expense_id, function (result) {
          if(result) {
              deleteInvoiceLineItem(done, res, error, client,invoiceLineItem.id, function (response) {
                cb(true);
                // client.query('COMMIT', (err) => {
                //   if (err) {
                //     handleResponse.shouldAbort(err, client, done);
                //     handleResponse.handleError(res, err, ' Error in committing transaction');
                //   } else {
                //     done();
                //     handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                //   }
                // })
              });
          } else {
            handleResponse.shouldAbort('Error in deleting invoice detail data', client, done);
            handleResponse.handleError(res, 'Error in deleting invoice detail data', 'Error in deleting invoice detail data');
          }
      });
  } else {
      console.log(invoiceLineItem.id)
      client.query('DELETE FROM invoice_line_item WHERE id=$1', [invoiceLineItem.id], function (err, updatedIRec) {
          if (err) {
              console.error(err);
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in deleting invoice line item.');
          } else {
            cb(true);
            // client.query('COMMIT', (err) => {
            //   if (err) {
            //     handleResponse.shouldAbort(err, client, done);
            //     handleResponse.handleError(res, err, ' Error in committing transaction');
            //   } else {
            //     done();
            //     handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
            //   }
            // })
          }
      });
  }

}

exports.deleteInvoice = (req, res) => {
    if(req.user){
        // console.log('Archived Invoice -------------' + req.body.invoiceId);
        let invoiceId=req.body.invoiceId;
        if(invoiceId==''||invoiceId==null||invoiceId==undefined){
             handleResponse.handleError(res, 'incorrect invoice id', ' Invoice id is not correct');
        }else{
            pool.connect((error, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                  client.query('SELECT * FROM INVOICE_LINE_ITEM WHERE invoice_id=$1', [req.body.invoiceId], function (err, invoiceLineItemData) {
                      if (err) {
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding invoice line item related to the invoice.');
                      } else {
                        if(invoiceLineItemData.rows.length>0){
                          invoiceLineItemData.rows.forEach((invoiceLineItem,index) => {
                            // console.log('invoiceLineItem');
                            // console.log(invoiceLineItem);
                            deleteRelatedInvoiceItem(req,res,client,invoiceLineItem,done,error,function(result){
                              console.log('result');
                              console.log(result);
                            });
                            console.log(index+' '+(invoiceLineItemData.rows.length-1))
                            if(index == (invoiceLineItemData.rows.length-1)){
                              client.query('UPDATE invoice SET archived = $1 WHERE id=$2', [true, req.body.invoiceId], function (err, archivedInvoice) {
                                if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in deleting invoice.');
                                } else {
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                      console.error('Affected ID>>>>>>>>>>>>>');
                                      // console.log(archivedInvoice.rows[0]);
                                      done();
                                      handleResponse.sendSuccess(res,'Invoice Deleted successfully',{});
                                      /*res.status(200).json({ "success": true ,"message":"success"});*/
                                    }
                                  })
                                }
                              })
                            }
                          })
                        }else{
                          client.query('UPDATE invoice SET archived = $1 WHERE id=$2', [true, req.body.invoiceId], function (err, archivedInvoice) {
                            if (err) {
                              console.error(err);
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in deleting invoice.');
                            } else {
                              client.query('COMMIT', (err) => {
                                if (err) {
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in committing transaction');
                                } else {
                                  console.error('Affected ID>>>>>>>>>>>>>');
                                  // console.log(archivedInvoice.rows[0]);
                                  done();
                                  handleResponse.sendSuccess(res,'Invoice Deleted successfully',{});
                                  /*res.status(200).json({ "success": true ,"message":"success"});*/
                                }
                              })
                            }
                          })
                        }
                      }
                    })
                }
              })
            });
        }
  } else{
    done();
    res.redirect('/domain');
  }
}

exports.findInvoiceByCriteria = (req, res) => {
  console.log("findInvoiceByCriteria----------------------------------"+JSON.stringify(req.body.searchField));
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
           companyDefaultTimezone = result.timezone;
            pool.connect((err, client, done) => {
                let searchCriteriaVal=[req.user.company_id];
                let whereClause='WHERE company_id=$1 ';
                if(req.body.searchField.length>0){
                  let searchField=req.body.searchField;
                  searchField.forEach((search,index)=>{
                      whereClause+='AND '+search.fieldName+' $'+(index+2)+' ';
                      searchCriteriaVal.push(search.fieldValue);
                  });
                  /*let queryToExec='SELECT * FROM account WHERE '+req.body.searchField+' like $1 AND company_id=$2';*/
                }
                let offset = 0;
                  if (req.body.offset) {
                      offset = req.body.offset;
                  }
                whereClause+=' AND account_id IN(SELECT id FROM ACCOUNT where company_id=$1 AND archived=$'+(searchCriteriaVal.length+1)+')';
                console.log('req.body.accountArchived '+req.body.accountArchived)
                if(req.body.accountArchived){
                  searchCriteriaVal.push(req.body.accountArchived);
                }else{
                  searchCriteriaVal.push(false);
                  req.body.accountArchived = false;
                }
                let queryToExec='SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax ,(SELECT count(*) FROM INVOICE '+whereClause+') as searchCount FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id OFFSET '+offset+' LIMIT ' + process.env.PAGE_RECORD_NO;
                console.log('queryToExec '+queryToExec+' '+searchCriteriaVal);
                client.query(queryToExec,searchCriteriaVal, function (err,invoiceList) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding invoice data');
                  }
                  else{
                      client.query('SELECT id,name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, req.body.accountArchived], function (err, account) {
                        if (err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding account data');
                          /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                        } else {
                          // console.log("----------account.rows-------------");
                          // console.log(account.rows);
                          let accountIdArr=[];
                          if(account.rows.length>0){
                            accountIdArr = account.rows.map(function (ele) {
                                return ele.id;
                            });
                          }

                          let invoiceListArr = [];
                          let searchCount = 0;
                          console.log('------------invoiceList.rows--------------');
                          console.log(invoiceList.rows);
                          console.log(accountIdArr);
                          if(invoiceList.rows.length>0){
                              invoiceList.rows.forEach(function (invoice) {
                                  console.log(invoice.account_id);
                                  if(accountIdArr.includes(invoice.account_id)) {
                                      invoice['startDateFormatted'] = invoice.start_date == null ? null : moment.tz(invoice.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                      invoice['dueDateFormatted'] = invoice.due_date == null ? '' : moment.tz(invoice.due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                      // invoice['startDateFormatted'] = invoice.start_date == null ? null : dateFormat(invoice.start_date);
                                      // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
                                      invoiceListArr.push(invoice);
                                  }
                              });
                              searchCount=invoiceList.rows[0].searchcount;
                          }
                          // console.log("invoiceList");
                          // console.log(invoiceListArr);
                          done();

                          handleResponse.sendSuccess(res,'Invoices searched successfully',{invoices: invoiceListArr,count:searchCount});


                        }
                      });
                  }
                });

              })
            }
          });
};
exports.findInvoiceForAccount = (req, res) => {
  // console.log("findInvoiceForAccount----------------------------------"+req.body.searchText);
  pool.connect((err, client, done) => {
      let offset = 0;
      if (req.body.offset) {
           offset = req.body.offset;
      }
      if(req.body.searchText!=''){
          let queryToExec='SELECT id,name FROM account WHERE name ilike $1 AND company_id=$2 AND archived=$3';
          // console.log('queryToExec '+queryToExec);
          client.query(queryToExec,['%'+req.body.searchText+'%',req.user.company_id,false], function (err, accounts) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in finding account data');
            }else{
              if(accounts.rows.length>0){
                let invoiceList=[];
                let searchCount=parseInt(0);
                // accounts.rows.forEach(function(account,index){
                      // console.log(JSON.stringify(accounts.rows));
                      // let accountId=account.id;
                      // let accountName=account.name;
                      let accountId=accounts.rows.map(acc => acc.id);
                      // console.log('-----------accountId------');
                      // console.log(accountId);
                      whereClause=' WHERE account_id = ANY($1::bigint[]) AND company_id=$2 AND archived=$3 '
                      queryToExec='SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax ,(SELECT count(*) FROM invoice '+whereClause+') as searchCount FROM invoice i '+whereClause+' ORDER BY start_date DESC,record_id OFFSET '+offset+' LIMIT ' + process.env.PAGE_RECORD_NO;
                      let searchFieldVal=[accountId,req.user.company_id,false];
                      if(req.body.status){
                            queryToExec+=' AND status=$4';
                            searchFieldVal.push(req.body.status);
                        }
                      client.query(queryToExec,searchFieldVal, function (err, invoices) {
                        if (err) {
                          handleResponse.shouldAbort(err, client, done);
                          /*handleResponse.responseToPage(res,'pages/org-listing',{user:req.user, error:err},"error"," Error in finding company data");*/
                          handleResponse.handleError(res, err, ' Error in finding invoice for account');
                        }
                        else{
                            if(invoices.rows.length>0){
                                invoices.rows.forEach(function (invoice,index) {
                                    invoice['startDateFormatted'] = invoice.start_date == null ? '' : moment.tz(invoice.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    invoice['dueDateFormatted'] = invoice.due_date == null ? '' : moment.tz(invoice.due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    // invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                    // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
                                    invoiceList.push(invoice);
                                    if(index==(invoices.rows.length-1)){
                                      searchCount=parseInt(invoices.rows[0].searchcount);
                                      done();
                                      handleResponse.sendSuccess(res,'Invoices searched successfully',{invoices: invoiceList,count:searchCount});
                                    }
                                });
                            }else {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, 'No invoice is associated with this account.', 'No invoice is associated with this account.');
                            }
                        }
                      });

                // });
              }else{
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Cannot find account with this name');
              }
            }
          });
        }else{

            client.query('SELECT id, name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                if (err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding account data');
                    /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                } else {
                    let accountIdArr=[];
                    if(accountList.rows.length>0){
                        accountIdArr = accountList.rows.map(function (ele) {
                            return ele.id;
                        });
                    }
                    whereClause = 'WHERE company_id=$1 AND archived=$2 AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2)'
                    queryToExec = 'SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax ,(SELECT count(*) FROM INVOICE '+whereClause+') as searchcount FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id OFFSET '+offset+' LIMIT ' + process.env.PAGE_RECORD_NO;
                      let searchFieldVal= [req.user.company_id, false];
                      if(req.body.status){
                            queryToExec+=' AND status=$3';
                            searchFieldVal.push(req.body.status);
                        }
                        client.query(queryToExec,searchFieldVal, function (err, invoiceList) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in finding invoice data');
                            /*handleResponse.handleError(res, err, ' Error in finding invoice data');*/
                        } else {
                            invoiceListArr=[];
                            let searchCount=0;
                            if(invoiceList.rows.length>0){
                                invoiceList.rows.forEach(function (invoice) {
                                    if(accountIdArr.includes(invoice.account_id)) {
                                        invoice['startDateFormatted'] = invoice.start_date == null ? '' : moment.tz(invoice.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                        invoice['dueDateFormatted'] = invoice.due_date == null ? '' : moment.tz(invoice.due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                        // invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                        // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
                                        invoiceListArr.push(invoice);
                                    }
                                });
                                searchCount=invoiceList.rows[0].searchcount;
                            }
                            // console.log("invoiceList");
                            // console.log(invoiceListArr);
                            done();
                            handleResponse.sendSuccess(res,'Invoices searched successfully',{invoices: invoiceListArr,count:searchCount});
                        }
                    });
                }
            });
        }
    });
};
exports.sendInvoiceEmail = (req,res) =>{
    invoiceHtmlData(req,res,false,'send-email');
}


function invoiceHtmlData (req,res,invoiceHtml,responseType){

    let invId = req.params.invoiceId?req.params.invoiceId:req.body.invoiceId;
    console.log("invId");
    console.log(invId);
    setting.getCompanySetting(req, res ,(err,result)=>{
       if(err==true){
         // console.log('error in setting');
         // console.log(err);
         handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching company setting ");
         /*handleResponse.handleError(res, err, ' error in finding company setting');*/
       }else{
           companyDefaultTimezone = result.timezone;
            pool.connect((err, client, done) => {
                client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax,i.final_amount  FROM invoice i WHERE id=$1',[invId], function (err, invoiceDetails) {
                    if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        if(invoiceHtml==true){
                            handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching invoice details");
                        }else{
                            handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                        }
                    } else {
                        client.query('SELECT * FROM account WHERE id=$1',[invoiceDetails.rows[0].account_id], function (err, accountDetails) {
                        if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            if(invoiceHtml==true){
                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching invoice details");
                            }else{
                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                            }
                        } else {
                            client.query('SELECT * FROM setting WHERE company_id=$1',[req.user.company_id], function (err, companySetting) {
                            if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                if(invoiceHtml==true){
                                    handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching invoice details");
                                }else{
                                    handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                }
                            } else {
                                    console.log(companySetting.rows[0])
                                    client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM invoice_line_item il WHERE  invoice_id=$1 ORDER BY project_id,timesheet_id,expense_id,created_date',[invId], function (err, invoiceLineItems) {
                                        if (err) {
                                            handleResponse.shouldAbort(err, client, done);
                                            if(invoiceHtml==true){
                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching invoice details");
                                            }else{
                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                            }
                                        } else {
                                            client.query('SELECT * FROM project WHERE company_id=$1 AND account_id=$2',[req.user.company_id, invoiceDetails.rows[0].account_id], function (err, projects) {
                                                if (err) {
                                                    handleResponse.shouldAbort(err, client, done);
                                                    if(invoiceHtml==true){
                                                        handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching invoice details");
                                                    }else{
                                                        handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                                    }
                                                } else {
                                                    client.query('SELECT name FROM company WHERE id = $1',[req.user.company_id], function (err, companyName) {
                                                        if (err) {
                                                            handleResponse.shouldAbort(err, client, done);
                                                            if(invoiceHtml==true){
                                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err},"error"," Error in fetching invoice details");
                                                            }else{
                                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                                            }
                                                        } else {
                                                                // console.log('---length---');
                                                                /*// console.log(invoiceLineItems.rows);*/
                                                                getUserDetails(req, res, client, err, done, function (userList) {
                                                                    /*// console.log("invoiceLineItems");
                                                                    // console.log(invoiceLineItems);*/
                                                                    let invoiceLineList=[];
                                                                    let invoice_total_amount=0,invoice_taxable_amount=0;
                                                                    if(invoiceLineItems.rows.length > 0) {
                                                                        invoiceLineItems.rows.forEach(function (lines,index) {
                                                                            let symbolsToSearch="EUR, "+invoiceDetails.rows[0].currency+", "+lines.currency;
                                                                            // console.log(symbolsToSearch)
                                                                            /*fixer.latest({ symbols: symbolsToSearch }).then((latest)=>{*/
                                                                                /*let currentCurrency=currencyWithSymbolArray.filter(function(currency){
                                                                                  return currency.name == invoiceDetails.rows[0].currency;
                                                                                })
                                                                                currentCurrency=parseFloat(currentCurrency[0].value);
                                                                                let previousCurrency=currencyWithSymbolArray.filter(function(currency){
                                                                                  return currency.name == lines.currency;
                                                                                })
                                                                                // // console.log('currentCurrency '+currentCurrency)
                                                                                previousCurrency=parseFloat(previousCurrency[0].value)
                                                                                // console.log('previousCurrency '+previousCurrency)
                                                                                // console.log('line amount is'+lines.total_amount);

                                                                                // console.log('total_amount '+line_total_amount);
                                                                                lines.total_amount=(currentCurrency/previousCurrency*(lines.total_amount)).toFixed(2);
                                                                                lines.unit_price=(currentCurrency/previousCurrency*(lines.unit_price)).toFixed(2);*/
                                                                                /*// console.log('-------latest------');
                                                                                // console.log(latest);*/
                                                                                lines.inv_qauntity = lines.quantity;
                                                                                if(lines.type == "Timesheet"&&lines.timesheet_id !=null) {
                                                                                    lines.inv_qauntity = minuteToHours(lines.quantity);
                                                                                }
                                                                                lines['totalHoursFormatted'] = minuteToHours(lines.quantity);
                                                                                lines['user_email'] = userList.find(function (obj) {
                                                                                    if(obj.id == lines.user_id) {
                                                                                        return obj.email;
                                                                                    }
                                                                                });
                                                                                // console.log('amount '+lines.total_amount);
                                                                                if(lines.expense_id==null){
                                                                                  invoice_taxable_amount+=parseFloat(lines.total_amount);
                                                                                }
                                                                                invoice_total_amount+=parseFloat(lines.total_amount);
                                                                                invoiceLineList.push(lines);
                                                                                // console.log(invoiceLineItems.rows.length+' '+(index+1));
                                                                                if(invoiceLineItems.rows.length==(index+1)){

                                                                                        // console.log('invoiceLineList');
                                                                                        // console.log(invoiceLineItems.rows.length+' '+(index+1));
                                                                                        /*// console.log(invoiceLineList);*/
                                                                                        let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':moment.tz(invoiceDetails.rows[0].created_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                                                                        let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':moment.tz(invoiceDetails.rows[0].due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                                                                        // let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':dateFormat(invoiceDetails.rows[0].created_date);
                                                                                        // let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':dateFormat(invoiceDetails.rows[0].due_date);
                                                                                        // console.log('start and due dates arre'+startDateFormatted+' '+dueDateFormatted);
                                                                                        invoiceDetails.rows[0].total_amount=invoice_total_amount.toFixed(2);

                                                                                        invoiceDetails.rows[0].tax =parseInt(invoiceDetails.rows[0].tax);
                                                                                        console.log('invoiceDetails.rows[0].total_amount '+invoiceDetails.rows[0].total_amount);
                                                                                        if(invoiceDetails.rows[0].tax&&invoiceDetails.rows[0].tax>0){
                                                                                          invoiceDetails.rows[0].final_amount=parseFloat(invoice_total_amount.toFixed(2))+parseFloat(invoice_taxable_amount*invoiceDetails.rows[0].tax/100);
                                                                                        }else{
                                                                                          invoiceDetails.rows[0].final_amount=invoice_total_amount.toFixed(2);
                                                                                        }
                                                                                        console.log('invoiceDetails.rows[0].final_amount '+invoiceDetails.rows[0].final_amount);
                                                                                        invoiceDetails.rows[0]['startDateFormatted'] = startDateFormatted;
                                                                                        invoiceDetails.rows[0]['dueDateFormatted'] = dueDateFormatted;
                                                                                        // invoiceDetails.rows[0]['description'] = invoiceDetails.rows[0]['description'].split("\\n").join("<br />");
                                                                                        done();
                                                                                        if(accountDetails.rows.length>0){
                                                                                            accountDetails.rows[0].street=(accountDetails.rows[0].street==null) ? '' : accountDetails.rows[0].street;
                                                                                            accountDetails.rows[0].city=(accountDetails.rows[0].city==null) ? '' : accountDetails.rows[0].city;
                                                                                            accountDetails.rows[0].state=(accountDetails.rows[0].state==null) ? '' : accountDetails.rows[0].state;
                                                                                            accountDetails.rows[0].country=(accountDetails.rows[0].country==null) ? '' : accountDetails.rows[0].country;
                                                                                            accountDetails.rows[0].zip_code=(accountDetails.rows[0].zip_code==null) ? '' : accountDetails.rows[0].zip_code;
                                                                                        }
                                                                                        companySetting.rows[0].street = (companySetting.rows[0].street==null) ? '' : companySetting.rows[0].street;
                                                                                        companySetting.rows[0].city = (companySetting.rows[0].city==null) ? '' : companySetting.rows[0].city;
                                                                                        companySetting.rows[0].state = (companySetting.rows[0].state==null) ? '' : companySetting.rows[0].state;
                                                                                        companySetting.rows[0].country = (companySetting.rows[0].country==null) ? '' : companySetting.rows[0].country;
                                                                                        companySetting.rows[0].zip_code = (companySetting.rows[0].zip_code==null) ? '' : companySetting.rows[0].zip_code;

                                                                                        if(invoiceHtml==true){
                                                                                            console.log('inside invoiceHTML');
                                                                                            /*// console.log('dates are');
                                                                                            // console.log(invoiceDetails.rows[0].startDateFormatted+' '+invoiceDetails.rows[0].created_date);
                                                                                            // console.log(invoiceDetails.rows[0].dueDateFormatted+' '+invoiceDetails.rows[0].due_date);*/
                                                                                            handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err, invoiceDetails : invoiceDetails.rows[0], lineItems : invoiceLineList, accountDetails:accountDetails.rows[0],companySetting:companySetting.rows[0], projects:projects.rows,companyName:companyName.rows[0].name},"success","Successfully rendered");
                                                                                        }else{
                                                                                            console.log('inside generatePDF');
                                                                                            if(companySetting.rows[0].company_logo == null){
                                                                                              fs.readFile(`${process.env.PWD}/public/img/logo-place-holder.jpg`, (err, data)=>{
                                                                                                    if(err) return res.status(500).send(err);
                                                                                                    companySetting.rows[0].company_logo = new Buffer(data, 'base64');
                                                                                                    generatePdf(req,res,invoiceDetails.rows[0],invoiceLineList,accountDetails.rows[0],companySetting.rows[0], projects.rows,companyName.rows[0].name,responseType);
                                                                                                })
                                                                                            }else{
                                                                                              generatePdf(req,res,invoiceDetails.rows[0],invoiceLineList,accountDetails.rows[0],companySetting.rows[0], projects.rows,companyName.rows[0].name,responseType);
                                                                                            }
                                                                                        }

                                                                                }

                                                                            /*})*/


                                                                        });

                                                                        /*// console.log("invoiceLineItems");
                                                                        // console.log(JSON.stringify(invoiceLineItems.rows));*/
                                                                    } else {
                                                                        let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':moment.tz(invoiceDetails.rows[0].created_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                                                        let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':moment.tz(invoiceDetails.rows[0].due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                                                        // let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':dateFormat(invoiceDetails.rows[0].created_date);
                                                                        // let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':dateFormat(invoiceDetails.rows[0].due_date);
                                                                        console.log('start and due dates arre'+startDateFormatted+' '+dueDateFormatted);
                                                                        invoiceDetails.rows[0]['startDateFormatted'] = startDateFormatted;
                                                                        invoiceDetails.rows[0]['dueDateFormatted'] = dueDateFormatted;
                                                                        console.log('inside invoiceHTML');
                                                                        handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.user, error:err, invoiceDetails : invoiceDetails.rows[0], lineItems : [], accountDetails:accountDetails.rows[0],companySetting:companySetting.rows[0], projects:projects.rows,companyName:companyName.rows[0].name},"success","Successfully rendered");

                                                                    }

                                                          })

                                                        }
                                                    })
                                                }
                                            });
                                         }
                                    });
                                    }
                              });
                        }
                      });
                    }
                });
            });
        }
      });
}
exports.generateInvoiceHTML = (req, res) => {
    invoiceHtmlData(req,res,true,'');

}
function isComma(string) {
    if(string && string.length > 0) {
        return ','
    } else {
        return '';
    }
}
function generatePdf (req, res, invoiceDetails,lineItems,accountDetails,companySetting, projects,companyName,responseType) {
    console.log('inside generate pdf '+invoiceDetails.currency);
    // console.log(companySettingFile.getCompanyLogoJSON(req, res));

    let tableRow='';
    let sumOfTotalAmount = 0.0;
    let taxAmount = 0;
    let totalPaidAmount = 0;
    let currency_symbols = currencyWithSymbolArray.filter(function(currency){
        return currency.name == invoiceDetails.currency;
    })
    console.log(currency_symbols);
    if(lineItems.length > 0) {
        sumOfTotalAmount = 0.0;
        lineItems.forEach(function(invLineDetails) {
            projectObj = projects.filter(project => {
                return parseInt(invLineDetails.project_id) == parseInt(project.id);
            });
            sumOfTotalAmount += parseFloat(invLineDetails.total_amount);
            if(parseFloat(sumOfTotalAmount) > 0) {
                taxAmount = (sumOfTotalAmount * invoiceDetails.tax) / 100;
                totalPaidAmount = sumOfTotalAmount + taxAmount;
            }
            // console.log(taxAmount);
            // console.log(totalPaidAmount);

                let note = '';
                if(invLineDetails.note != null) {
                    note = invLineDetails.note;
                }
                let notes = ` ${note} `;
                // if(projectObj.length>0){
                //     notes = `Project:  ${projectObj[0].name}
                //               <br />
                //                ${note} `;
                // }
                // '<td align="left">'+
                // invLineDetails.type+
                // '</td>'+

                // <th scope="col" align="left" width="15%">
                //     Type
                // </th>
                // console.log('invLineDetails.inv_qauntity '+invLineDetails.inv_qauntity);
                let rowHtml='<tr>'+
                        '<td align="left">'+
                          notes+
                        '</td>'+
                        '<td align="left">'+
                            invLineDetails.inv_qauntity+
                        '</td>'+
                        '<td align="left">'+
                            currency_symbols[0].symbol+' '+invLineDetails.unit_price+
                        '</td>'+
                        '<td align="right">'+
                           currency_symbols[0].symbol+' '+invLineDetails.total_amount+
                        '</td>'+
                    '</tr>';

                    tableRow+=rowHtml;

        });
    }
    let description = '';
    invoiceDetails.description.split("\\n").forEach(data => {
      description += `<p class="slds-hyphenate">${data}</p>`;
    })

    if(sumOfTotalAmount==NaN){
        sumOfTotalAmount=0.00;
    }
    sumOfTotalAmount=sumOfTotalAmount.toFixed(2);
    totalPaidAmount=totalPaidAmount.toFixed(2);
    // let company_logo = Buffer.from('base64' , companySetting.company_logo);
    // console.log('company_logo in invoice');
    // console.log(company_logo);
    /*let company_logo = companySetting.company_logo;*/
    console.log('companySetting.company_logo');
    console.log(companySetting.company_logo);

    let contenttype = companySetting.contenttype;

    let comapny_address = `<strong>${companyName} </strong><BR />
                            ${companySetting.street?companySetting.street:''} <BR />
                            ${companySetting.city?companySetting.city:''}${isComma(companySetting.city)}
                            ${companySetting.state?companySetting.state:''} <BR />
                            ${companySetting.country?companySetting.country:''}${isComma(companySetting.country)}
                            ${companySetting.zip_code?companySetting.zip_code:''} <BR />`;

    let account_address = `<strong>${accountDetails.name}</strong><BR />
                            ${accountDetails.street?accountDetails.street:''} <BR />
                            ${accountDetails.city?accountDetails.city:''}${isComma(accountDetails.city)}
                            ${accountDetails.state?accountDetails.state:''} <BR />
                            ${accountDetails.country?accountDetails.country:''}${isComma(accountDetails.country)}
                            ${accountDetails.zip_code?accountDetails.zip_code:''} <BR />`;
    /*// console.log(company_logo);*/
    let taxHTML =``;
    if(invoiceDetails.final_amount-invoiceDetails.total_amount>0){
      taxHTML = `<tr>
                    <td align="right">
                        Tax
                    </td>
                    <td align="right" width="20%">
                        ${currency_symbols[0].symbol} ${(invoiceDetails.final_amount-invoiceDetails.total_amount).toFixed(2)}
                    </td>
                </tr>`;
    }
    let pdfHTML=`<!DOCTYPE html>
                    <html xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://ww.w3.org/1999/xlink" lang="en">


                    <body style="padding: 4mm; font-family: 'Salesforce Sans', sans-serif; font-size: 13px; color: #333;">
                        <style>
                            @font-face {
                              font-family: 'Salesforce Sans';
                              src: url('https://cdnjs.cloudflare.com/ajax/libs/design-system/2.9.2/fonts/SalesforceSans-Regular.ttf');
                            }
                            @font-face {
                              font-family: 'Salesforce Sans';
                              src: url('https://cdnjs.cloudflare.com/ajax/libs/design-system/2.9.2/fonts/SalesforceSans-Bold.ttf');
                              font-weight: bold;
                            }
                            table {
                                 width: 100%;
                                border-collapse: collapse;
                            }

                            table thead th {
                                text-transform: uppercase;
                            }

                            .tbl-fixed {
                                table-layout: fixed;
                            }

                            .bpd-50 {
                                padding-bottom: 50px;
                            }

                            .tmd-small {
                                margin-top: 1.5rem;
                            }

                            .tbl-border>tr>td,
                            .tbl-border>tbody>tr>td {
                                border-top: 1px solid #eeeeee;
                            }

                            .tbl-padded>tr>th,
                            .tbl-padded>tbody>tr>td,
                            .bl-padded>thead>tr>th {
                                padding: 8px;
                            }

                            .tbl-padded-10>tr>th,
                            .tbl-padded-10>tbody>tr>td .tbl-padded-10>thead>tr>td {
                                padding: 4px;
                            }

                            .tbl-padded-4>tr>th,
                            .tbl-padded-4>tbody>tr>td,
                            .bl-padded-4>thead>tr>td {
                                padding: 4px;
                            }

                            .bg-blue,
                            tr.bg-blue td {
                                background: #0070d2;
                            }

                            .bg-dull,
                            tr.bg-dull td {
                                background: #eee;
                            }

                            .text-white {
                                color: white;
                            }

                            .text-dull {
                                color: #999;
                            }

                            .text-size-10 {
                                font-size: 10px;
                            }
                            .text-size-12 {
                                font-size: 12px;
                            }

                            .text-size-18 {
                                font-size: 18px;
                            }

                            .text-uppercase {
                                text-transform: uppercase;
                            }

                            .line-top {
                                border-top: 1px solid #eee;
                            }
                            .text-center {
                                text-align: center;
                            }
                            .text-thin {
                                font-weight: lighter;
                            }
                            .pd-8{
                              padding:8px;
                            }
                            .head-text{
                              font-size: 0.75rem;
                              line-height: 1.25;
                              text-transform: uppercase;
                              letter-spacing: 0.0625rem;
                              font-weight: normal
                            }
                            .max-w-150 {
                                max-width: 150px;
                              }

                        </style>
                        <div>
                            <div class="bpd-50">
                                <table class="tbl-fixed">
                                    <tbody>
                                        <tr>
                                            <td class="" style="vertical-align: text-top;">
                                                <div class="text-uppercase tmd-small">
                                                    <img src="data:image/jpeg;base64, ${Buffer.from(companySetting.company_logo).toString('base64')}" alt="company_logo" class="max-w-150">
                                                </div>
                                            </td>
                                            <td width="15%">

                                            </td>
                                            <td>
                                                <div>
                                                    <div class="">
                                                        <h1 class="">
                                                            <strong class="text-uppercase text-center">
                                                                Invoice
                                                            </strong>
                                                        </h1>
                                                    </div>
                                                    <table class="tbl-padded-4">
                                                        <tbody>
                                                            <tr>
                                                                <td class="">
                                                                    <strong>Invoice No.</trong>
                                                                </td>
                                                                <td>
                                                                    <div class="">
                                                                        ${parseInt(invoiceDetails.record_id.substring(3))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="">
                                                                    <strong>Date Issued</strong>
                                                                </td>
                                                                <td>
                                                                    ${invoiceDetails.startDateFormatted}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="">
                                                                    <strong>Due Date</strong>
                                                                </td>
                                                                <td>
                                                                    ${invoiceDetails.dueDateFormatted}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="">
                                                                    <strong>Currency</strong </td> <td>
                                                                    ${invoiceDetails.currency}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="bpd-50">
                                <table class="tbl-fixed">
                                    <tbody>
                                        <tr>
                                            <td class="">
                                                <table class="">
                                                    <tbody>
                                                        <tr>
                                                            <td class="" valign="top" width="20%">
                                                                <strong>To </trong>
                                                            </td>
                                                            <td class="">
                                                                <div>
                                                                    ${account_address}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                            <td width="15%">

                                            </td>
                                            <td>
                                                <table class="">
                                                    <tbody>
                                                        <tr>
                                                            <td class="" valign="top" width="20%">
                                                                <strong>From</trong>
                                                            </td>
                                                            <td class="">
                                                                <div>
                                                                    ${comapny_address}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="">
                                <table class="tbl-border tbl-padded">
                                    <thead>
                                        <tr class="bg-blue text-white">

                                            <th scope="
                                                col" align="left" width="40%" class="pd-8  head-text">
                                                Description
                                            </th>
                                            <th scope="col" align="left" class="pd-8  head-text">
                                                Qty / Hr
                                            </th>
                                            <th scope="col" align="left" class="pd-8  head-text">
                                                Unit Price
                                            </th>
                                            <th scope="col" align="right" class="pd-8  head-text">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tableRow}
                                    </tbody>
                                </table>
                            </div>

                            <div class="line-top">
                                <table class="tbl-fixed tbl-padded">
                                    <tbody>
                                        <tr>
                                            <td align="right">
                                                Subtotal
                                            </td>
                                            <td align="right" width="20%">
                                                ${currency_symbols[0].symbol} ${parseFloat(invoiceDetails.total_amount).toFixed(2)}
                                            </td>
                                        </tr>
                                        ${taxHTML}


                                        <tr class="bg-dull">
                                            <td align="right">
                                                <span class="text-size-18">
                                                    Total Amount
                                                </span>
                                            </td>
                                            <td align="right" width="20%">
                                                <strong class="text-size-18">
                                                    ${currency_symbols[0].symbol} ${parseFloat(invoiceDetails.final_amount).toFixed(2)}
                                                </strong>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="">
                                <div class="text-dull text-size-10">
                                    ${description}
                                </div>
                            </div>
                        </div>
                    </body>

                    </html>`;

    //console.log(pdfHTML);
    // request('https://webtopdf.expeditedaddons.com/?api_key=' + process.env.WEBTOPDF_API_KEY + '&content='+pdfHTML+'&html_width=1024&margin=10&title=My+PDF+Title', function (error, response, body) {
    //   // // console.log('Status:', response.statusCode);
    //   // // console.log('Headers:', JSON.stringify(response.headers));
    //   // // console.log('Response:', body);
    //   res.setHeader('Content-Type', 'application/force-download');
    //   res.setHeader('Content-disposition', 'attachment;filename=invoice.pdf');
    //   res.setHeader('content-type', 'application/pdf');
    //   res.send(body);
    // });
    var options = {
      format: 'A4',
      width: '280mm',
      height: '396mm',
      header: {
        "height": "0mm",
      },
      footer: {
        "height": "20mm",
      }
    };
    // console.log('hmtl is:');
    // console.log(pdfHTML);
    console.log('responseType'+responseType)
    if(responseType =='send-email') {
        console.log('inside if')
      pdf.create(pdfHTML, options).toBuffer(function(err, buffer){
          if (err) {
              handleResponse.handleError(res, err, ' Error in generating pdf data');
          }
          else{
            req.body.pdfFile =  buffer;
            console.log('req.body.pdfFile')
            console.log(req.body.pdfFile)
            sendEmail(req,res,invoiceDetails,accountDetails,companyName,companySetting, function(error, info) {
              if (error) {
                handleResponse.handleError(res, error, 'Error in sending email');
              } else {
                handleResponse.sendSuccess(res, 'Invoice mailed successfully', {});
              }
            })

          }
      });


    } else {
      console.log('inside else')
        pdf.create(pdfHTML, options).toStream(function (err, stream) {
            if (err) {
                handleResponse.handleError(res, err, ' Error in generating pdf data');
            }
            else{
                  res.setHeader('Content-Type', 'application/force-download');
                  res.setHeader('Content-disposition', 'attachment;filename=invoice.pdf');
                  res.setHeader('content-type', 'application/pdf');

                  stream.pipe(res);

            }
        });
      }

}

sendEmail = (req, res, invoiceDetails, accountDetails,companyName,companySetting, next) => {
  let serverName = process.env.BASE_URL;
  let redirectUrl = serverName + '/invoice-html-view/' + req.body.invoiceId;
  console.log("redirectUrl");
  console.log(redirectUrl);
  console.log(req.body.body_of_email);
  let emailBody = '';
    req.body.body_of_email.split("\\n").forEach(data => {
      emailBody += `<p class="slds-hyphenate">${data}</p>`;
    })
  let currency_symbols = currencyWithSymbolArray.filter(function(currency){
      return currency.name == invoiceDetails.currency;
  })
  // console.log(currency_symbols);
  // console.log(emailBody);
  console.log('companySetting.company_logo');
  console.log(companySetting.company_logo);
  let startDateFormatted=invoiceDetails['created_date']==null?'':moment.tz(invoiceDetails.created_date, companyDefaultTimezone).format('MM-DD-YYYY');
  let dueDateFormatted=invoiceDetails['due_date']==null?'':moment.tz(invoiceDetails.due_date, companyDefaultTimezone).format('MM-DD-YYYY');
  //<a href="javascript:void(0);" target="_blank"><img src="${process.env.BASE_URL}/getCompanyLogoForEmail/${req.user.company_id}" alt="company_logo" style="max-width:150px;"></a>

  let html = `<html><head></head><body><div style="background-color: #f7f8f9;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f7f8f9">
                <tbody>
                    <tr>
                        <td valign="top" align="center" style="padding-top: 20px; padding-bottom: 10px;">
                            <center>${req.user.company}</center>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" align="center">
                            <table border="0" cellpadding="0" cellspacing="0" height="100%" width="50%">
                                <tbody><tr>
                                    <td valign="top">
                                        <table cellpadding="0" cellspacing="0" width="100%" style="background: #fff; border: 1px solid #eee; margin: 0; padding: 30px; ">
                                            <tbody>
                                                <tr>
                                                    <td valign="top">
                                                        <h5 style="font-family: arial,sans-serif; font-size:16px; font-weight:normal;margin: 15px 0 ; ">
                                                            Hi ${accountDetails.first_name?accountDetails.first_name:''} ${accountDetails.last_name?accountDetails.last_name:''},
                                                        </h5>
                                                        <h1 style="font-family: arial,sans-serif; font-size:24px; font-weight:normal; line-height: 20px; color: orange;">
                                                                Please view the details of the invoice below.
                                                        </h1>

                                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                <tbody>
                                                                    <tr>
                                                                        <td align="" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; color: #999;">
                                                                            Invoice No.
                                                                        </td>
                                                                        <td align="right" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; ">
                                                                            ${parseInt(invoiceDetails.record_id.substring(3))}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td align="" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; color: #999;">
                                                                            Issue Date
                                                                        </td>
                                                                        <td align="right" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; ">
                                                                            ${startDateFormatted}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td align="" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; color: #999;">
                                                                            Due Date
                                                                        </td>
                                                                        <td align="right" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; ">
                                                                            ${dueDateFormatted}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td align="" style=" font-size:18px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; color: #999;">
                                                                            Invoice Total
                                                                        </td>
                                                                        <td align="right" style=" font-size:18px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; font-weight: bold;">
                                                                            ${currency_symbols[0].symbol}${invoiceDetails.final_amount}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                        <p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">
                                                            ${emailBody}
                                                        </p>

                                                    </td>
                                                </tr>

                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>

                </tbody>
            </table>
        </div></body></html>`;

        // <tr>
        //     <td valign="top" align="center" style=" font-family: arial,sans-serif; padding:20px 20px 20px 20px; color: #999; font-size: 14px;">
        //         For more help and support <a href="${process.env.BASE_URL}" target="_blank" style="color: #4387fd;"> contact us</a>
        //     </td>
        // </tr>

        // <p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-bottom: 5px;">
        //     Thank you for your business,
        // </p>
        // <p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-top: 5px;">
        //     ${companyName}
        // </p>
        // <table border="0" cellpadding="0" cellspacing="0" width="100%">
        //     <tbody>
        //         <tr>
        //             <td align="center" style="padding: 15px;">
        //                 <table cellpadding="0" cellspacing="0" width="300px" style="margin: 0; padding: 0;">
        //                     <tbody>
        //                         <tr>
        //                             <td align="center" style="font-family: arial,sans-serif;">
        //                                 <a href="${redirectUrl}" target="_blank" style="font-size:14px; color: #ffffff; font-weight:normal; background: #0070d2; border-radius: 4px; display:block; padding: 12px 30px 12px 30px; text-decoration: none;">View Online</a>
        //                             </td>
        //                         </tr>
        //                     </tbody>
        //                 </table>
        //             </td>
        //         </tr>
        //     </tbody>
        // </table>
  // console.log("Inside send mail " + req.body);
  let extra_email = req.body.extra_email.split(',');
  extra_email = extra_email.filter(email_id => isValidEmail(email_id));
  console.log('extra_email')
  console.log(extra_email)
  const mailOptions = {
    to: req.body.client_email,
    cc: req.body.extra_email.split(','),
    from: '"'+req.user.company_info.name+'"support@krowsoftware.com',
    subject: req.body.subject_line?req.body.subject_line:"Invoice from " + companyName + " on Krow PSA",
    html: html,
    attachments :[
      {
          filename: 'Timesheet-invoice.pdf',
          contentType: 'application/pdf',
          content: req.body.pdfFile
      }
    ]
  };

  req.mailOptions = mailOptions;
  // console.log('transpoter');
  email.sendMail(req, res, function(error, info) {
    // console.log('transpoter');
    if (error) {
      console.log(error);
      next(error, null);
    } else {
      // console.log('Message sent: ' + info.response);
      next(null, info);
      /*res.status(200).json({"success": true,"message":"success" });*/
    }
  });
};

function isValidEmail(inputtxt){
  var emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  if(inputtxt.match(emailReg)) {
      return true;
  }
  return false;
}

exports.generatePdfFromHtml= (req, res) => {
    console.log('req.params.invoiceId');
    invoiceHtmlData(req,res,false,'');
    /*let invoiceDetails=JSON.parse(req.query.invoiceDetails);
    let lineItems=JSON.parse(req.query.lineItems);*/

};

exports.generateHtml= (req, res) => {
    var html = fs.readFileSync('views/pages/invoice-pdf-template.html', 'utf8');
    pdf.create(html).toStream(function (err, stream) {
        if (err) {
            handleResponse.handleError(res, err, ' Error in generating pdf data');
        }
        else{

            res.setHeader('Content-Type', 'application/force-download');
            res.setHeader('Content-disposition', 'attachment;filename=invoice.pdf');
            res.setHeader('content-type', 'application/pdf');

            stream.pipe(res);
        }
    });

};
