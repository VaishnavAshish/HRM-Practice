const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
let companyDefaultTimezone;
/*handleError=(res, reason, message, code) =>{
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
//
//
// function dateFormat(gDate) {
//   var sDate = new Date(gDate);
//   var date = sDate.getDate();
//   var month = sDate.getMonth() + 1;
//   var year = sDate.getFullYear();
//   var formatedDate = '';
//   if (month < 10) {
//     if(date<10){
//       formatedDate = year + '-0' + month + '-0' + date;
//     }else{
//       formatedDate = year + '-0' + month + '-' + date;
//     }
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


/*exports.findAccountByName = (req, res) => {
  // console.log("findAccountByName----------------------------------"+req.body.searchText);
  pool.connect((err, client, done) => {
      let queryToExec='SELECT * FROM account WHERE '+req.body.searchField+' like $1 AND company_id=$2 AND archived=false';
      // console.log('queryToExec '+queryToExec);
      client.query(queryToExec,[req.body.searchText+'%',req.user.company_id], function (err, accounts) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding account data');
        }
        else{
            // console.log(JSON.stringify(accounts.rows));
            if (accounts.rows.length > 0) {
              accounts.rows.forEach(function (data) {
                let created_date = dateFormat(data.created_date);
                let modified_date = dateFormat(data.modified_date);
                data["created_date"] = created_date;
                data["modified_date"] = modified_date;
              })
            }
            done();
            handleResponse.sendSuccess(res,'Accounts searched successfully',{accounts: accounts.rows});
        }
      });
    })
};*/

exports.findAccountByCriteria = (req, res) => {
  // console.log("findAccountByCriteria----------------------------------"+req.body.searchField);
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
      let offset=0;
      if(req.body.offset){
        offset=req.body.offset;
      }
      let queryToExec='SELECT a.*,(select count(*) from ACCOUNT '+whereClause+') as searchCount FROM ACCOUNT a '+whereClause+' ORDER BY id Desc OFFSET '+offset+'LIMIT '+process.env.PAGE_RECORD_NO;
      // console.log('queryToExec '+queryToExec);
      client.query(queryToExec,searchCriteriaVal, function (err, accounts) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding account data');
        }
        else{
            let searchCount=0;
            // console.log(JSON.stringify(accounts.rows));
            if (accounts.rows.length > 0) {
              accounts.rows.forEach(function (data) {
                let created_date = moment.tz(data.created_date, companyDefaultTimezone).format('MM-DD-YYYY');
                let modified_date = moment.tz(data.modified_date, companyDefaultTimezone).format('MM-DD-YYYY');
                data["created_date"] = created_date;
                data["modified_date"] = modified_date;
              })
              searchCount=accounts.rows[0].searchcount;
            }
            done();
            handleResponse.sendSuccess(res,'Accounts searched successfully',{accounts: accounts.rows,count:searchCount});
        }
      });

    })
};

getAccountQuery = (req,client,next) =>{
    client.query('SELECT a.id ,a.name ,a.first_name ,a.last_name ,a.email ,a.archived ,a.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,a.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,a.company_id ,a.street ,a.city ,a.state ,a.country ,a.zip_code ,a.record_id ,a.currency ,(select count(*) from ACCOUNT where company_id=$1) as totalCount,(select count(*) from ACCOUNT where company_id=$1 AND archived=$2) as activeCount FROM ACCOUNT a WHERE company_id=$1 ORDER BY id DESC OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO,[req.user.company_id,false], function(err, account) {
        if (err) {
            next(err,null);
        }else{
            next(null,account);
        }
    });
}

exports.getAccount = (req, res) => {
  /*let archived=false;*/
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/accounts-listing',{accounts:[], totalCount:0,activeCount:0, archivedCount:0 ,user:req.user,error:err},"error"," error in finding company setting");
        /*handleResponse.handleError(res, err, ' error in finding company setting');*/
      }else{

        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
          pool.connect((err, client,done) => {
            getAccountQuery(req,client,(err,account) => {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.responseToPage(res,'pages/accounts-listing',{accounts:[], totalCount:0,activeCount:0, archivedCount:0 ,user:req.user,error:err},"error","Error in finding account.Please Restart.");
              } else {

                    /*// console.log('sub 8 days '+adjustDays(8));
                    // console.log('sub 1 days '+adjustDays(1));
                    // console.log('sub 8 days with moment'+moment.tz(adjustDays(8), companyDefaultTimezone).format());
                    // console.log('sub 1 days with moment'+moment.tz(adjustDays(1), companyDefaultTimezone).format());*/
                    // console.log("----------account.rows-------------");
                    // console.log(account.rows);

                    let accList=account.rows;
                    let totalCount=0,activeCount=0;
                    if(account.rows.length>0){

                      accList.forEach(function (data) {
                        // console.log(data.created_date + ' '+ dateFormat(data.created_date))
                        // console.log(data.modified_date + ' '+ dateFormat(data.modified_date))
                        // console.log('dates according to timezone are');
                        // console.log(moment.tz(data.created_date, companyDefaultTimezone).format());
                        // console.log(moment.tz(data.modified_date, companyDefaultTimezone).format());
                        // data["created_date"] = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                        // data["modified_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                        data["created_date"] = moment.tz(data.created_date, companyDefaultTimezone).format('MM-DD-YYYY');
                        data["modified_date"] = moment.tz(data.modified_date, companyDefaultTimezone).format('MM-DD-YYYY');

                      })

                      totalCount=accList[0].totalcount;
                      activeCount=accList[0].activecount;
                    }
                    // console.log(account.rows);
                    done();
                    handleResponse.responseToPage(res,'pages/accounts-listing',{accounts:accList, totalCount:totalCount,activeCount:activeCount, archivedCount:(totalCount-activeCount) ,user:req.user,stripeCustomerId:result.stripe_customer_id},"success","Successfully rendered");

              }
            });
          });
        }
      });

};

function minuteToHours(min) {
    var num = min;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    rminutes = rminutes < 10 ? '0'+rminutes : rminutes;
    return rhours + ":" + rminutes;
}

exports.getAccountDetail = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
       handleResponse.handleError(res, err, ' Error in finding company setting data');
     }else{
         companyDefaultTimezone=result.timezone;
        // console.log('getAccountDetail-------------' + req.query.accountId);
        let accountId=req.query.accountId;
        if(accountId==''||accountId==null||accountId==undefined){
            handleResponse.responseToPage(res,'pages/account-details',{account:{}, projects:[], invoices:[], projectTotalCount:0,invoiceTotalCount:0,user:req.user, error:err},"error","Error in finding account.Please Restart.");
        }else{
            pool.connect((err, client, done) => {
              client.query('SELECT a.id ,a.name ,a.first_name ,a.last_name ,a.email ,a.archived ,a.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,a.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,a.company_id ,a.street ,a.city ,a.state ,a.country ,a.zip_code ,a.record_id ,a.currency FROM ACCOUNT a where a.id=$1 AND a.company_id=$2',[req.query.accountId, req.user.company_id], function(err, account) {
                if (err) {
                  // console.log('err in account')
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.responseToPage(res,'pages/account-details',{account:{}, projects:[], invoices:[], projectTotalCount:0,invoiceTotalCount:0,user:req.user, error:err},"error","Error in finding account.Please Restart.");
                  /*handleResponse.handleError(res, err, ' Error in finding account');*/
                } else {
                  console.error('getAccount>>>>>>>>>>>>>');
                  // console.log(account.rows);

                  client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id ,(SELECT count(*) FROM PROJECT where company_id=$1 AND account_id=$2 AND archived=$3)as total,(select count(*) from TASK where company_id=$1 AND project_id=p.id AND archived=$3) as totalTasks,(select count(*) from TASK where company_id=$1 AND project_id=p.id AND status=$4 AND archived=$3) as taskCompleted FROM PROJECT p where company_id=$1 AND account_id=$2 AND archived=$3 ORDER BY start_date DESC,name OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO,[req.user.company_id, req.query.accountId,false,'Completed'], function(err, projectList) {
                    if (err) {
                      // console.log('err in project')
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.responseToPage(res,'pages/account-details',{account:{}, projects:[], invoices:[], projectTotalCount:0,invoiceTotalCount:0,user:req.user, error:err},"error","Error in finding projects.Please Restart.");
                      /*handleResponse.handleError(res, err, ' Error in finding projects');*/
                    } else {
                        let projectIdArr=[];
                          if(projectList.rows.length>0){
                            projectIdArr = projectList.rows.map(function (ele) {
                                return ele.id;
                            });
                          }
                        client.query('SELECT i.id ,i.status ,i.account_id ,i.company_id ,i.created_by ,i.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,i.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,i.archived ,i.account_name ,i.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,i.due_date at time zone \''+companyDefaultTimezone+'\' as due_date ,i.description ,i.project_id ,i.project_name ,i.total_amount ,i.final_amount ,i.record_id ,i.currency ,i.tax ,(SELECT count(*) FROM INVOICE where company_id=$1 AND account_id=$2 AND archived=$3) as total FROM INVOICE i where company_id=$1 AND account_id=$2 AND archived=$3 ORDER BY id DESC OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO,[req.user.company_id, req.query.accountId,false], function(err, invoiceList) {
                        if (err) {
                          // console.log('err in invoice');
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.responseToPage(res,'pages/account-details',{account:{}, projects:[], invoices:[], projectTotalCount:0,invoiceTotalCount:0,user:req.user, error:err},"error","Error in finding invoices.Please Restart.");
                        } else {

                            console.error('getAllProjects>>>>>>>>>>>>>');
                            // console.log(projectList.rows);
                            console.error('getAllInvoices>>>>>>>>>>>>>');
                            // console.log(invoiceList.rows);
                            let projectTotalCount=0,invoiceTotalCount=0;
                            if(account.rows.length>0){
                              let startDateFormatted = '';
                                let endDateFormatted = '';
                                if(account.rows[0].start_date != null) {
                                  // startDateFormatted = dateFormat(moment.tz(account.rows[0].created_date, companyDefaultTimezone).format());
                                    startDateFormatted = dateFormat(account.rows[0].created_date);
                                }
                                if(account.rows[0].end_date != null) {
                                  // endDateFormatted = dateFormat(moment.tz(account.rows[0].modified_date, companyDefaultTimezone).format());
                                  endDateFormatted = dateFormat(account.rows[0].modified_date);
                                }

                                account.rows[0]["created_date"] = startDateFormatted;
                                account.rows[0]["modified_date"] = endDateFormatted;
                            }
                            if(projectList.rows.length>0){
                              projectList.rows.forEach(function (data) {
                                let startDateFormatted = '';
                                let endDateFormatted = '';
                                if(data.start_date != null) {
                                  startDateFormatted = moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                  // startDateFormatted = dateFormat(data.start_date);
                                }
                                if(data.end_date != null) {
                                  endDateFormatted = moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                  // endDateFormatted = dateFormat(data.end_date);
                                }
                                data["start_date"] = startDateFormatted;
                                data["end_date"] = endDateFormatted;
                                data["total_hours"] = minuteToHours(data["total_hours"]);
                                /*data["percent_completed"] =data.total_hours/data.estimated_hours*100;*/
                              });
                              projectTotalCount=projectList.rows[0].total;
                            }
                            let invoiceListArr=[];
                            if(invoiceList.rows.length>0){
                              invoiceList.rows.forEach(function (invoice) {
                                  // console.log(projectIdArr+'='+invoice.project_id);
                                  if(invoice.project_id==null||projectIdArr.includes(invoice.project_id)){
                                    invoice['start_date'] = invoice.start_date == null ? '' : moment.tz(invoice.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    invoice['due_date'] = invoice.due_date == null ? '' : moment.tz(invoice.due_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    let currency_symbols = currencyWithSymbolArray.filter(function(currency){
                                        return currency.name == invoice.currency;
                                    })
                                    invoice['currency_symbol'] = currency_symbols[0].symbol;
                                    // invoice['start_date'] = invoice.start_date == null ? '' : dateFormat(invoice.start_date);
                                    // invoice['due_date'] = invoice.due_date == null ? '' : dateFormat(invoice.due_date);

                                    invoiceListArr.push(invoice);
                                  }
                              });
                              invoiceTotalCount=invoiceList.rows[0].total;
                            }
                            // console.log("**********<<<<<<<<<<< project filteration  >>>>>>>>>>>>>*********");
                            // console.log(invoiceList.rows);
                            done();
                            handleResponse.responseToPage(res,'pages/account-details',{account:account.rows[0], projects:projectList.rows, invoices:invoiceListArr, projectTotalCount:projectTotalCount,invoiceTotalCount:invoiceTotalCount, user:req.user,stripeCustomerId:result.stripe_customer_id},"success","Successfully rendered");

                         }
                      })
                    }
                  })
                }
              })
            });
          }
        }
    });
};


exports.postEditAccount = (req, res) => {
  // console.log(req.body);
  if(req.user){
        // console.log(req.body.accountId);
        // console.log(req.user.company_id);
        req.assert('name', 'Account name cannot be blank').notEmpty();
        req.assert('email', 'Contact email cannot be blank').notEmpty();

        const errors = req.validationErrors();

        if (errors) {
          if(errors.length>0){
            // console.log(errors[0].msg);
            handleResponse.handleError(res, errors, ""+errors[0].msg);
          }else{
             handleResponse.handleError(res, errors, " Error in validating data.");
          }

        }else{
          // let modified_date=moment.tz(new Date(), companyDefaultTimezone).format();
          // console.log('modified_date  ' +modified_date);
          pool.connect((err, client, done) => {
            client.query('SELECT a.id ,a.name ,a.first_name ,a.last_name ,a.email ,a.archived ,a.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,a.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,a.company_id ,a.street ,a.city ,a.state ,a.country ,a.zip_code ,a.record_id ,a.currency FROM ACCOUNT a where a.id=$1 AND a.company_id=$2',[req.body.accountId, req.user.company_id], function(err, account) {
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding account');
              } else {
                // console.log('getAccount>>>>>>>>>>>>>');
                // console.log(account.rows[0]);
                client.query('UPDATE ACCOUNT SET name=$1, first_name=$2, last_name=$3, email=$4, modified_date =$5,street=$6,city=$7,state=$8,country=$9,zip_code=$10,currency=$11 WHERE id=$12 AND company_id=$13',[req.body.name, req.body.first_name, req.body.last_name, req.body.email, 'now()',req.body.street,req.body.city,req.body.state,req.body.country,req.body.zip_code,req.body.currency,req.body.accountId, req.user.company_id], function(err, updatedData) {
                  // console.log('Error >>>>>>>>>>>>>');
                  // console.log(err);
                  if (err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in updating account');
                  } else {
                    // console.log('Updated account >>>>>>>>>>>>>');
                    // console.log(updatedData);
                    done();
                    handleResponse.sendSuccess(res,'Account updated successfully',{});
                    /*res.status(200).json({"success": true,"message":"success" });*/
                  }
                });
              }
            })
          });
        }
  } else{
      done();
      res.redirect('/domain');
    }

};

exports.postAddAccount = (req, res) => {
  // console.log("Inside add account post method");
  // console.log(req.body);
  if(req.user){
        let account_name = req.body.name;

        req.assert('name', 'Account name cannot be blank').notEmpty();
        req.assert('email', 'Contact email cannot be blank').notEmpty();

        const errors = req.validationErrors();

        if (errors) {
          if(errors.length>0){
            // console.log(errors[0].msg);
            handleResponse.handleError(res, errors, ""+errors[0].msg);
          }else{
             handleResponse.handleError(res, errors, " Error in validating data.");
          }
        } else {
          let first_name = req.body.first_name;
          let last_name = req.body.last_name;
          let email = req.body.email;
          /*setting.getCompanySetting(req, res ,(err,result)=>{
              if(err==true){
                // console.log('error in setting');
                // console.log(err);
                handleResponse.handleError(res, err, ' error in finding company setting');
              }else{

                companyDefaultTimezone=result.timezone;*/
                  // console.log('companyDefaultTimezone');
                  // console.log(companyDefaultTimezone);
                  /*let currenctDate=new Date();*/
                  // var createdDate=moment.tz(new Date(), companyDefaultTimezone).format();
                  /*dateFormat(new Date(Date.now()));*/
                  // console.log('createdDate '+createdDate);

                  // console.log(moment.tz(new Date(), companyDefaultTimezone).format());
                  // console.log(new Date())
                  pool.connect((err, client, done) => {
                    client.query('BEGIN', (err) => {
                      if (err){
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' error in connecting to database');
                      } else {
                        client.query('SELECT a.id ,a.name ,a.first_name ,a.last_name ,a.email ,a.archived ,a.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,a.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,a.company_id ,a.street ,a.city ,a.state ,a.country ,a.zip_code ,a.record_id ,a.currency FROM ACCOUNT a where a.company_id = $1 AND a.name = $2',[req.user.company_id, account_name], function(err, existingAccount) {
                          if (err){
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in finding accounts');
                          } else {
                            // console.log("existingAccount-----------");
                            // console.log(existingAccount);

                            if (existingAccount.rows.length>0) {
                              done();
                              handleResponse.handleError(res,'Account adding error', 'Account with this name already exists.');
                            }else{
                              client.query('Insert INTO ACCOUNT (name,first_name,last_name, email,created_date,modified_date,currency,company_id) values ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',[account_name,first_name,last_name,email,'now()','now()',req.body.currency, req.user.company_id], function(err, insertedAccount) {
                                  if (err){
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in adding account');
                                  } else {
                                    client.query('COMMIT', (err) => {
                                      if (err) {
                                        console.error('Error committing transaction', err.stack)
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.handleError(res, err, ' Error in committing transaction');
                                      } else {
                                        done();
                                        handleResponse.sendSuccess(res,'Account added successfully',{});
                                        /*res.status(200).json({"success": true,"message":"success"});*/
                                      }
                                    });
                                  }
                              });
                            }
                          }
                        });
                      }
                    });
                  });
             /* }
          })*/
        }
    } else{
      done();
      res.redirect('/domain');
    }
};


exports.deleteAccount = (req,res) =>{
  // console.log('Archived Account-------------' + req.body.accountId);
  if(req.user){
    let accountId=req.body.accountId;
    if(accountId==""||accountId==null||accountId==undefined){
      handleResponse.handleError(res, "incorrect account id", "account id is not correct");
    }else{
          pool.connect((err, client, done) => {
            client.query('SELECT count(id) as projectTotalCount FROM PROJECT WHERE account_id=$1 AND archived=$2',[req.body.accountId,false], function(err, projectRelatedToAccount) {
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding the project related to account.');
              } else {
                  console.log('projectRelatedToAccount.rows[0].projectTotalCount')
                  console.log(projectRelatedToAccount.rows[0].projecttotalcount)
                  if(projectRelatedToAccount.rows[0].projecttotalcount > 0){
                    done();
                    console.error('Account cannot be deleted.There are project associated with this account.');
                    handleResponse.handleError(res, 'Account cannot be deleted. There are project associated with this account.', 'Account cannot be deleted.There are project associated with this account.');
                  }else{
                    client.query('SELECT count(id) as invoiceTotalCount FROM INVOICE WHERE account_id=$1 AND archived=$2',[req.body.accountId,false], function(err, invoiceRelatedToAccount) {
                      if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding invoice related to account.');
                      } else {
                        console.log('invoiceRelatedToAccount.rows[0].invoiceTotalCount')
                        console.log(invoiceRelatedToAccount.rows[0].invoicetotalcount)
                        if(invoiceRelatedToAccount.rows[0].invoicetotalcount > 0){
                          done();
                          console.error('Account cannot be deleted.There are invoices associated with this account.');
                          handleResponse.handleError(res, 'Account cannot be deleted. There are invoices associated with this account.', 'Account cannot be deleted.There are invoices associated with this account.');
                        }else{
                          client.query('UPDATE ACCOUNT SET archived = $1 WHERE id=$2',[true, req.body.accountId], function(err, archivedAccount) {
                            if (err) {
                              console.error(err);
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in deleting account.');
                            } else {
                              console.error('Affected ID>>>>>>>>>>>>>');
                              // console.log(archivedAccount.rows[0]);
                              done();
                              handleResponse.sendSuccess(res,'Account deleted successfully',{});
                              /*res.status(200).json({"success": true,"message":"success"});*/
                            }
                          })
                        }
                      }
                    })
                  }
                }
              })
          });
        }
    } else{
      done();
      res.redirect('/domain');
    }
}
