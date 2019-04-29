const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const timesheetController = require('./timesheet');
const jsonexport = require('jsonexport');
let companyDefaultTimezone;
/*handleError = (res, reason, message, code) => {
  // console.log("ERROR: " + reason);
  res.status(code || 500).json({"success":false,"message": message});
  res.end();
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
}
*/
function dateFormat(gDate) {
  return(gDate.split(' ')[0]);
}

// function dateFormat(gDate) {
//     var sDate = new Date(gDate);
//     var date = sDate.getDate();
//     var month = sDate.getMonth() + 1;
//     var year = sDate.getFullYear();
//     var formatedDate = '';
//     if (month != 10 && month != 11 && month != 12) {
//         if (date < 10) {
//             formatedDate = year + '-0' + month + '-0' + date;
//         } else {
//             formatedDate = year + '-0' + month + '-' + date;
//         }
//
//     } else {
//         if (date < 10) {
//             formatedDate = year + '-' + month + '-0' + date;
//         } else {
//             formatedDate = year + '-' + month + '-' + date;
//         }
//
//     }
//     // console.log(formatedDate);
//     return formatedDate;
// }

exports.generateExpenseCsv = (req, res) => {

  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;

         pool.connect((err, client, done) => {
             whereClause='WHERE company_id=$1 AND archived=$2 AND project_id IN (SELECT id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$3) AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2)';
             client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.total_amount ,e.record_id,e.submitted FROM EXPENSE e '+whereClause+' ORDER BY expense_date DESC,record_id ', [req.user.company_id, false,false], function(err, expense) {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in finding expense data');
             } else {
              //  console.log('---------expense.rows---------');
              //  console.log(expense.rows);
               done();
                  let expenseCSV = 'Expense Details : \n\n';
                   jsonexport(expense.rows,function(err, csv){
                       if(err) {
                         console.log('err');
                         console.log(err);
                         handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                       }
                      //  console.log(csv);
                       expenseCSV += csv+'\n\n\n\n';
                       res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'expense-' + Date.now() + '.csv\"');
                       res.writeHead(200, {
                         'Content-Type': 'text/csv'
                       });
                       res.end(expenseCSV);
                   });


             }
           });
         })
       }
     });

}


exports.getExpense = (req, res) => {
    let user_id = req.params.userId;
    setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res, 'pages/expenses-listing', {
            expenses: [],
            totalCount: 0,
            draftCount: 0,
            approvedCount: 0,
            expCatList:[],
            accounts: [],
            projects: [],
            user: req.user,
            error: err
        }, "error", " Error in finding company settings");
      }else{
        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
        pool.connect((err, client, done) => {
            whereClause='WHERE company_id=$1 AND archived=$2 AND project_id IN (SELECT id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$5) AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND user_id=$6';
            // console.log('queryToExec '+'SELECT e.*,(select count(*) from EXPENSE '+whereClause+') as totalCount,(select count(*) from EXPENSE '+whereClause+' AND status ilike $3) as draftCount,(select count(*) from EXPENSE '+whereClause+' AND status ilike $4) as approvedCount FROM EXPENSE e '+whereClause+' ORDER BY expense_date,record_id OFFSET 0 LIMIT ' + process.env.PAGE_RECORD_NO+' searchCrieteriaValue'+req.user.company_id, false, 'Draft', 'Approved',false, user_id);
            client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id,e.submitted ,(select count(*) from EXPENSE '+whereClause+') as totalCount,(select count(*) from EXPENSE '+whereClause+' AND status ilike $3) as draftCount,(select count(*) from EXPENSE '+whereClause+' AND status ilike $4) as approvedCount FROM EXPENSE e '+whereClause+' ORDER BY expense_date DESC,record_id OFFSET 0 LIMIT ' + process.env.PAGE_RECORD_NO, [req.user.company_id, false, 'Draft', 'Approved',false, user_id], function(err, expense) {
                if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.responseToPage(res, 'pages/expenses-listing', {
                        expenses: [],
                        totalCount: 0,
                        draftCount: 0,
                        approvedCount: 0,
                        expCatList:[],
                        accounts: [],
                        projects: [],
                        user: req.user,
                        error: err
                    }, "error", "Error in finding expense data");
                    /*handleResponse.handleError(res, err, ' Error in finding expense data');*/
                } else {
                    client.query('SELECT id,name,currency FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function(err, account) {
                        if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.responseToPage(res, 'pages/expenses-listing', {
                                expenses: [],
                                totalCount: 0,
                                draftCount: 0,
                                approvedCount: 0,
                                expCatList:[],
                                accounts: [],
                                projects: [],
                                user: req.user,
                                error: err
                            }, "error", " Error in finding account data");
                            /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                        } else {
                            // console.log("----------account.rows-------------");
                            // console.log(account.rows);
                            let accountIdArr = [];
                            if (account.rows.length > 0) {
                                accountIdArr = account.rows.map(function(ele) {
                                    return ele.id;
                                });
                            }
                            client.query('SELECT id,name,account_id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$3 AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$4)', [req.user.company_id, false, false,req.params.userId], function(err, project) {
                                if (err) {
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.responseToPage(res, 'pages/expenses-listing', {
                                        expenses: [],
                                        totalCount: 0,
                                        draftCount: 0,
                                        approvedCount: 0,
                                        expCatList:[],
                                        accounts: [],
                                        projects: [],
                                        user: req.user,
                                        error: err
                                    }, "error", " Error in finding project data");
                                    /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                                } else {
                                    client.query('SELECT expense_category FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, expCatList) {
                                    if (err) {
                                        console.error(err);
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.responseToPage(res, 'pages/expenses-listing', {
                                                expenses: [],
                                                totalCount: 0,
                                                draftCount: 0,
                                                approvedCount: 0,
                                                expCatList:[],
                                                accounts: [],
                                                projects: [],
                                                user: req.user,
                                                error: err
                                            }, "error", "Error in finding user role for the company");

                                    }
                                    else {
                                        client.query('SELECT email,id FROM USERS WHERE company_id=$1', [req.user.company_id], function (err, userEmailList) {
                                        if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.responseToPage(res, 'pages/expenses-listing', {
                                                expenses: [],
                                                totalCount: 0,
                                                draftCount: 0,
                                                approvedCount: 0,
                                                expCatList:[],
                                                accounts: [],
                                                projects: [],
                                                user: req.user,
                                                error: err
                                            }, "error", "Error in finding resources for the company");


                                        }
                                        else {
                                                let expCat=['Food'];
                                                if(expCatList.rows.length>0){
                                                    expCat=expCatList.rows[0].expense_category;
                                                }
                                                let projectIdArr = [];
                                                if (project.rows.length > 0) {
                                                    projectIdArr = project.rows.map(function(ele) {
                                                        return ele.id;
                                                    });
                                                }
                                                // console.log("----------project.rows-------------");
                                                // console.log(project.rows);
                                                // console.log("----------expense.rows-------------");
                                                // console.log(expense.rows);
                                                let expenseListArr = [];
                                                /*let draftExpense=[];
                                                let approvedExpense=[];*/
                                                let draftCount = 0,
                                                    approvedCount = 0,
                                                    totalCount = 0;
                                                if (expense.rows.length > 0) {
                                                    expense.rows.forEach(function(data) {
                                                        if (accountIdArr.includes(data.account_id)) {
                                                            if (projectIdArr.includes(data.project_id)) {
                                                                // data["created_date"] = dateFormat(moment.tz(data.expense_date, companyDefaultTimezone).format());
                                                                // data["modified_date"] = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                                                                // data["expense_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                                                                data["created_date"] = dateFormat(data.created_date);
                                                                data["modified_date"] = dateFormat(data.modified_date);
                                                                data["expense_date"] = dateFormat(data.expense_date);
                                                                if (project.rows.length > 0) {
                                                                    project.rows.forEach(function(project) {
                                                                        if (project.id == data.project_id) {
                                                                            data["project_name"] = project.name;
                                                                        }
                                                                    })
                                                                }
                                                                if (account.rows.length > 0) {
                                                                    account.rows.forEach(function(account) {
                                                                        if (account.id == data.account_id) {
                                                                            data["account_name"] = account.name;
                                                                        }
                                                                    })
                                                                }
                                                                let createdUserEmail=userEmailList.rows.filter(user=>{
                                                                        return user.id==data.user_id;
                                                                })
                                                                data.createdBy=createdUserEmail[0].email;
                                                                expenseListArr.push(data);
                                                            }
                                                        }
                                                    })

                                                    totalCount = expense.rows[0].totalcount;
                                                    approvedCount = expense.rows[0].approvedcount;
                                                    draftCount = expense.rows[0].draftcount;
                                                }

                                                /*draftExpense=expenseListArr.filter(exp => exp.status=="Draft");
                                                approvedExpense=expenseListArr.filter(exp => exp.status=="Approved");*/
                                                // console.log(expense.rows);
                                                // console.log('----------expenseListArr---------');
                                                // console.log(expenseListArr);
                                                if(req.user.permissions.includes('expenseApprover')) {
                                                    // console.log("Inside IF Expense");
                                                    timesheetController.getAllCompanyUsers(req, client, err, done, res, function (usersList) {
                                                        // console.log("User List");
                                                        // console.log(usersList);
                                                        done();
                                                        handleResponse.responseToPage(res, 'pages/expenses-listing', {
                                                            expenses: expenseListArr,
                                                            totalCount: totalCount,
                                                            draftCount: draftCount,
                                                            approvedCount: approvedCount,
                                                            expCatList:expCat,
                                                            accounts: account.rows,
                                                            projects: project.rows,
                                                            user: req.user,
                                                            usersList:usersList,
                                                            companyDefaultTimezone:companyDefaultTimezone,
                                                            currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD'),
                                                            stripeCustomerId:result.stripe_customer_id
                                                        }, "success", "Successfully rendered");
                                                    });
                                                } else {
                                                    // console.log("Inside ELSE Expense");
                                                    done();
                                                    handleResponse.responseToPage(res, 'pages/expenses-listing', {
                                                        expenses: expenseListArr,
                                                        totalCount: totalCount,
                                                        draftCount: draftCount,
                                                        approvedCount: approvedCount,
                                                        expCatList:expCat,
                                                        accounts: account.rows,
                                                        projects: project.rows,
                                                        user: req.user,
                                                        usersList:[],
                                                        companyDefaultTimezone:companyDefaultTimezone,
                                                        currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD'),
                                                        stripeCustomerId:result.stripe_customer_id
                                                    }, "success", "Successfully rendered");
                                                }
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
        })
      }
    });
};

exports.getExpenseDetail = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
    if(err==true){
      // console.log('error in setting');
      // console.log(err);
      handleResponse.responseToPage(res, 'pages/expense-details', {
          expense: {},
          accounts: [],
          projects: [],
          expCatList:[],
          user: req.user,
          error: err
      }, "error", " Error in finding company settings");

    }else{
      companyDefaultTimezone=result.timezone;
        // console.log('getExpenseDetail-------------' + req.query.expenseId);
        let expenseId = req.query.expenseId;
        if (expenseId == '' || expenseId == null || expenseId == undefined) {
            handleResponse.responseToPage(res, 'pages/expense-details', {
                expense: {},
                accounts: [],
                projects: [],
                expCatList:[],
                user: req.user,
                error: err
            }, "error", "  Expense id is not correct");
            /*handleResponse.handleError(res, 'incorrect expense id', ' Expense id is not correct');*/
        } else {
            pool.connect((err, client, done) => {
                client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id,e.submitted,e.content_type,e.document,e.doc_file_name FROM EXPENSE e where id=$1 AND company_id=$2', [req.query.expenseId, req.user.company_id], function(err, expense) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.responseToPage(res, 'pages/expense-details', {
                            expense: {},
                            accounts: [],
                            projects: [],
                            expCatList:[],
                            user: req.user,
                            error: err
                        }, "error", " Error in finding expense data");
                        /*handleResponse.handleError(res, err, ' Error in finding expense data');*/
                    } else {
                        console.error('getExpense>>>>>>>>>>>>>');
                        // console.log(expense.rows[0]);
                        client.query('SELECT id,name,currency FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function(err, account) {
                            if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.responseToPage(res, 'pages/expense-details', {
                                    expense: {},
                                    accounts: [],
                                    projects: [],
                                    expCatList:[],
                                    user: req.user,
                                    error: err
                                }, "error", " Error in finding account data");
                                /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                            } else {
                                // console.log("----------account.rows-------------");
                                // console.log(account.rows);
                                client.query('SELECT id,name,account_id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$3 AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$4)', [req.user.company_id, false, false,expense.rows[0].user_id], function(err, project) {
                                    if (err) {
                                        console.log('expense user id is');
                                        console.log(expense.rows[0].user_id);
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.responseToPage(res, 'pages/expense-details', {
                                            expense: {},
                                            accounts: [],
                                            projects: [],
                                            expCatList:[],
                                            user: req.user,
                                            error: err
                                        }, "error", " Error in finding project data");
                                        /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                                    } else {
                                        client.query('SELECT expense_category FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, expCatList) {
                                        if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.responseToPage(res, 'pages/expense-details', {
                                                    expense: {},
                                                    accounts: [],
                                                    projects: [],
                                                    expCatList:[],
                                                    user: req.user,
                                                    error: err
                                                }, "error", "  Error in finding expense category for the company");

                                        }
                                        else {
                                                let expCat=['Food'];
                                                if(expCatList.rows.length>0){
                                                    expCat=expCatList.rows[0].expense_category;
                                                }
                                                // console.log("----------project.rows-------------");
                                                // console.log(project.rows);
                                                if (expense.rows.length > 0) {
                                                    /*let created_date = dateFormat(expense.rows[0].created_date);
                                                    let modified_date = dateFormat(expense.rows[0].modified_date);
                                                    let expense_date = dateFormat(expense.rows[0].expense_date);*/
                                                    // created_date = dateFormat(moment.tz(expense.rows[0].expense_date, companyDefaultTimezone).format());
                                                    // modified_date = dateFormat(moment.tz(expense.rows[0].created_date, companyDefaultTimezone).format());
                                                    // expense_date = dateFormat(moment.tz(expense.rows[0].modified_date, companyDefaultTimezone).format());
                                                    created_date = dateFormat(expense.rows[0].created_date);
                                                    modified_date = dateFormat(expense.rows[0].modified_date);
                                                    expense_date = dateFormat(expense.rows[0].expense_date);
                                                    expense.rows[0]["created_date"] = created_date;
                                                    expense.rows[0]["modified_date"] = modified_date;
                                                    expense.rows[0]["expense_date"] = expense_date;
                                                }
                                                console.log('expense');
                                                console.log(expense.rows[0]);
                                                done();
                                                handleResponse.responseToPage(res, 'pages/expense-details', {
                                                    expense: expense.rows[0],
                                                    accounts: account.rows,
                                                    projects: project.rows,
                                                    expCatList:expCat,
                                                    user: req.user,
                                                    companyDefaultTimezone:companyDefaultTimezone,
                                                    currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD'),
                                                    stripeCustomerId:result.stripe_customer_id
                                                }, "success", "Successfully rendered");
                                             }
                                        });
                                    }
                                });
                            }
                        });
                    }
                })
            });
        }
    }
  });
};

exports.submitExpense = (req, res) => {

  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if(err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in connecting to the database');
      } else {
          client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id FROM EXPENSE e where id=$1 AND company_id=$2', [req.body.expenseId, req.user.company_id], function(err, expense) {
              if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding expense data');
              } else {
                  client.query('UPDATE EXPENSE SET submitted=$1 WHERE id=$2', [true,req.body.expenseId], function(err, updatedData) {
                      if (err) {
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in submitting expense data');
                      } else {
                        client.query('COMMIT', (err) => {
                          if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in committing transaction');
                          } else {
                              done();
                              handleResponse.sendSuccess(res, 'Expense submitted successfully', {});
                          }
                        })
                      }
                  });
              }
          })
        }
      })
  });

};


exports.postEditExpense = (req, res) => {
    if (req.user) {
        // console.log('inside postEditExpense');
        // console.log(req.body);
        req.assert('amount', 'Expense amount cannot be blank').notEmpty();
        req.assert('account_id', 'Expense account cannot be blank').notEmpty();
        req.assert('project_id', 'Expense project cannot be blank').notEmpty();
        const errors = req.validationErrors();

        if (errors) {

            if (errors.length > 0) {
                // console.log(errors[0].msg);
                handleResponse.handleError(res, errors, "" + errors[0].msg);
            } else {
                handleResponse.handleError(res, errors, " Error in validating data.");
            }

        } else {
            // console.log(req.body.expenseId);
            // console.log(req.user.company_id);
            // let modified_date = moment.tz(new Date(), companyDefaultTimezone).format();
            // console.log('modified_date  ' + modified_date);
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if(err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in connecting to the database');
                } else {
                    client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id FROM EXPENSE e where id=$1 AND company_id=$2', [req.body.expenseId, req.user.company_id], function(err, expense) {
                        if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in finding expense data');
                        } else {
                            // console.log('getExpense>>>>>>>>>>>>>');
                            // console.log(expense.rows[0]);
                            let total_expense_amount = parseFloat(req.body.tax_no) + parseFloat(req.body.amount);
                            client.query('UPDATE EXPENSE SET tax=$1,tax_amount=$2,note=$3, category =$4,amount=$5,billable=$6,modified_date=$7,expense_date=$8,project_id=$9,account_id=$10,currency=$11,total_amount=$12 WHERE id=$13 AND company_id=$14', [req.body.tax, req.body.tax_no, req.body.note, req.body.category, req.body.amount, req.body.billable,'now()', moment.tz(req.body.expense_date.split('T')[0], companyDefaultTimezone).format(), req.body.project_id, req.body.account_id, req.body.currency,total_expense_amount, req.body.expenseId, req.user.company_id], function(err, updatedData) {
                                // console.log('Error >>>>>>>>>>>>>');
                                // console.log(err);
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in updating expense data');
                                } else {
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                      done();
                                      // console.log('Updated expense >>>>>>>>>>>>>');
                                      // console.log(updatedData);
                                      handleResponse.sendSuccess(res, 'Expense updated successfully', {});
                                      /*res.status(200).json({ "success": true ,"message":"success"});*/
                                    }
                                  })
                                }
                            });
                        }
                    })
                  }
                })
            });
        }
    } else {
        done();
        res.redirect('/domain');
    }
};


exports.postAddExpense = (req, res) => {
    if (req.user) {
        // console.log("Inside add expense post method");
        // console.log(req.body);
        req.assert('amount', 'Expense amount cannot be blank').notEmpty();
        req.assert('account_id', 'Expense account cannot be blank').notEmpty();
        req.assert('project_id', 'Expense project cannot be blank').notEmpty();
        const errors = req.validationErrors();

        if (errors) {
            if (errors.length > 0) {
                // console.log(errors[0].msg);
                handleResponse.handleError(res, errors, "" + errors[0].msg);
            } else {
                handleResponse.handleError(res, errors, " Error in validating data.");
            }
        } else {
            /*var createdDate = new Date(Date.now());*/
            // let createdDate = moment.tz(new Date(), companyDefaultTimezone).format();
            // console.log('createdDate ' + createdDate);
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if(err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in connecting to the database');
                } else {
                    let total_expense_amount = parseFloat(req.body.tax_no) + parseFloat(req.body.amount);
                    client.query('Insert INTO EXPENSE (tax,tax_amount,note,status,category,amount,billable,created_date,modified_date,expense_date,project_id,account_id,company_id,currency,user_id, total_amount) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id', [ req.body.tax, req.body.tax_no, req.body.note, "Draft", req.body.category, req.body.amount, req.body.billable, 'now()', 'now()', moment.tz(req.body.expense_date.split('T')[0], companyDefaultTimezone).format(), req.body.project_id, req.body.account_id, req.user.company_id, req.body.currency, req.user.id, total_expense_amount], function(err, insertedExpense) {
                        if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in adding expense data to the database');
                            /*// console.log(err);*/
                        } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
                              // console.log('insertedExpense' + JSON.stringify(insertedExpense));
                              done();
                              handleResponse.sendSuccess(res, 'Expense added successfully', {
                                  "expense": insertedExpense.rows[0]
                              });
                              /*res.status(200).json({ "success": true, "expense": insertedExpense.rows[0] ,"message":"success"});*/
                            }
                          })
                        }
                    });
                  }
                })
            });
        }
    } else {
        done();
        res.redirect('/domain');
    }



};
function deleteExpenseNotInvoiced(req,res,client,done){
    client.query('UPDATE EXPENSE SET archived = $1 WHERE id=$2', [true, req.body.expenseId], function(err, archivedExpense) {
        if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in deleting expense.');
        } else {
          client.query('COMMIT', (err) => {
            if (err) {
              // console.log('Error committing transaction', err.stack)
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in committing transaction');
            } else {
                console.error('Affected ID>>>>>>>>>>>>>');
                // console.log(archivedExpense.rows[0]);
                done();
                handleResponse.sendSuccess(res, 'Expense deleted successfully', {});
            }
          })
        }
    })
}

exports.deleteExpense = (req, res) => {

    // console.log('Archived Expense-------------' + req.body.expenseId);
    let expenseId = req.body.expenseId;
    if (expenseId == '' || expenseId == null || expenseId == undefined) {
        handleResponse.handleError(res, 'incorrect expense id', ' Expense id is not correct');
    } else {
        pool.connect((err, client, done) => {
          client.query('BEGIN', (err) => {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in connecting to database.');
            } else {
                client.query('SELECT * FROM EXPENSE WHERE id=$1', [req.body.expenseId], function(err, expenseDetail) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in getting expense detail.');
                    } else {
                        // console.log('expenseDetail.rows '+expenseDetail.rows.length);
                        if(expenseDetail.rows.length>0){
                            // console.log('expenseDetail.rows[0]');
                            // console.log(expenseDetail.rows[0]);
                            if(expenseDetail.rows[0].invoiced==true&&expenseDetail.rows[0].invoice_id!=null){
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, 'This expense is invoiced, therefore cannot be deleted');
                            }else{
                                // console.log('Inside not invoiced');
                                deleteExpenseNotInvoiced(req,res,client,done);
                            }
                        }else{
                            // console.log('Inside no expense');
                            deleteExpenseNotInvoiced(req,res,client,done);
                        }
                    }
                })
              }
            })
        });
    }

}

exports.findExpenseByCriteria = (req, res) => {
    let user_id = req.body.user_id;
    // console.log("findExpenseByCriteria----------------------------------" + req.body.searchField);

    pool.connect((err, client, done) => {
        let searchCriteriaVal = [req.user.company_id, user_id];
        let whereClause = 'WHERE company_id=$1 AND user_id=$2';

        if (req.body.searchField.length > 0) {
            let searchField = req.body.searchField;
            searchField.forEach((search, index) => {
                whereClause += 'AND ' + search.fieldName + ' $' + (index + 3) + ' ';
                searchCriteriaVal.push(search.fieldValue);
            });
            /*let queryToExec='SELECT * FROM account WHERE '+req.body.searchField+' like $1 AND company_id=$2';*/
        }
        let offset = 0;
        if (req.body.offset) {
            offset = req.body.offset;
        }
        whereClause+='AND project_id IN (SELECT id FROM PROJECT WHERE company_id=$1 AND archived=$'+(searchCriteriaVal.length+1)+' AND isGlobal=$'+(searchCriteriaVal.length+2)+') AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$'+(searchCriteriaVal.length+1)+')'
        searchCriteriaVal.push(false);
        searchCriteriaVal.push(false);
        let queryToExec = 'SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id,(select count(*) from EXPENSE ' + whereClause + ') as searchCount FROM EXPENSE e ' + whereClause + ' ORDER BY expense_date DESC,record_id OFFSET ' + offset + ' LIMIT ' + process.env.PAGE_RECORD_NO;
        // console.log('queryToExec ' + queryToExec + ' ' + searchCriteriaVal);
        client.query(queryToExec, searchCriteriaVal, function(err, expense) {
            if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding expense data');
            } else {
                client.query('SELECT id,name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function(err, account) {
                    if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding account data');
                        /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                    } else {
                        // console.log("----------account.rows-------------");
                        // console.log(account.rows);
                        let accountIdArr = [];
                        if (account.rows.length > 0) {
                            accountIdArr = account.rows.map(function(ele) {
                                return ele.id;
                            });
                        }
                        client.query('SELECT id,name,account_id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$3 AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$4)', [req.user.company_id, false,false,req.params.userId], function(err, project) {
                            if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in finding project data');
                            } else {
                                client.query('SELECT email,id FROM USERS WHERE company_id=$1', [req.user.company_id], function (err, userEmailList) {
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.responseToPage(res,'pages/resources-listing',{user:req.user, error:err},"error"," Error in finding user role for the company");
                                }
                                else {
                                        let projectIdArr = [];
                                        if (project.rows.length > 0) {
                                            projectIdArr = project.rows.map(function(ele) {
                                                return ele.id;
                                            });
                                        }
                                        // console.log("----------project.rows-------------");
                                        // console.log(project.rows);
                                        // console.log("----------expense.rows-------------");
                                        let expenseListArr = [];
                                        let searchCount = 0;
                                        if (expense.rows.length > 0) {
                                            expense.rows.forEach(function(data) {
                                                if (accountIdArr.includes(data.account_id)) {
                                                    if (projectIdArr.includes(data.project_id)) {
                                                        // data["created_date"] = dateFormat(moment.tz(data.expense_date, companyDefaultTimezone).format());
                                                        // data["modified_date"] = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                                                        // data["expense_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                                                        data["created_date"] = dateFormat(data.created_date);
                                                        data["modified_date"] = dateFormat(data.modified_date);
                                                        data["expense_date"] = dateFormat(data.expense_date);
                                                        if (project.rows.length > 0) {
                                                            project.rows.forEach(function(project) {
                                                                if (project.id == data.project_id) {
                                                                    data["project_name"] = project.name;
                                                                }
                                                            })
                                                        }
                                                        if (account.rows.length > 0) {
                                                            account.rows.forEach(function(account) {
                                                                if (account.id == data.account_id) {
                                                                    data["account_name"] = account.name;
                                                                }
                                                            })
                                                        }
                                                        let createdUserEmail=userEmailList.rows.filter(user=>{
                                                                return user.id==data.user_id;
                                                        })
                                                        data.createdBy=createdUserEmail[0].email;
                                                        expenseListArr.push(data);
                                                    }
                                                }
                                            })
                                            searchCount = expense.rows[0].searchcount;
                                        }
                                        // console.log('----------------------expenseList-----------------');
                                        // console.log(expenseListArr);
                                        done();
                                        handleResponse.sendSuccess(res, 'Expenses searched successfully', {
                                            expenses: expenseListArr,
                                            count: searchCount
                                        });
                                     }
                                });
                            }
                        });
                    }
                });
            }
        });

    })
};
function createAccountArray(accounts,accountIdArr,cb){
    // console.log('accountIdArr '+accountIdArr);
    // console.log('account '+accounts.length);
    for(let i=0;i<accounts.length;i++){
        // console.log('Inside loop');
        accountIdArr += accounts[i].id;
        if(accounts.length!=(i+1)){
            accountIdArr += ',';
        }
        if(accounts.length==(i+1)){
            return cb(accountIdArr);
        }
    }
}

exports.expenseDocUpload = (req,res) => {
    console.log('req.body');
    console.log(req.body);
    console.log('req.files');
    console.log(req.files.expenseDocument);
    if (!req.files||req.files.expenseDocument==null||req.files.expenseDocument==undefined){
      return res.status(500).redirect('/expense-details?expenseId='+req.body.expenseId);
    }else{
      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in connecting to database.');
          } else {
            client.query('UPDATE EXPENSE set content_type=$1,document=$2,doc_file_name=$3 where id=$4 RETURNING *',[req.files.expenseDocument.mimetype,req.files.expenseDocument.data,req.files.expenseDocument.name,req.body.expenseId], function(err, updatedExpense) {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  return res.status(500).redirect('/expense-details?expenseId='+req.body.expenseId);
                } else {
                  client.query('COMMIT', (err) => {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in committing transaction');
                    } else {
                      done();
                      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                      res.header('Expires', '-1');
                      res.header('Pragma', 'no-cache');
                      return res.status(200).redirect('/expense-details?expenseId='+req.body.expenseId);
                    }
                  })
                }
            });
          }
        })
      });
    }
}

exports.deleteExpenseDoc = (req,res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in connecting to database.');
      } else {
        client.query('UPDATE EXPENSE set content_type=$1,document=$2,doc_file_name=$3 where id=$4 RETURNING *',[null,null,null,req.body.expenseId], function(err, updatedExpense) {
            if (err){
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in deleting expense document');
            } else {
              client.query('COMMIT', (err) => {
                if (err) {
                  // console.log('Error committing transaction', err.stack)
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in committing transaction');
                } else {
                  done();
                  handleResponse.sendSuccess(res, 'Expense document deleted successfully', {});
                }
              })
            }
        });
      }
    })
  });
}

exports.downloadExpenseDoc = (req,res) => {
  console.log(req.query.expenseId);
  pool.connect((err, client, done) => {
      client.query("SELECT document,content_type,doc_file_name FROM EXPENSE WHERE id=$1", [req.query.expenseId], function (err, expenseDocument) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.responseToPage(res,'/expense-details?expenseId='+req.body.expenseId,{setting:{},user:req.user, error:err},"error","  Error in finding expense document data");
        } else {
            done();
            if(expenseDocument.rows[0].document!=null){
              console.log('expense data');
              console.log(expenseDocument.rows[0].content_type);
              console.log(expenseDocument.rows[0].document.length);
              console.log(expenseDocument.rows[0].document);
              // let document = new Buffer(companySetting.rows[0].company_logo, 'base64');
              res.setHeader('Content-Disposition', 'attachment; filename=\"' + expenseDocument.rows[0].doc_file_name+ '\"');
              res.writeHead(200, {
                 'Content-Type': expenseDocument.rows[0].content_type,
                 'Content-Length': expenseDocument.rows[0].document.length
               });
               res.end(expenseDocument.rows[0].document);

            }
            else{
              done();
              handleResponse.responseToPage(res,'/expense-details?expenseId='+req.body.expenseId,{setting:{},user:req.user, error:"Error in finding expense document data"},"error","  Error in finding expense document data");
            }
        }
      });
    })
}

exports.findExpenseForAccount = (req, res) => {
    // console.log("findExpenseForAccount----------------------------------" + req.body.searchText);
    pool.connect((err, client, done) => {
        let offset = 0;
        if (req.body.offset) {
            offset = req.body.offset;
        }
        if (req.body.searchText != '') {
            let queryToExec = 'SELECT id,name FROM account WHERE name ilike $1 AND company_id=$2 AND archived=$3';
            // console.log('queryToExec ' + queryToExec+' '+ '%'+req.body.searchText + '%' + req.user.company_id + false);
            client.query(queryToExec, ['%'+req.body.searchText + '%', req.user.company_id, false], function(err, accounts) {
                if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding account data');
                } else {
                    if (accounts.rows.length > 0) {
                        console.log('account details are');
                        console.log(JSON.stringify(accounts.rows));
                        console.log('req.body.user_id '+req.body.user_id);
                        let expenseListForSearch = [];
                        let searchCount = parseInt(0);
                        // accounts.rows.forEach(function(account, index) {
                            // let accountId = account.id;


                            let accountId=accounts.rows.map(acc => acc.id);
                            // let accountIdArr = '(';
                            // // console.log('calling function');
                            // createAccountArray(accounts.rows,accountIdArr,accountId=>{
                                // accountId += ')';
                                // console.log('-----------accountId------');
                                // console.log(accountId);
                                // let accountName = account.name;
                                client.query('SELECT id,name,account_id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND account_id = ANY($3::bigint[]) AND isGlobal=$4 AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$5)', [req.user.company_id, false, accountId,false,req.body.user_id], function(err, project) {
                                  if (err) {
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in finding project for account');
                                    /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                                  } else {
                                    let projectIdArr = [];
                                    if (project.rows.length > 0) {
                                      projectIdArr = project.rows.map(function(ele) {
                                        return ele.id;
                                      });
                                    }
                                    // console.log(offset);
                                    whereClause =' WHERE account_id = ANY($1::bigint[]) AND company_id=$2 AND archived=$3 AND project_id IN (SELECT id FROM PROJECT WHERE account_id = ANY($1::bigint[]) AND company_id=$2 AND archived=$3 AND isGlobal=$4) AND user_id=$5'
                                    queryToExec = 'SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id,(select count(*) from EXPENSE '+whereClause+') as searchCount FROM EXPENSE e '+whereClause+' ORDER BY expense_date DESC,record_id OFFSET ' + offset + ' LIMIT ' + process.env.PAGE_RECORD_NO;
                                    let searchFieldVal = [accountId, req.user.company_id, false,false, req.body.user_id];

                                    if (req.body.status) {
                                      queryToExec += ' AND status=$6';
                                      searchFieldVal.push(req.body.status);
                                    }
                                    // console.log(queryToExec+' '+searchFieldVal)
                                    client.query(queryToExec, searchFieldVal, function(err, expenses) {
                                      if (err) {
                                        handleResponse.shouldAbort(err, client, done);
                                        /*handleResponse.responseToPage(res,'pages/org-listing',{user:req.user, error:err},"error"," Error in finding company data");*/
                                        handleResponse.handleError(res, err, ' Error in finding expense for account');
                                      } else {
                                        client.query('SELECT email,id FROM USERS WHERE company_id=$1', [req.user.company_id], function (err, userEmailList) {
                                          if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.responseToPage(res,'pages/resources-listing',{user:req.user, error:err},"error"," Error in finding user role for the company");
                                          }
                                          else {
                                            // console.log('expenselist var before insertion')
                                            // console.log(expenseListForSearch);

                                            if (expenses.rows.length > 0) {
                                              expenses.rows.forEach(function(data,index) {
                                                if (projectIdArr.includes(data.project_id)) {
                                                  // data["created_date"] = dateFormat(moment.tz(data.expense_date, companyDefaultTimezone).format());
                                                  // data["modified_date"] = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                                                  // data["expense_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                                                  data["created_date"] = dateFormat(data.created_date);
                                                  data["modified_date"] = dateFormat(data.modified_date);
                                                  data["expense_date"] = dateFormat(data.expense_date);
                                                  accounts.rows.forEach(function(account) {
                                                      if (account.id == data.account_id) {
                                                          data["account_name"] = account.name;
                                                      }
                                                  })
                                                  // console.log(data["account_name"]);
                                                  if (project.rows.length > 0) {
                                                    project.rows.forEach(function(project) {
                                                      if (project.id == data.project_id) {
                                                        data["project_name"] = project.name;
                                                      }
                                                    })
                                                  }
                                                  let createdUserEmail=userEmailList.rows.filter(user=>{
                                                    return user.id==data.user_id;
                                                  })
                                                  data.createdBy=createdUserEmail[0].email;
                                                  expenseListForSearch.push(data);
                                                }
                                                if(expenses.rows.length == (index+1)){
                                                  searchCount = expenses.rows[0].searchcount;
                                                  // console.log('----------------------expenseListForSearch-----------------');
                                                  // console.log(expenseListForSearch);

                                                  done();
                                                  handleResponse.sendSuccess(res, 'Expenses searched successfully', {
                                                    expenses: expenseListForSearch,
                                                    count: searchCount
                                                  });
                                                }
                                              })
                                            }
                                            // // console.log('----------------------expenses.rows-----------------');
                                            // // console.log(expenses.rows);
                                            // if (index == (accounts.rows.length - 1)) {

                                            // }
                                          }
                                        });
                                      }
                                    });
                                  }
                                });
                            // })
                        // });
                    } else {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Cannot find account with this name');
                    }
                }
            });
        } else {
            whereClause='WHERE company_id=$1 AND archived=$2 AND project_id IN (SELECT id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$3) AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND user_id=$4'
            let innerQuery = 'select count(*) from EXPENSE '+whereClause;
            let queryToExec ='';
            let searchFieldVal = [req.user.company_id, false,false, req.body.user_id];
            if (req.body.status) {
                innerQuery += ' AND status=$5';
                queryToExec = 'SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id,(' + innerQuery + ') as searchCount FROM EXPENSE e '+whereClause+'AND status=$5';
                searchFieldVal.push(req.body.status);
            } else {
                queryToExec = 'SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.company_id ,e.account_id ,e.project_id ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.invoice_id ,e.total_amount ,e.user_id ,e.record_id,(' + innerQuery + ') as searchCount FROM EXPENSE e '+whereClause;
            }
            queryToExec += ' ORDER BY expense_date DESC,record_id OFFSET ' + offset + ' LIMIT ' + process.env.PAGE_RECORD_NO;
            // console.log(queryToExec);
            client.query(queryToExec, searchFieldVal, function(err, expense) {
                if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding expense data');
                    /*handleResponse.handleError(res, err, ' Error in finding expense data');*/
                } else {
                    client.query('SELECT id,name FROM ACCOUNT WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function(err, account) {
                        if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in finding account data');
                            /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                        } else {

                            // console.log("----------account.rows-------------");
                            // console.log(account.rows);
                            let accountIdArr = [];
                            if (account.rows.length > 0) {
                                accountIdArr = account.rows.map(function(ele) {
                                    return ele.id;
                                });
                            }
                            client.query('SELECT id,name,account_id FROM PROJECT WHERE company_id=$1 AND archived=$2 AND isGlobal=$3 AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$4)', [req.user.company_id, false,false,req.body.user_id], function(err, project) {
                                if (err) {
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in finding project data');
                                } else {
                                    client.query('SELECT email,id FROM USERS WHERE company_id=$1', [req.user.company_id], function (err, userEmailList) {
                                    if (err) {
                                        console.error(err);
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.responseToPage(res,'pages/resources-listing',{user:req.user, error:err},"error"," Error in finding user role for the company");
                                    }
                                    else {
                                            // console.log("----------project.rows-------------");
                                            // console.log(project.rows);
                                            // console.log("----------expense.rows-------------");
                                            // console.log(expense.rows);
                                            let projectIdArr = [];
                                            if (project.rows.length > 0) {
                                                projectIdArr = project.rows.map(function(ele) {
                                                    return ele.id;
                                                });
                                            }
                                            let expenseListArr = [];
                                            let searchCount = 0;
                                            if (expense.rows.length > 0) {
                                                expense.rows.forEach(function(data) {
                                                    if (accountIdArr.includes(data.account_id)) {
                                                        if (projectIdArr.includes(data.project_id)) {
                                                            // data["created_date"] = dateFormat(moment.tz(data.expense_date, companyDefaultTimezone).format());
                                                            // data["modified_date"] = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                                                            // data["expense_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                                                            data["created_date"] = dateFormat(data.created_date);
                                                            data["modified_date"] = dateFormat(data.modified_date);
                                                            data["expense_date"] = dateFormat(data.expense_date);
                                                            if (project.rows.length > 0) {
                                                                project.rows.forEach(function(project) {
                                                                    if (project.id == data.project_id) {
                                                                        data["project_name"] = project.name;
                                                                    }
                                                                })
                                                            }
                                                            if (account.rows.length > 0) {
                                                                account.rows.forEach(function(account) {
                                                                    if (account.id == data.account_id) {
                                                                        data["account_name"] = account.name;
                                                                    }
                                                                })
                                                            }
                                                            let createdUserEmail=userEmailList.rows.filter(user=>{
                                                                    return user.id==data.user_id;
                                                            })
                                                            data.createdBy=createdUserEmail[0].email;
                                                            expenseListArr.push(data);
                                                        }
                                                    }
                                                })
                                                searchCount = expense.rows[0].searchcount;
                                            }
                                            // console.log(expenseListArr);
                                            done();
                                            handleResponse.sendSuccess(res, 'Expenses searched successfully', {
                                                expenses: expenseListArr,
                                                count: searchCount
                                            });
                                        }

                                    });

                                }

                            });
                        }

                    });
                }

            });
        }
    })
};
