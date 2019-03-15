const pg = require("pg");
var pool = require('./../config/dbconfig');
var handleResponse = require('./page-error-handle');
const request = require('request');
const pdf = require('html-pdf');
var fs = require('fs');
const Fixer = require('fixer-node')
const fixer = new Fixer('bb5ebdb737191fd21bb0866be1706d33')
const moment = require('moment-timezone');
const setting = require('./company-setting');
const companySettingFile = require('./setting');
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


exports.getInvoice = (req, res) => {
   setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.session.passport.user, error:err},"error"," Error in finding account data");
        /*handleResponse.handleError(res, err, 'Server Error: error in finding company setting');*/
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
                        handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.session.passport.user, error:err},"error"," Error in finding account data");
                        /*handleResponse.handleError(res, err, 'Server error : Error in finding account data');*/
                    } else {

                        let accountIdArr = accountList.rows.map(function (ele) {
                            return ele.id;
                        });
                        // console.log(" *** accountIdArr *** ");
                        // console.log(accountIdArr);
                        whereClause='WHERE company_id=$1 AND archived=$2 AND account_id IN(SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) '
                        client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax ,(SELECT count(*) FROM INVOICE '+whereClause+') as totalCount,(SELECT count(*) FROM INVOICE '+whereClause+' AND status ilike $3) as draftCount,(SELECT count(*) FROM INVOICE '+whereClause+' AND status ilike $4) as paidCount FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id OFFSET 0 LIMIT ' + process.env.PAGE_RECORD_NO, [req.user.company_id, false,'Draft','Paid'], function (err, invoiceList) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.session.passport.user, error:err},"error"," Error in finding invoice data");
                                /*handleResponse.handleError(res, err, 'Server error : Error in finding invoice data');*/
                            } else {
                                let invoiceListArr = [];
                                /*let draftInvoice=[];
                                let approvedInvoice=[];*/
                                let totalCount=0,draftCount=0,paidCount=0;
                                if(invoiceList.rows.length>0){
                                    invoiceList.rows.forEach(function (invoice) {
                                        if(accountIdArr.includes(invoice.account_id)) {
                                            // invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(moment.tz(invoice.start_date, companyDefaultTimezone).format());
                                            // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(moment.tz(invoice.due_date, companyDefaultTimezone).format());
                                            invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                            invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
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
                                handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: accountList.rows, invoiceList: invoiceListArr,totalCount:totalCount, draftCount:draftCount, paidCount:paidCount, user: req.session.passport.user },"success","Successfully rendered");
                                /*res.render('pages/invoices-listing', { accounts: accountList.rows, invoiceList: invoiceList.rows, user: req.session.passport.user });*/
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
            // let start_date = dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
            client.query('SELECT * FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, defaultCompanySetting) {
                if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, 'Server error : Error in finding default invoice for the company');
                }
                else {
                    let companySetting=defaultCompanySetting.rows[0];
                    // let createdDate=moment.tz(new Date(), companyDefaultTimezone).format();
                    client.query('INSERT INTO INVOICE ( account_id, company_id, created_by, created_date, due_date,updated_date, account_name, start_date, currency, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [req.body.accountId, req.user.company_id, req.user.id, 'now()', 'now()' , 'now()', req.body.accountName, 'now()', companySetting.currency,companySetting.invoice_note], function (err, invoiceId) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Server error : Error in adding invoice data to the database');
                        } else {
                            done();
                            handleResponse.sendSuccess(res,'Invoice added successfully',{"id": invoiceId.rows[0].id});
                        }
                    });
                }
            });
        });
    } else{
        done();
        res.redirect('/domain');
      }

};
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

                    if(invoiceItemData.id!=undefined&&invoiceItemData.id!=null&&invoiceItemData.id!=""){
                        client.query('UPDATE INVOICE_LINE_ITEM set type=$1,item_date=$2,project_id=$3,updated_date=$4,total_amount=$5,note=$6 WHERE id=$7 RETURNING id', [invoiceItemData.type, moment.tz(invoiceItemData.item_date.split('T')[0], companyDefaultTimezone).format(), invoiceItemData.project_id,'now()', invoiceItemData.total_amount, invoiceItemData.note,invoiceItemData.id], function (err, invoiceLineItem) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, 'Server error : Error in updating invoice line item data');
                            } else {
                                // console.log(invoiceLineItem);
                                count++;
                                if(req.body.invoiceItemArray.length===count){
                                    done();
                                    handleResponse.sendSuccess(res,'Invoice line item updated successfully',{"id": invoiceLineItem.rows[0].id});
                                    /*res.status(200).json({ "success": true, "id": id = invoiceLineItem.rows[0].id,"message":"success" });*/
                                }
                            }
                        });
                    }else{
                        client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date,total_amount,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [invoiceItemData.type, moment.tz(invoiceItemData.item_date.split('T')[0], companyDefaultTimezone).format(), invoiceItemData.project_id, invoiceItemData.account_id, invoiceItemData.invoice_id, req.user.company_id, 'now()', 'now()', invoiceItemData.total_amount, invoiceItemData.note], function (err, invoiceLineItem) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, 'Server error : Error in adding invoice line item data to the database');
                            } else {
                                // console.log(invoiceLineItem);
                                count++;
                                if(req.body.invoiceItemArray.length===count){
                                    done();
                                    handleResponse.sendSuccess(res,'Invoice line item updated successfully',{"id": invoiceLineItem.rows[0].id});
                                    /*res.status(200).json({ "success": true, "id": id = invoiceLineItem.rows[0].id,"message":"success" });*/
                                }
                            }
                        });
                    }
                });
          });
    } else{
        handleResponse.handleError(res, err, 'Server error : Invoice item data is empty');
    }

};

function getUserBRandCR(req, res, client, err, done, userId, projectId, userRole, taskId, result) {
    // console.log('userId in getUserBRandCR');
    // console.log(userId);
    console.log('get data for task assignment');
    console.log(userId+' '+userRole+' '+projectId+' '+taskId);
    client.query('SELECT bill_rate, cost_rate FROM task_assignment where user_id=$1 AND user_role=$2 AND project_id=$3 AND task_id=$4', [userId, userRole, projectId, taskId], function (err, userData) {
    if(err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, 'Server error : Error in finding br and cr for timesheet data with task_id');
    } else {
        console.log('-----userData.rows--');
        console.log(userData.rows);
        if(userData.rows.length > 0 || userRole == undefined) {
            return result(userData.rows[0]);
        } else {
            client.query('SELECT bill_rate, cost_rate FROM users where id=$1', [userId], function (err, userBrCr) {
                if(err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, 'Server error : Error in finding br and cr for timesheet data with user_id');
                } else {
                    return result(userBrCr.rows[0]);
                }
            });
        }
    }
    });
}
exports.insertTimesheetInvoiceItem = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
       handleResponse.handleError(res, err, 'Server error : Error in finding company setting data');
     }else{
         companyDefaultTimezone=result.timezone;
        // console.log("Inside timesheet add");
        req.assert('accountId', 'Account cannot be blank').notEmpty();
        req.assert('projectId', 'Project cannot be blank').notEmpty();
        req.assert('invoiceId', 'Invoice id cannot be blank').notEmpty();
        const errors = req.validationErrors();
          if (errors) {
            if(errors.length>0){
                // console.log(errors[0].msg);
                handleResponse.handleError(res, errors, "Server Error :"+errors[0].msg);
              }else{
                 handleResponse.handleError(res, errors, "Server Error : Error in validating data.");
              }
          }else{

              // console.log("req.body.project_type");
              // console.log(req.body.project_type);
                if(req.body.project_type == "fixed_fee") {
                    pool.connect((err, client, done) => {
                        client.query('SELECT *,(SELECT currency FROM ACCOUNT WHERE id=$2) as currency FROM project WHERE id=$1', [req.body.projectId,req.body.accountId], function (err, projectDetails) {
                            if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, 'Server error : Error in finding currency from project for timesheet data');
                            } else {
                                if(projectDetails.rowCount > 0) {
                                    let projectData = {};
                                    projectData.amount = projectDetails.rows[0].project_cost != null ? parseInt(projectDetails.rows[0].project_cost) : 0;
                                    projectData.user_id = req.user.id;
                                    projectData.quantity = 1;
                                    projectData.unit_price = projectDetails.rows[0].project_cost != null ? parseInt(projectDetails.rows[0].project_cost) : 0;
                                    projectData.note = '';
                                    projectData.id = null;
                                    projectData.user_role = '';
                                    projectData.type = 'Fixed Fee Project';
                                    projectData.currency = projectDetails.rows[0].currency;
                                    // ['Expense', new Date(), req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, new Date(), new Date(), data.amount, data.user_id, data.quantity, data.amount, data.note, data.id, data.user_role]
                                    addInvoiceLineItem(req, res, client, err, done, projectData, function (result) {
                                        if(result) {
                                            handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
                                        }
                                    });
                                    // INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, total_amount, user_id, quantity, unit_price, note, expense_id, user_role)
                                }
                            }
                        });
                    });
                } else {
                    // let newDate=moment.tz(new Date(), companyDefaultTimezone).format()
                    // console.log("Steps Start");
                    // console.log("Step 1");
                    if(req.body.start_date!=null&&req.body.start_date!=undefined&&req.body.start_date!='') {
                        // console.log("Step 2");
                        pool.connect((err, client, done) => {
                            // select resource_id, project_id, task_id, user_role, SUM(total_work_hours) as TWH from timesheet_line_item where project_id=7 AND invoiced=false AND created_date>= '2018-09-01' AND created_date<='2018-09-20' AND submitted=true GROUP BY resource_id, project_id, task_id, user_role
                            client.query('select tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,tl.week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime  ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id from  timesheet_line_item tl where submitted=$1 and invoiced=$2 and billable=$3 and project_id=$4 AND created_date>= $5 AND created_date<=$6 order by task_id, resource_id, user_role', [true, false, true, req.body.projectId, moment.tz(req.body.start_date.split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.end_date.split('T')[0], companyDefaultTimezone).format()], function (err, lineItems) {
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, 'Server error : Error in finding timesheet data with start_date');
                                }  else {
                                    if(lineItems.rows.length>0) {
                                        // console.log(JSON.stringify(lineItems.rows));
                                        /*createGroupedObjWithTask(lineItems.rows, function (concatData) {
                                        // console.log("response get");
                                          calculateBR_CR_andGrouped(req, res, client, err, done, concatData, function(projectRow) {
                                              // console.log("Grouped and calculate data");
                                              client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, amount, total_amount, quantity, currency, timesheet_row_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id', ['Timesheet', 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', projectRow.totalProjectCost, projectRow.totalProjectCost, parseInt(projectRow.totalHours), companyDefaultCurrency, projectRow.lineItemIds], function (err, invoiceLineItem) {
                                                  if (err) {
                                                      console.error(err);
                                                      handleResponse.shouldAbort(err, client, done);
                                                      handleResponse.handleError(res, err, 'Server error : Error in adding invoice line item data to the database');
                                                  } else {
                                                      // console.log("Line Item inserted");
                                                      createRecordArr(projectRow.lineItemIds, function (lineItemIds) {
                                                          // console.log(lineItemIds);
                                                          client.query('UPDATE TIMESHEET_LINE_ITEM SET invoiced=$1,invoice_id=$2 WHERE id IN '+lineItemIds, [true,req.body.invoiceId], function (err, timesheetUpdatedItem) {
                                                              if (err) {
                                                                  console.error(err);
                                                                  handleResponse.shouldAbort(err, client, done);
                                                                  handleResponse.handleError(res, err, 'Server error : Error in updating timesheet data');
                                                              } else {
                                                                  done();
                                                                  handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
                                                              }
                                                          });
                                                      });
                                                  }
                                              });
                                          });
                                      });*/
                                      createGroupedObjWithTask(lineItems.rows, function (concatData) {
                                          // console.log("response get");
                                          // console.log(concatData);
                                          client.query('SELECT pa.id ,pa.company_id ,pa.account_id ,pa.user_id ,pa.project_id ,pa.created_by ,pa.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,pa.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,pa.bill_rate ,pa.cost_rate ,pa.user_role ,pa.record_id FROM PROJECT_ASSIGNMENT pa WHERE project_id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, projectAssignments) {
                                              if (err) {
                                                  handleResponse.shouldAbort(err, client, done);
                                                  handleResponse.handleError(res, err, 'Server error : Error in finding project assginment for timesheet data');
                                              } else {
                                                  calculateBR_CR_andGrouped(req, res, client, err, done, concatData, projectAssignments.rows, function(projectRows) {
                                                      // console.log("Grouped and calculate data");
                                                      // console.log(JSON.stringify(projectRows));
                                                      projectRows.forEach(function (projectRow, index) {
                                                          client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, amount, total_amount, quantity, currency, timesheet_row_id, user_id, user_role, unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id', ['Timesheet', 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', projectRow.totalProjectCost, projectRow.totalProjectCost, parseInt(projectRow.totalHours), companyDefaultCurrency, projectRow.lineItemIds, projectRow.resource_id, projectRow.user_role, parseInt(projectRow.unit_price)], function (err, invoiceLineItem) {
                                                              if (err) {
                                                                  console.error(err);
                                                                  handleResponse.shouldAbort(err, client, done);
                                                                  handleResponse.handleError(res, err, 'Server error : Error in adding invoice line item data to the database');
                                                              } else {
                                                                  // console.log("Line Item inserted");
                                                                  createRecordArr(projectRow.lineItemIds, function (lineItemIds) {
                                                                      // console.log(lineItemIds);
                                                                      client.query('UPDATE TIMESHEET_LINE_ITEM SET invoiced=$1,invoice_id=$2 WHERE id IN '+lineItemIds, [true,req.body.invoiceId], function (err, timesheetUpdatedItem) {
                                                                          if (err) {
                                                                              console.error(err);
                                                                              handleResponse.shouldAbort(err, client, done);
                                                                              handleResponse.handleError(res, err, 'Server error : Error in updating timesheet data');
                                                                          } else {
                                                                              if(projectRows.length == (index+1)) {
                                                                                  done();
                                                                                  handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
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
                                        handleResponse.handleError(res, 'timesheet not found', 'Server Error : No timesheet associated with this project is left for invoicing');
                                    }
                                }
                            });
                         });
                    }else{
                        pool.connect((err, client, done) => {
                            client.query('select tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,tl.week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime  ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id from timesheet_line_item tl where submitted=$1 and invoiced=$2 and billable=$3 and project_id=$4 order by task_id, resource_id, user_role', [true, false, true, req.body.projectId], function (err, lineItems) {
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, 'Server error : Error in finding timesheet data');
                                }  else {
                                    if(lineItems.rows.length>0) {
                                        // console.log(JSON.stringify(lineItems.rows));
                                        createGroupedObjWithTask(lineItems.rows, function (concatData) {
                                            // console.log("response get");
                                            // console.log(concatData);
                                            client.query('SELECT pa.id ,pa.company_id ,pa.account_id ,pa.user_id ,pa.project_id ,pa.created_by ,pa.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,pa.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,pa.bill_rate ,pa.cost_rate ,pa.user_role ,pa.record_id FROM PROJECT_ASSIGNMENT pa WHERE project_id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, projectAssignments) {
                                                if (err) {
                                                    handleResponse.shouldAbort(err, client, done);
                                                    handleResponse.handleError(res, err, 'Server error : Error in finding project assginment for timesheet data');
                                                } else {
                                                    calculateBR_CR_andGrouped(req, res, client, err, done, concatData, projectAssignments.rows, function(projectRows) {
                                                        // console.log("Grouped and calculate data");
                                                        // console.log(JSON.stringify(projectRows));
                                                        projectRows.forEach(function (projectRow, index) {
                                                            client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, amount, total_amount, quantity, currency, timesheet_row_id, user_id, user_role, unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id', ['Timesheet', 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', projectRow.totalProjectCost, projectRow.totalProjectCost, parseInt(projectRow.totalHours), companyDefaultCurrency, projectRow.lineItemIds, projectRow.resource_id, projectRow.user_role, parseInt(projectRow.unit_price)], function (err, invoiceLineItem) {
                                                                if (err) {
                                                                    console.error(err);
                                                                    handleResponse.shouldAbort(err, client, done);
                                                                    handleResponse.handleError(res, err, 'Server error : Error in adding invoice line item data to the database');
                                                                } else {
                                                                    // console.log("Line Item inserted");
                                                                    createRecordArr(projectRow.lineItemIds, function (lineItemIds) {
                                                                        // console.log(lineItemIds);
                                                                        client.query('UPDATE TIMESHEET_LINE_ITEM SET invoiced=$1,invoice_id=$2 WHERE id IN '+lineItemIds, [true,req.body.invoiceId], function (err, timesheetUpdatedItem) {
                                                                            if (err) {
                                                                                console.error(err);
                                                                                handleResponse.shouldAbort(err, client, done);
                                                                                handleResponse.handleError(res, err, 'Server error : Error in updating timesheet data');
                                                                            } else {
                                                                                if(projectRows.length == (index+1)) {
                                                                                    done();
                                                                                    handleResponse.sendSuccess(res,'Invoice line item for timesheet data added successfully',{});
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
                                        handleResponse.handleError(res, 'timesheet not found', 'Server Error : No timesheet associated with this project is left for invoicing');
                                    }
                                }
                            });
                         });
                    }
                }

          }
        }
      });

};

function createGroupedObjWithTask(lineItems, callback) {
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
            if(line.task_id != groupedArr[arrLength-1].task_id) {
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

function calculateBR_CR_andGrouped(req, res, client, err, done, concatData, projectAssignments, callback) {
    console.log('inside calculate br and cr and group');
    console.log(JSON.stringify(concatData));
    console.log(JSON.stringify(projectAssignments));
    let projectArr = [];
    concatData.forEach(function (mergedRow, index) {
        console.log('concatenated data is')
        console.log(JSON.stringify(mergedRow));
        getUserBRandCR(req, res, client, err, done, mergedRow.resource_id, mergedRow.project_id, mergedRow.user_role, mergedRow.task_id, function(response) {
            console.log('user bill rate and cost rates are');
            console.log(JSON.stringify(response));
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
            let unit_price = projectAssignments.filter(function (projectAssign) {
                if(projectAssign.user_id == mergedRow.resource_id && projectAssign.user_role == mergedRow.user_role) {
                    return projectAssign.bill_rate;
                }
            });
            console.log('unit_price'+unit_price);
            if(index == 0) {
                projectObj.project_id = mergedRow.project_id;
                projectObj.totalHours = parseInt(mergedRow.totalHours);
                projectObj.company_id = mergedRow.company_id;
                projectObj.resource_id = mergedRow.resource_id;
                projectObj.user_role = mergedRow.user_role;
                projectObj.totalProjectCost = totalAmount;
                projectObj.unit_price = unit_price[0].bill_rate;
                projectObj.lineItemIds = mergedRow.lineIds;
                projectArr.push(projectObj);
            } else {
                if (mergedRow.resource_id != projectArr[arrLength-1].resource_id) {
                    projectObj.project_id = mergedRow.project_id;
                    projectObj.totalHours = parseInt(mergedRow.totalHours);
                    projectObj.company_id = mergedRow.company_id;
                    projectObj.resource_id = mergedRow.resource_id;
                    projectObj.user_role = mergedRow.user_role;
                    projectObj.totalProjectCost = totalAmount;
                    projectObj.unit_price = unit_price[0].bill_rate;
                    projectObj.lineItemIds = mergedRow.lineIds;
                    projectArr.push(projectObj);
                } else {
                    if(mergedRow.user_role != projectArr[arrLength-1].user_role) {
                        projectObj.project_id = mergedRow.project_id;
                        projectObj.totalHours = parseInt(mergedRow.totalHours);
                        projectObj.company_id = mergedRow.company_id;
                        projectObj.resource_id = mergedRow.resource_id;
                        projectObj.user_role = mergedRow.user_role;
                        projectObj.totalProjectCost = totalAmount;
                        projectObj.unit_price = unit_price[0].bill_rate;
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
       handleResponse.handleError(res, err, 'Server error : Error in finding company setting data');
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
                // console.log("Step 1");
                if(req.body.start_date!=null&&req.body.start_date!=undefined&&req.body.start_date!='') {
                    client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id FROM EXPENSE e WHERE company_id=$1 AND account_id=$2 AND project_id=$3 AND invoiced=$4 AND expense_date>=$5 AND expense_date<=$6 AND billable=$7', [req.user.company_id, req.body.accountId, req.body.projectId,false,moment.tz(req.body.start_date.split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.end_date.split('T')[0], companyDefaultTimezone).format(),true], function (err, expenseList) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Server error : Error in finding expense data');
                        }  else {
                            // console.log("Step 2");
                            // console.log('expense list to be invoiced is '+JSON.stringify(expenseList));
                            let count=0;
                            if(expenseList.rows.length>0){
                                expenseList.rows.forEach(function (expense) {
                                    expense.user_role = '';
                                    expense.quantity = '1';
                                    expense.type = 'Expense';
                                    expense.unit_price = expense.amount;
                                    addInvoiceLineItem(req, res, client, err, done, expense, function (result) {
                                        // console.log("Step 3");
                                        if(result) {
                                        updateExpenseRecord(req, res, client, err, done, expense, function (result) {
                                            // console.log("Step 4");
                                            if(result) {
                                                count++;
                                                done();
                                                if(expenseList.rows.length===count){
                                                    handleResponse.sendSuccess(res,'Invoice line item for expense data added successfully',{});
                                                    /*res.status(200).json({ "success": true, "message":"success" });*/
                                                } else{
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
                                handleResponse.handleError(res, 'expense not found', 'Server Error : No expense associated with this project is left for invoicing');
                            }
                        }
                    });
                } else {
                    // pool.connect((err, client, done) => {
                    client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id FROM EXPENSE e WHERE company_id=$1 AND account_id=$2 AND project_id=$3 AND invoiced=$4 AND billable=$5', [req.user.company_id, req.body.accountId, req.body.projectId,false,true], function (err, expenseList) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Server error : Error in finding expense data');
                        }  else {
                            // console.log('expense list to be invoiced is '+JSON.stringify(expenseList));
                            let count=0;
                            if(expenseList.rows.length>0){
                                expenseList.rows.forEach(function (expense) {
                                    expense.user_role = '';
                                    expense.quantity = '1';
                                    expense.type = 'Expense';
                                    expense.unit_price = expense.amount;
                                    addInvoiceLineItem(req, res, client, err, done, expense, function (result) {
                                        if(result) {
                                            updateExpenseRecord(req, res, client, err, done, expense, function (result) {
                                                if(result) {
                                                    count++;
                                                    done();
                                                    if(expenseList.rows.length===count){
                                                        handleResponse.sendSuccess(res,'Invoice line item for expense data added successfully',{});
                                                        /*res.status(200).json({ "success": true, "message":"success" });*/
                                                    } else{
                                                        // console.log('count is '+count+' and length is '+expenseList.rows.length);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                });
                            } else {
                                done();
                                handleResponse.handleError(res, 'expense not found', 'Server Error : No expense associated with this project is left for invoicing');
                            }
                        }
                    });
                }
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
    if(type == "Expense") {
        expense_id = data.id;
        timesheet_id = null;
    } else {
        timesheet_id = data.id;
        expense_id = null;
    }
    if(!data.note) {
        data.note = ''
    }
    // console.log('companyDefaultCurrency');
    // console.log(companyDefaultCurrency);
    // let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
    // client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, total_amount, user_id, quantity, unit_price, note, timesheet_id, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id', ['Timesheet', new Date(), req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, new Date(), new Date(), invoicedAmount, timesheet.resource_id, timesheet.user_role,parseInt(response.bill_rate), parseInt(timesheet.total_billable_hours), timesheet.id], function (err, invoiceLineItem) {
    client.query('INSERT INTO INVOICE_LINE_ITEM (type,item_date,project_id,account_id,invoice_id,company_id,created_date, updated_date, total_amount, user_id, quantity, unit_price, note, expense_id, timesheet_id, user_role,currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id', [type, 'now()', req.body.projectId, req.body.accountId, req.body.invoiceId, req.user.company_id, 'now()', 'now()', data.amount, data.user_id, data.quantity, data.unit_price, data.note, expense_id, timesheet_id, data.user_role, currency], function (err, invoiceLineItem) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, 'Server error : Error in adding invoice line item data to the database');
        } else {
            // console.log("inserted invoiceLineItem");
            // console.log();
            return result(true);

        }
    });
}

function updateExpenseRecord(req, res, client, err, done, expense, result) {
    let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
    client.query('UPDATE expense SET invoiced=$1,invoice_id=$2,modified_date=$3 WHERE id=$4', [true,req.body.invoiceId,'now()',expense.id], function (err, expenseUpdatedItem) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, 'Server error : Error in updating expense data');
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
            /*handleResponse.handleError(res, err, 'Server error : Error in finding invoice data');*/
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
        handleResponse.responseToPage(res,'pages/invoices-listing',{accounts: [], invoiceList: [],totalCount:0, draftCount:0, paidCount:0,user:req.session.passport.user, error:err},"error"," Error in finding account data");
        /*handleResponse.handleError(res, err, 'Server Error: error in finding company setting');*/
      }else{
            companyDefaultTimezone = result.timezone;
            companyDefaultCurrency =result.currency;
            // console.log('companyDefaultTimezone');
            // console.log(companyDefaultTimezone);
            // console.log('companyDefaultCurrency');
            // console.log(companyDefaultCurrency);
            let invoiceId=req.query.invoiceId;
            if(invoiceId==''||invoiceId==null||invoiceId==undefined){
                handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.session.passport.user, userList:[], error:err},"error","Server error : Invoice id is not correct");
            }else{

                pool.connect((err, client, done) => {
                    client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax  FROM INVOICE i WHERE company_id=$1 AND id=$2', [req.user.company_id, req.query.invoiceId], function (err, invoiceDetails) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.session.passport.user, userList:[], error:err},"error","Server error : Error in finding invoice data");
                            /*handleResponse.handleError(res, err, 'Server error : Error in finding invoice data');*/
                        }  else {
                            if(invoiceDetails.rows.length>0){
                                // console.log('account id is '+invoiceDetails.rows[0].account_id)
                                client.query('SELECT * FROM PROJECT WHERE company_id=$1 AND account_id=$2 AND archived=$3', [req.user.company_id, invoiceDetails.rows[0].account_id,false], function (err, projects) {
                                    if (err) {
                                        console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.session.passport.user, userList:[], error:err},"error","Server error : Error in finding project data");
                                            /*handleResponse.handleError(res, err, 'Server error : Error in finding project data');*/
                                        }  else {
                                                // console.log('projects are '+JSON.stringify(projects));
                                                client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM INVOICE_LINE_ITEM il WHERE company_id=$1 AND invoice_id=$2 AND archived=$3', [req.user.company_id, req.query.invoiceId, false], function (err, invoiceItems) {
                                                if (err) {
                                                    console.error(err);
                                                    handleResponse.shouldAbort(err, client, done);
                                                    handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.session.passport.user, userList:[], error:err},"error","Server error : Error in finding invoice line item data");
                                                    /*handleResponse.handleError(res, err, 'Server error : Error in finding invoice line item data');*/
                                                } else {
                                                    let invoice_total_amount=0;
                                                    if (invoiceItems.rows.length > 0) {
                                                        invoiceItems.rows.forEach(function (lineItem) {
                                                            // lineItem["item_date"] = dateFormat(moment.tz(lineItem.item_date, companyDefaultTimezone).format());
                                                            lineItem["item_date"] = dateFormat(lineItem.item_date);
                                                            lineItem.inv_qauntity = lineItem.quantity;
                                                            if(lineItem.type == "Timesheet") {
                                                                lineItem.inv_qauntity = minuteToHours(lineItem.quantity);
                                                            }
                                                            console.log(lineItem.total_amount+' '+typeof(lineItem.total_amount)+' '+parseFloat(lineItem.total_amount));
                                                            let currentCurrency=currencyWithSymbolArray.filter(function(currency){
                                                              return currency.name == invoiceDetails.rows[0].currency;
                                                            })

                                                            currentCurrency=parseFloat(currentCurrency[0].value);
                                                            console.log('currentCurrency '+JSON.stringify(currentCurrency));

                                                            console.log('lineItem.currency' +lineItem.currency);
                                                            let previousCurrency=currencyWithSymbolArray.filter(function(currency){
                                                              return currency.name == lineItem.currency;
                                                            })
                                                            console.log('previousCurrency '+previousCurrency);
                                                            previousCurrency=parseFloat(previousCurrency[0].value)
                                                            let line_total_amount=(currentCurrency/previousCurrency*parseFloat(lineItem.total_amount));
                                                            // console.log('total_amount '+line_total_amount);
                                                            invoice_total_amount+=parseFloat(line_total_amount);
                                                            // console.log('total_amount '+invoice_total_amount);

                                                        });
                                                        // console.log("************ invoiceItems *************");
                                                        // console.log(invoiceItems);
                                                    }
                                                    if(invoiceDetails.rows.length>0){
                                                        /*// console.log('total_amount '+invoice_total_amount); */
                                                        invoiceDetails.rows[0].total_amount=invoice_total_amount.toFixed(2);
                                                        // invoiceDetails.rows[0]['startDateFormatted'] = invoiceDetails.rows[0].start_date == null ? '' : dateFormat(moment.tz(invoiceDetails.rows[0].start_date, companyDefaultTimezone).format());
                                                        // invoiceDetails.rows[0]['dueDateFormatted'] = invoiceDetails.rows[0].due_date == null ? '' : dateFormat(moment.tz(invoiceDetails.rows[0].due_date, companyDefaultTimezone).format());
                                                        invoiceDetails.rows[0]['startDateFormatted'] = invoiceDetails.rows[0].start_date == null ? '' : dateFormat(invoiceDetails.rows[0].start_date);
                                                        invoiceDetails.rows[0]['dueDateFormatted'] = invoiceDetails.rows[0].due_date == null ? '' : dateFormat(invoiceDetails.rows[0].due_date);
                                                    }
                                                    let invoice_tax=(parseFloat(invoice_total_amount) * parseFloat(invoiceDetails.rows[0].tax)) / 100;
                                                    invoice_total_amount=(parseFloat(invoice_total_amount)+parseFloat(invoice_tax)).toFixed(2);
                                                    let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
                                                    client.query('UPDATE INVOICE SET total_amount=$1 ,updated_date=$2 WHERE id=$3 RETURNING *', [invoice_total_amount,'now()',req.query.invoiceId], function (err, invoiceUpdated) {
                                                        if (err) {
                                                            console.error(err);
                                                            handleResponse.shouldAbort(err, client, done);
                                                            handleResponse.responseToPage(res,'pages/invoice-details',{projects:[], invoiceDetails: {}, invoiceItems: [], user: req.session.passport.user, userList:[], error:err},"error","Server error : Error in updating invoice data");
                                                            /*handleResponse.handleError(res, err, 'Server error : Error in updating invoice data');*/
                                                        } else {

                                                            getUserDetails(req, res, client, err, done, function (response) {

                                                                // console.log("response");
                                                                // // console.log(projects.rows);
                                                                // console.log('invoice_total_amount '+invoice_total_amount);
                                                                done();
                                                                handleResponse.responseToPage(res,'pages/invoice-details',{projects:projects.rows, invoiceDetails: invoiceDetails.rows[0], invoiceItems: invoiceItems.rows, user: req.session.passport.user, userList:response  },"success","Successfully rendered");
                                                            })

                                                        }
                                                    });
                                                }
                                            });
                                        }
                                });
                            }
                        }
                    });
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
            handleResponse.handleError(res, errors, "Server Error :"+errors[0].msg);
          }else{
             handleResponse.handleError(res, errors, "Server Error : Error in validating data.");
          }
      }else{


            pool.connect((err, client, done) => {
            // console.log(req.body);
            client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM INVOICE_LINE_ITEM il WHERE company_id=$1 AND id=$2', [req.user.company_id, req.body.invoice_item_id], function (err, invoiceItemDetails) {
                if (err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, 'Server error : Error in finding invoice line item data');
                } else {
                    // console.log(invoiceItemDetails);
                    let item_date=moment.tz(req.body.item_date, companyDefaultTimezone).format();
                    client.query('UPDATE INVOICE_LINE_ITEM SET type=$1,item_date=$2,hours=$3,unit_price=$4,tax=$5,project_id=$6,account_id=$7,expense_id=$8, updated_date=$9,amount=$10,total_amount=$11,note=$12 WHERE id=$13 AND company_id=$14 ', [req.body.type, item_date, req.body.hours, req.body.bill_rate, req.body.tax, req.body.project_id, req.body.account_id, req.body.expense_id, newDate, req.body.amount, req.body.total_amount, req.body.note, req.body.invoice_item_id, req.user.company_id], function (err, updatedData) {
                        // console.log('Error >>>>>>>>>>>>>');
                        // console.log(err);
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Server error : Error in updating invoice line item data');
                        } else {
                            done();
                            // console.log('Updated Invoice Item>>>>>>>>>>>>>');
                            // console.log(updatedData);
                            handleResponse.sendSuccess(res,'Invoice item detail updated successfully',{});
                            /*res.status(200).json({ "success": true ,"message":"success"});*/
                        }
                    });
                }
            });
        });

      }

};

exports.postInvoiceDetails = (req, res) => {
    let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
    pool.connect((err, client, done) => {

        /*req.body.start_date = req.body.start_date == '' ? null : req.body.start_date;*/
        req.body.due_date = req.body.due_date == '' ? null : moment.tz(req.body.due_date, companyDefaultTimezone).format();
        // console.log(req.body);
        client.query('SELECT * FROM INVOICE WHERE company_id=$1 AND id=$2', [req.user.company_id, req.body.invoiceId], function (err, invoiceDetails) {
            if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, 'Server error : Error in finding invoice data');
            } else {
                client.query('UPDATE INVOICE SET  due_date=$1, description=$2, updated_date=$3, currency=$4, total_amount=$7, tax=$8 WHERE id=$5 AND company_id=$6', [moment.tz(req.body.due_date.split('T')[0], companyDefaultTimezone).format(), req.body.description, 'now()',req.body.currency , req.body.invoiceId, req.user.company_id, req.body.total_amount, req.body.tax_per], function (err, updatedData) {
                    // console.log('Error >>>>>>>>>>>>>');
                    // console.log(err);
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, 'Server error : Error in updating invoice data');
                    } else {
                        done();
                        // console.log('Updated Invoice >>>>>>>>>>>>>');
                        // console.log(updatedData);
                        handleResponse.sendSuccess(res,'Invoice updated successfully',{});
                        /*res.status(200).json({ "success": true ,"message":"success"});*/
                    }
                });
            }
        });
    });

};
exports.deleteInvoiceItem = (req, res) => {
    if(req.user){
        // console.log('Archived Invoice item-------------' + req.body.invoiceItemId);
        let invoiceItemId=req.body.invoiceItemId;
        if(invoiceItemId==''||invoiceItemId==null||invoiceItemId==undefined){
            handleResponse.handleError(res, 'incorrect invoice item id', 'Server Error : Invoice item id is not correct');
        } else {
            pool.connect((err, client, done) => {
                // console.log("Inv Type");
                // console.log(req.body.deleteRecord);
                if(req.body.deleteRecord == "TIMESHEET") {
                    client.query('SELECT * FROM invoice_line_item WHERE id=$1', [req.body.invoiceItemId], function (err, lineItemDetails) {
                       if (err) {
                        handleResponse.handleError(res, 'incorrect invoice item id', 'Server Error : Invoice item id is not correct');
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
                                       done();
                                       handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                                   });
                               } else {

                               }
                           });
                       }
                    });
                } else if (req.body.deleteRecord == "EXPENSE") {
                    unInvoicedExpense(done, res, err, client, req.body.expenseId, function (result) {
                        if(result) {
                            deleteInvoiceLineItem(done, res, err, client, req.body.invoiceItemId, function (response) {
                                done();
                                handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                            });
                        } else {

                        }
                    });
                } else {
                    // console.log()
                    client.query('DELETE FROM invoice_line_item WHERE id=$1', [invoiceItemId], function (err, updatedIRec) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Server error : Error in deleting invoice line item.');
                        } else {
                            done();
                            handleResponse.sendSuccess(res,'Invoice detail data deleted successfully',{});
                        }
                    });
                }
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
            handleResponse.handleError(res, err, 'Server error : Error in deleting invoice line item.');
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
            handleResponse.handleError(res, err, 'Server error : Error in deleting invoice line item.');
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
            handleResponse.handleError(res, err, 'Server error : Error in deleting invoice line item.');
        } else {
            return result(true);
        }
    });
}

exports.deleteInvoice = (req, res) => {
    if(req.user){
        // console.log('Archived Invoice -------------' + req.body.invoiceId);
        let invoiceId=req.body.invoiceId;
        if(invoiceId==''||invoiceId==null||invoiceId==undefined){
             handleResponse.handleError(res, 'incorrect invoice id', 'Server Error : Invoice id is not correct');
        }else{

            pool.connect((err, client, done) => {
                client.query('UPDATE invoice SET archived = $1 WHERE id=$2', [true, req.body.invoiceId], function (err, archivedInvoice) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, 'Server error : Error in deleting invoice.');
                    } else {
                        console.error('Affected ID>>>>>>>>>>>>>');
                        // console.log(archivedInvoice.rows[0]);
                        done();
                        handleResponse.sendSuccess(res,'Invoice Deleted successfully',{});
                        /*res.status(200).json({ "success": true ,"message":"success"});*/
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
  // console.log("findInvoiceByCriteria----------------------------------"+req.body.searchField);

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
      searchCriteriaVal.push(false);
      let queryToExec='SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax ,(SELECT count(*) FROM INVOICE '+whereClause+') as searchCount FROM INVOICE i '+whereClause+' ORDER BY start_date DESC,record_id OFFSET '+offset+' LIMIT ' + process.env.PAGE_RECORD_NO;
      // console.log('queryToExec '+queryToExec+' '+searchCriteriaVal);
      client.query(queryToExec,searchCriteriaVal, function (err,invoiceList) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, 'Server Error: Error in finding invoice data');
        }
        else{
            client.query('SELECT id,name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, account) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, 'Server Error: Error in finding account data');
                /*handleResponse.handleError(res, err, 'Server error : Error in finding account data');*/
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
                if(invoiceList.rows.length>0){
                    invoiceList.rows.forEach(function (invoice) {
                        if(accountIdArr.includes(invoice.account_id)) {
                            // invoice['startDateFormatted'] = invoice.start_date == null ? null : dateFormat(moment.tz(invoice.start_date, companyDefaultTimezone).format());
                            // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(moment.tz(invoice.due_date, companyDefaultTimezone).format());
                            invoice['startDateFormatted'] = invoice.start_date == null ? null : dateFormat(invoice.start_date);
                            invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
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
              handleResponse.handleError(res, err, 'Server Error: Error in finding account data');
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
                          /*handleResponse.responseToPage(res,'pages/org-listing',{user:req.session.passport.user, error:err},"error"," Error in finding company data");*/
                          handleResponse.handleError(res, err, 'Server Error: Error in finding invoice for account');
                        }
                        else{
                            if(invoices.rows.length>0){
                                invoices.rows.forEach(function (invoice,index) {
                                    // invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(moment.tz(invoice.start_date, companyDefaultTimezone).format());
                                    // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(moment.tz(invoice.due_date, companyDefaultTimezone).format());
                                    invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                    invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
                                    invoiceList.push(invoice);
                                    if(index==(invoices.rows.length-1)){
                                      searchCount=parseInt(invoices.rows[0].searchcount);
                                      done();
                                      handleResponse.sendSuccess(res,'Invoices searched successfully',{invoices: invoiceList,count:searchCount});
                                    }
                                });
                            }
                        }
                      });

                // });
              }else{
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, 'Server Error: Cannot find account with this name');
              }
            }
          });
        }else{

            client.query('SELECT id, name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                if (err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, 'Server Error: Error in finding account data');
                    /*handleResponse.handleError(res, err, 'Server error : Error in finding account data');*/
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
                            handleResponse.handleError(res, err, 'Server Error: Error in finding invoice data');
                            /*handleResponse.handleError(res, err, 'Server error : Error in finding invoice data');*/
                        } else {
                            invoiceListArr=[];
                            let searchCount=0;
                            if(invoiceList.rows.length>0){
                                invoiceList.rows.forEach(function (invoice) {
                                    if(accountIdArr.includes(invoice.account_id)) {
                                        // invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(moment.tz(invoice.start_date, companyDefaultTimezone).format());
                                        // invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(moment.tz(invoice.due_date, companyDefaultTimezone).format());
                                        invoice['startDateFormatted'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                        invoice['dueDateFormatted'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);
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

function invoiceHtmlData (req,res,invoiceHtml){
    let invId = req.params.invoiceId;
    // console.log("invId");
    // console.log(invId);
    setting.getCompanySetting(req, res ,(err,result)=>{
       if(err==true){
         // console.log('error in setting');
         // console.log(err);
         handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching company setting ");
         /*handleResponse.handleError(res, err, 'Server Error: error in finding company setting');*/
       }else{
             companyDefaultTimezone = result.timezone;
            pool.connect((err, client, done) => {
                client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.record_id ,i.currency ,i.tax  FROM invoice i WHERE id=$1',[invId], function (err, invoiceDetails) {
                    if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        if(invoiceHtml==true){
                            handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching invoice details");
                        }else{
                            handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                        }
                    } else {
                        client.query('SELECT * FROM account WHERE id=$1',[invoiceDetails.rows[0].account_id], function (err, accountDetails) {
                        if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            if(invoiceHtml==true){
                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching invoice details");
                            }else{
                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                            }
                        } else {
                            client.query('SELECT * FROM setting WHERE company_id=$1',[req.user.company_id], function (err, companySetting) {
                            if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                if(invoiceHtml==true){
                                    handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching invoice details");
                                }else{
                                    handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                }
                            } else {
                                    client.query('SELECT il.id ,il.type ,il.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,il.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,il.item_date at time zone \''+companyDefaultTimezone+'\' as item_date ,il.archived ,il.hours ,il.unit_price ,il.cost_rate ,il.note ,il.amount ,il.tax ,il.total_amount ,il.timesheet_id ,il.expense_id ,il.project_id ,il.account_id ,il.invoice_id ,il.company_id ,il.user_id ,il.user_role ,il.quantity ,il.record_id ,il.currency ,il.timesheet_row_id FROM invoice_line_item il WHERE  invoice_id=$1',[invId], function (err, invoiceLineItems) {
                                        if (err) {
                                            handleResponse.shouldAbort(err, client, done);
                                            if(invoiceHtml==true){
                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching invoice details");
                                            }else{
                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                            }
                                        } else {
                                            client.query('SELECT * FROM project WHERE company_id=$1 AND account_id=$2',[req.user.company_id, invoiceDetails.rows[0].account_id], function (err, projects) {
                                                if (err) {
                                                    handleResponse.shouldAbort(err, client, done);
                                                    if(invoiceHtml==true){
                                                        handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching invoice details");
                                                    }else{
                                                        handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                                    }
                                                } else {
                                                    client.query('SELECT name FROM company WHERE id = $1',[req.user.company_id], function (err, companyName) {
                                                        if (err) {
                                                            handleResponse.shouldAbort(err, client, done);
                                                            if(invoiceHtml==true){
                                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err},"error"," Error in fetching invoice details");
                                                            }else{
                                                                handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err,pdfError:true},"error"," Error in fetching invoice details");
                                                            }
                                                        } else {
                                                                // console.log('---length---');
                                                                /*// console.log(invoiceLineItems.rows);*/
                                                                getUserDetails(req, res, client, err, done, function (userList) {
                                                                    /*// console.log("invoiceLineItems");
                                                                    // console.log(invoiceLineItems);*/
                                                                    let invoiceLineList=[];
                                                                    if(invoiceLineItems.rows.length > 0) {
                                                                        invoiceLineItems.rows.forEach(function (lines,index) {
                                                                            let symbolsToSearch="EUR, "+invoiceDetails.rows[0].currency+", "+lines.currency;
                                                                            // console.log(symbolsToSearch)
                                                                            /*fixer.latest({ symbols: symbolsToSearch }).then((latest)=>{*/
                                                                                let currentCurrency=currencyWithSymbolArray.filter(function(currency){
                                                                                  return currency.name == invoiceDetails.rows[0].currency;
                                                                                })
                                                                                currentCurrency=parseFloat(currentCurrency[0].value);
                                                                                let previousCurrency=currencyWithSymbolArray.filter(function(currency){
                                                                                  return currency.name == lines.currency;
                                                                                })
                                                                                // // console.log('currentCurrency '+currentCurrency)
                                                                                previousCurrency=parseFloat(previousCurrency[0].value)
                                                                                /*// console.log('previousCurrency '+previousCurrency)
                                                                                // console.log('line amount is'+lines.total_amount);*/
                                                                                lines.total_amount=(currentCurrency/previousCurrency*(lines.total_amount)).toFixed(2);
                                                                                lines.unit_price=(currentCurrency/previousCurrency*(lines.unit_price)).toFixed(2);
                                                                                /*// console.log('-------latest------');
                                                                                // console.log(latest);*/
                                                                                lines.inv_qauntity = lines.quantity;
                                                                                if(lines.type == "Timesheet") {
                                                                                    lines.inv_qauntity = minuteToHours(lines.quantity);
                                                                                }
                                                                                lines['totalHoursFormatted'] = minuteToHours(lines.quantity);
                                                                                lines['user_email'] = userList.find(function (obj) {
                                                                                    if(obj.id == lines.user_id) {
                                                                                        return obj.email;
                                                                                    }
                                                                                });
                                                                                // console.log('amount '+lines.total_amount);
                                                                                invoiceLineList.push(lines);
                                                                                // console.log(invoiceLineItems.rows.length+' '+(index+1));
                                                                                if(invoiceLineItems.rows.length==(index+1)){

                                                                                        // console.log('invoiceLineList');
                                                                                        // console.log(invoiceLineItems.rows.length+' '+(index+1));
                                                                                        /*// console.log(invoiceLineList);*/
                                                                                        // let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':dateFormat(moment.tz(invoiceDetails.rows[0].created_date, companyDefaultTimezone).format());
                                                                                        // let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':dateFormat(moment.tz(invoiceDetails.rows[0].due_date, companyDefaultTimezone).format());
                                                                                        let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':dateFormat(invoiceDetails.rows[0].created_date);
                                                                                        let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':dateFormat(invoiceDetails.rows[0].due_date);
                                                                                        // console.log('start and due dates arre'+startDateFormatted+' '+dueDateFormatted);
                                                                                        invoiceDetails.rows[0]['startDateFormatted'] = startDateFormatted;
                                                                                        invoiceDetails.rows[0]['dueDateFormatted'] = dueDateFormatted;
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
                                                                                            /*// console.log('dates are');
                                                                                            // console.log(invoiceDetails.rows[0].startDateFormatted+' '+invoiceDetails.rows[0].created_date);
                                                                                            // console.log(invoiceDetails.rows[0].dueDateFormatted+' '+invoiceDetails.rows[0].due_date);*/
                                                                                            handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err, invoiceDetails : invoiceDetails.rows[0], lineItems : invoiceLineList, accountDetails:accountDetails.rows[0],companySetting:companySetting.rows[0], projects:projects.rows,companyName:companyName.rows[0].name},"success","Successfully rendered");
                                                                                        }else{

                                                                                            generatePdf(req,res,invoiceDetails.rows[0],invoiceLineList,accountDetails.rows[0],companySetting.rows[0], projects.rows,companyName.rows[0].name);
                                                                                        }

                                                                                }

                                                                            /*})*/


                                                                        });

                                                                        /*// console.log("invoiceLineItems");
                                                                        // console.log(JSON.stringify(invoiceLineItems.rows));*/
                                                                    } else {
                                                                        // let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':dateFormat(moment.tz(invoiceDetails.rows[0].created_date, companyDefaultTimezone).format());
                                                                        // let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':dateFormat(moment.tz(invoiceDetails.rows[0].due_date, companyDefaultTimezone).format());
                                                                        let startDateFormatted=invoiceDetails.rows[0]['created_date']==null?'':dateFormat(invoiceDetails.rows[0].created_date);
                                                                        let dueDateFormatted=invoiceDetails.rows[0]['due_date']==null?'':dateFormat(invoiceDetails.rows[0].due_date);
                                                                        console.log('start and due dates arre'+startDateFormatted+' '+dueDateFormatted);
                                                                        invoiceDetails.rows[0]['startDateFormatted'] = startDateFormatted;
                                                                        invoiceDetails.rows[0]['dueDateFormatted'] = dueDateFormatted;
                                                                        handleResponse.responseToPage(res,'pages/invoice-html-view',{user:req.session.passport.user, error:err, invoiceDetails : invoiceDetails.rows[0], lineItems : [], accountDetails:accountDetails.rows[0],companySetting:companySetting.rows[0], projects:projects.rows,companyName:companyName.rows[0].name},"success","Successfully rendered");
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
    invoiceHtmlData(req,res,true);

}
function isComma(string) {
    if(string && string.length > 0) {
        return ','
    } else {
        return '';
    }
}
function generatePdf (req, res, invoiceDetails,lineItems,accountDetails,companySetting, projects,companyName) {
    console.log('inside generate pdf '+invoiceDetails.currency);
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
            if(parseInt(sumOfTotalAmount) > 0) {
                taxAmount = (sumOfTotalAmount * invoiceDetails.tax) / 100;
                totalPaidAmount = sumOfTotalAmount + taxAmount;
            }
            // console.log(taxAmount);
            // console.log(totalPaidAmount);

                let note = '';
                if(invLineDetails.note != null) {
                    note = invLineDetails.note;
                }

                let rowHtml='<tr>'+
                        '<td align="left">'+
                            invLineDetails.type+
                        '</td>'+
                        '<td align="left">'+
                            'Project: '+ projectObj[0].name +
                        '<br />'+
                            'Note: ' + note +
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

    if(sumOfTotalAmount==NaN){
        sumOfTotalAmount=0.00;
    }
    sumOfTotalAmount=sumOfTotalAmount.toFixed(2);
    totalPaidAmount=totalPaidAmount.toFixed(2);
    let company_logo = Buffer.from('base64' , companySetting.company_logo);
    // console.log(company_logo);
    /*let company_logo = companySetting.company_logo;*/
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
    let pdfHTML=`<!DOCTYPE html>
                    <html xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://ww.w3.org/1999/xlink" lang="en">

                    <body style="padding: 4mm; font-family:Helvetica, Arial, ans-Serif; font-size: 14px;">
                        <style>
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
                        </style>
                        <div>
                            <div class="bpd-50">
                                <table class="tbl-fixed">
                                    <tbody>
                                        <tr>
                                            <td class="">
                                                <div class="text-uppercase text-center">
                                                    <h1>${companyName}</h1>
                                                </div>
                                            </td>
                                            <td width="15%">

                                            </td>
                                            <td>
                                                <div>
                                                    <div class="">
                                                        <h1 class="">
                                                            <strong class="ext-uppercase">
                                                                Invoice
                                                            </strong>
                                                        </h1>
                                                    </div>
                                                    <table class="tbl-padded">
                                                        <tbody>
                                                            <tr>
                                                                <td class="">
                                                                    <strong>Invoice No.</trong>
                                                                </td>
                                                                <td>
                                                                    <div class="">
                                                                        ${invoiceDetails.record_id}
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
                                                            <td class="" valign="op" width="20%">
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
                                                            <td class="" valign="op" width="20%">
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
                                            <th scope="col" align="left" width="15%">
                                                Type
                                            </th>
                                            <th scope="
                                                col" align="left" width="40%">
                                                Description
                                            </th>
                                            <th scope="col" align="left">
                                                Qty / Hr
                                            </th>
                                            <th scope="col" align="left">
                                                Unit Price
                                            </th>
                                            <th scope="col" align="right">
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
                                                ${currency_symbols[0].symbol} ${sumOfTotalAmount}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="right">
                                                Tax
                                            </td>
                                            <td align="right" width="20%">
                                                ${currency_symbols[0].symbol} ${taxAmount}
                                            </td>
                                        </tr>

                                        <tr class="bg-dull">
                                            <td align="right">
                                                <span class="text-size-18">
                                                    Total Amount
                                                </span>
                                            </td>
                                            <td align="right" width="20%">
                                                <strong class="text-size-18">
                                                    ${currency_symbols[0].symbol} ${(totalPaidAmount)}
                                                </strong>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="" id="pageFooter">
                                <span class="text-dull">
                                    ${invoiceDetails.description}
                                </span>

                            </div>
                        </div>
                    </body>

                    </html>`;

    // console.log(pdfHTML);
    // request('https://webtopdf.expeditedaddons.com/?api_key=' + process.env.WEBTOPDF_API_KEY + '&content='+pdfHTML+'&html_width=1024&margin=10&title=My+PDF+Title', function (error, response, body) {
    //   // // console.log('Status:', response.statusCode);
    //   // // console.log('Headers:', JSON.stringify(response.headers));
    //   // // console.log('Response:', body);
    //   res.setHeader('Content-Type', 'application/force-download');
    //   res.setHeader('Content-disposition', 'attachment;filename=invoice.pdf');
    //   res.setHeader('content-type', 'application/pdf');
    //   res.send(body);
    // });
    var options = { format: 'Letter',height: "14.5in",width: "11in"
    };
    pdf.create(pdfHTML, options).toStream(function (err, stream) {
        if (err) {
            handleResponse.handleError(res, err, 'Server Error: Error in generating pdf data');
        }
        else{

            res.setHeader('Content-Type', 'application/force-download');
            res.setHeader('Content-disposition', 'attachment;filename=invoice.pdf');
            res.setHeader('content-type', 'application/pdf');

            stream.pipe(res);
        }
    });

}
exports.generatePdfFromHtml= (req, res) => {
    // console.log(req.params.invoiceId);
    invoiceHtmlData(req,res,false);
    /*let invoiceDetails=JSON.parse(req.query.invoiceDetails);
    let lineItems=JSON.parse(req.query.lineItems);*/

};

exports.generateHtml= (req, res) => {
    var html = fs.readFileSync('views/pages/invoice-pdf-template.html', 'utf8');
    pdf.create(html).toStream(function (err, stream) {
        if (err) {
            handleResponse.handleError(res, err, 'Server Error: Error in generating pdf data');
        }
        else{

            res.setHeader('Content-Type', 'application/force-download');
            res.setHeader('Content-disposition', 'attachment;filename=invoice.pdf');
            res.setHeader('content-type', 'application/pdf');

            stream.pipe(res);
        }
    });

};
