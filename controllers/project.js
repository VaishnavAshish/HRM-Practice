const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const commonController = require('./common-functions');
const jsonexport = require('jsonexport');
let companyDefaultTimezone;
/*handleError = (res, reason, message, code) => {
  // console.log("ERROR: " + reason);
  res.status(code || 500).json({ "success": false, "message": message });
}
shouldAbort = (err, client, done) => {
  if (err) {
    console.error('Error in transaction', err.stack)
    client.query('ROLLBACK', (err) => {
      if (err) {
        console.error('Error rolling back client', err.stack);
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
//   var today = new Date(gDate);
//   var dd = today.getDate();
//   var mm = today.getMonth() + 1; //January is 0!
//   var yyyy = today.getFullYear();
//   if (dd < 10) {
//     dd = '0' + dd
//   }
//   if (mm < 10) {
//     mm = '0' + mm
//   }
//   formatedDate = yyyy + '-' + mm + '-' + dd;
//   return formatedDate;
// }

exports.generateProjectDetailCsv = (req, res) => {
  console.log('inside generate project csv');
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;
         console.log('companyDefaultTimezone '+companyDefaultTimezone);
         pool.connect((err, client, done) => {
           whereClause='WHERE company_id=$1 AND archived=$2 AND account_id In (SELECT id from ACCOUNT WHERE company_id=$1 AND archived=$2)';
           client.query('SELECT p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.completed ,p.archived ,p.project_cost ,p.total_hours,p.total_expense_amount,p.total_invoice_amount,p.total_invoice_time,p.total_invoice_expense,p.record_id FROM PROJECT p  '+whereClause+' AND isGlobal=$3 AND id=$4', [req.user.company_id, false,false,req.params.projectId], function (err, project) {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in finding project data');
             } else {
               client.query('SELECT t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.billable_hours ,t.milestone ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date,t.project_name ,t.record_id FROM TASK t where project_id=$1 AND company_id=$2 AND archived=$3', [req.params.projectId, req.user.company_id,false], function (err, tasks) {
                 if (err) {
                   handleResponse.shouldAbort(err, client, done);
                   handleResponse.handleError(res, err, ' Error in finding task data');
                 } else {
                     whereClause='WHERE project_id=$1';
                     client.query('SELECT e.id ,e.tax ,e.tax_amount ,e.note ,e.status ,e.category ,e.amount ,e.billable ,e.archived ,e.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,e.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,e.expense_date at time zone \''+companyDefaultTimezone+'\' as expense_date ,e.currency ,e.invoiced ,e.total_amount ,e.record_id,e.submitted FROM EXPENSE e '+whereClause+' ORDER BY expense_date DESC,record_id ', [req.params.projectId], function(err, expense) {
                       if (err) {
                         handleResponse.shouldAbort(err, client, done);
                         handleResponse.handleError(res, err, ' Error in finding expense data');
                       } else {
                         client.query('SELECT tl.created_date at time zone \''+companyDefaultTimezone+'\'  as created_date ,tl.total_work_hours ,tl.project_name ,tl.task_name ,tl.description ,tl.category , EXTRACT(DOW FROM created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.billable ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\'  as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id  FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND project_id=$2 ORDER BY created_date, task_id, user_role',[req.user.company_id, req.params.projectId], function(err, timesheet) {
                           if (err) {
                             handleResponse.shouldAbort(err, client, done);
                             handleResponse.handleError(res, err, ' Error in finding timesheet data');
                           } else {
                            //  console.log('---------project.rows---------');
                            //  console.log(project.rows);
                               done();
                               if(project.rowCount>0){

                                   let projectCsv = 'Project Details: \n\n';
                                   jsonexport([project.rows[0]],function(err, csv){
                                       if(err) {
                                         console.log('err');
                                         console.log(err);
                                         handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                                       }
                                       projectCsv += csv+'\n\n\n\n';
                                       projectCsv += 'Task Details : \n\n';
                                       jsonexport(tasks.rows,function(err, taskcsv){
                                           if(err) {
                                             console.log('err');
                                             console.log(err);
                                             handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                                           }
                                           projectCsv += taskcsv+'\n\n\n\n';
                                           projectCsv += 'Expense Details : \n\n';
                                           jsonexport(expense.rows,function(err, expensecsv){
                                               if(err) {
                                                 console.log('err');
                                                 console.log(err);
                                                 handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                                               }
                                               projectCsv +=expensecsv+'\n\n\n\n';
                                               projectCsv += 'Timesheet Details : \n\n';
                                               jsonexport(timesheet.rows,function(err, timesheetcsv){
                                                   if(err) {
                                                     console.log('err');
                                                     console.log(err);
                                                     handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                                                   }
                                                   projectCsv +=timesheetcsv;
                                                    //  console.log(csv);
                                                     res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'projectDetail-' + Date.now() + '.csv\"');
                                                     res.writeHead(200, {
                                                       'Content-Type': 'text/csv'
                                                     });
                                                     res.end(projectCsv);
                                              });
                                          });
                                       });
                                   });
                               }else{
                                  handleResponse.handleError(res, err, ' No Project detail Found');
                               }
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

}

exports.generateProjectCsv = (req, res) => {
  console.log('inside generate project csv');
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;
         console.log('companyDefaultTimezone '+companyDefaultTimezone);
         pool.connect((err, client, done) => {
           whereClause='WHERE company_id=$1 AND archived=$2 AND account_id In (SELECT id from ACCOUNT WHERE company_id=$1 AND archived=$2)';
           client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.completed ,p.archived ,p.project_cost,p.total_hours,p.total_expense_amount,p.total_invoice_amount,p.total_invoice_time ,p.record_id FROM PROJECT p '+whereClause+' AND isGlobal=$3 ORDER BY start_date DESC,name ', [req.user.company_id, false,false], function (err, project) {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in finding project data');
             } else {
              //  console.log('---------project.rows---------');
              //  console.log(project.rows);
               done();
                    let projectCSV = 'Project Details : \n\n';
                    project.rows.forEach(projectData=>{
                      projectData.start_date = projectData.start_date?moment.tz(projectData.start_date, companyDefaultTimezone).format('MM-DD-YYYY'):'';
                      projectData.end_date = projectData.end_date?moment.tz(projectData.end_date, companyDefaultTimezone).format('MM-DD-YYYY'):'';
                      projectData.total_hours = minuteToHours(projectData.total_hours);
                    })
                    console.log('project.rows');
                    console.log(project.rows);
                   jsonexport(project.rows,function(err, csv){
                       if(err) {
                         console.log('err');
                         console.log(err);
                         handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                       }
                      //  console.log(csv);
                      projectCSV += csv+'\n\n\n\n';
                       res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'project-' + Date.now() + '.csv\"');
                       res.writeHead(200, {
                         'Content-Type': 'text/csv'
                       });
                       res.end(projectCSV);
                   });


             }
           });
         })
       }
     });

}

exports.updateTaskSortOrder = (req,res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
        // client.query('SELECT p.id ,p.name,p.task_sort_order ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id FROM PROJECT p where id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, project) {
        //   if (err) {
        //     console.error(err);
        //     handleResponse.shouldAbort(err, client, done);
        //     handleResponse.handleError(res, err, ' Error in finding project data');
        //   } else {
        //     console.log(project.rows[0].task_sort_order);
            let prevSortOrder = req.body.prevSortOrder;
            let dropTaskId = req.body.dropTaskId;
            let targetContainerId = req.body.targetContainerId;
            let newTaskSortOrder = ``;

            let afterString = prevSortOrder.substring(prevSortOrder.indexOf(dropTaskId)+dropTaskId.length+1)
            let previousString = prevSortOrder.substring(0,prevSortOrder.indexOf(dropTaskId)-1)
            let finalSortString = (previousString!=""&&afterString!=""?(previousString+','+afterString):(previousString+afterString))
            if(targetContainerId == null){
                newTaskSortOrder = finalSortString+','+dropTaskId;
            }else{
                newTaskSortOrder = finalSortString.substring(0,finalSortString.indexOf(targetContainerId))+dropTaskId+','+finalSortString.substring(finalSortString.indexOf(targetContainerId))
            }
            console.log('------newTaskSortOrder--------');
            console.log(newTaskSortOrder);
            client.query('UPDATE PROJECT SET task_sort_order=$1 WHERE id=$2 AND company_id=$3 RETURNING *', [newTaskSortOrder,req.body.project_id, req.user.company_id], function (err, updatedProjectSortOrder) {
              // console.log('Error >>>>>>>>>>>>>');
              // console.log(err);
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in updating task sort order');
              } else {
                client.query('COMMIT', (err) => {
                  if (err) {
                    // console.log('Error committing transaction', err.stack)
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in committing transaction');
                  } else {
                    done();
                    console.log('Updated project >>>>>>>>>>>>>');
                    console.log(updatedProjectSortOrder.rows[0]);
                    handleResponse.sendSuccess(res,'Task sort order updated successfully.',{});
                    /*res.status(200).json({ "success": true, "message": "success" });*/
                  }
                })
              }
            });
        //   }
        // })
      }
    })
  });
}

exports.findProjectByCriteria = (req, res) => {
  // console.log("findProjectByCriteria----------------------------------"+req.body.searchField);
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;
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
              whereClause+=' AND account_id In (SELECT id from ACCOUNT WHERE company_id=$1 AND archived=$'+(searchCriteriaVal.length+1)+') ';
              searchCriteriaVal.push(false);
              if(!req.user.permissions.includes('projectManager')){
                whereClause += ' AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$'+(searchCriteriaVal.length+1)+')';
                searchCriteriaVal.push(req.user.id);
              }
              let queryToExec='SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id ,(SELECT count(*) from PROJECT '+whereClause+') as searchcount FROM PROJECT p '+whereClause+' ORDER BY start_date DESC,name OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
              // console.log('queryToExec '+queryToExec);
              client.query(queryToExec,searchCriteriaVal, function (err,project) {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding project data');
                }
                else{
                    client.query('SELECT * FROM ACCOUNT where company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                      if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding account data');
                      } else {
                            let accountIdArr=[];
                              if(accountList.rows.length>0){
                                accountIdArr = accountList.rows.map(function (ele) {
                                    return ele.id;
                                });
                              }
                            let projectArr=[];
                            let account={};
                            let searchCount=0;
                            if(project.rows.length>0){

                              // console.log("----------project.rows------------- 2");
                              project.rows.forEach(function (data,index) {
                                if(accountIdArr.includes(data.account_id)){
                                    data["start_date"] = (data.start_date==null)?'':moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    data["end_date"] =  (data.end_date==null)?'':moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    data["total_hours"] = minuteToHours(data["total_hours"]);
                                    // data["start_date"] = (data.start_date==null)?'':dateFormat(data.start_date);
                                    // data["end_date"] =  (data.end_date==null)?'':dateFormat(data.end_date);
                                    if(data.account_id){
                                        if(accountList.rows.length>0){
                                          account=accountList.rows.filter(acc => acc.id==data.account_id);
                                          if(account.length>0){
                                            // // console.log('account '+account);
                                            data.account_name=account[0].name;
                                          }
                                        }
                                      }else{
                                        data.account_name='';
                                      }
                                    projectArr.push(data);
                                    if(project.rows.length == (index+1)) {
                                      searchCount=project.rows[0].searchcount;
                                      // console.log(searchCount);
                                      // console.log('-----------projectArr---------');
                                      // console.log(projectArr);
                                      done();
                                      handleResponse.sendSuccess(res,'Projects searched successfully',{projects: projectArr,count:searchCount});
                                    }
                                }
                              });
                            } else {
                              done();
                              handleResponse.sendSuccess(res,'Projects searched successfully',{projects: projectArr,count:searchCount});
                            }
                      }
                    });
                }
              });

            })
          }
        })
};

exports.findProjectByName = (req, res) => {
  // console.log("findProjectByName----------------------------------"+req.body.searchText);
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
      //  handleResponse.responseToPage(res,'pages/projects-listing',{projects: [], totalCount: 0,notStartedCount:0, inProgressCount :0, atRiskCount :0, completedCount:0,user:req.user, error:err},"error","  Error in finding company setting");
       handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;
          let offset=0;
          let searchCount=0;
          pool.connect((err, client, done) => {
              // console.log('accountId'+req.body.accountId+' ');
              if(req.body.accountId!=undefined&&req.body.accountId!=null&&req.body.accountId!=''){
                  // console.log('inside if');
                  if(req.body.offset){
                    offset=req.body.offset;
                  }
                  client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id,(SELECT count(*) from PROJECT WHERE name ilike $1 AND company_id= $2 AND archived=$3 AND isGlobal=$4 AND account_id=$5) as searchcount,(select count(*) from TASK where company_id=$2 AND project_id=p.id AND archived=$3) as totalTasks,(select count(*) from TASK where company_id=$2 AND project_id=p.id AND status=$6 AND archived=$3) as taskCompleted,(select count(*) from TASK where company_id=$2 AND project_id=p.id AND archived=$3) as totalTasks,(select count(*) from TASK where company_id=$2 AND project_id=p.id AND status=$6 AND archived=$3) as taskCompleted  FROM PROJECT p WHERE name ilike $1 AND company_id= $2 AND archived=$3 AND isGlobal=$4 AND account_id=$5 ORDER BY start_date DESC,name OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO, ['%'+req.body.searchText+'%',req.user.company_id, false,false,req.body.accountId,'Completed'], function (err, project) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding project data for the account');
                    /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                  } else {
                      if(project.rows.length>0){
                        // console.log("----------project.rows------------- 1");
                        project.rows.forEach(function (data, index) {
                          data["start_date"] = (data.start_date==null)?'':moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                          data["end_date"] = (data.end_date==null)?'':moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                          data["total_hours"] = minuteToHours(data["total_hours"]);
                          // data["start_date"] = (data.start_date==null)?'':dateFormat(data.start_date)
                          // data["end_date"] = (data.end_date==null)?'':dateFormat(data.end_date)

                          if(project.rows.length==(index+1)){
                            searchCount=project.rows[0].searchcount;
                            done();
                            handleResponse.sendSuccess(res,'Projects searched successfully',{projects: project.rows,count:searchCount});
                          }
                        });
                      }else{
                        console.log(project.rows);
                        done();
                        handleResponse.sendSuccess(res,'Projects searched successfully',{projects: project.rows,count:searchCount});

                      }
                  }
                });
              } else {
                  if(req.body.offset){
                    offset=req.body.offset;
                  }
                  let whereClause ='WHERE name ilike $1 AND company_id=$2 AND isGlobal=$3 AND archived=$4 AND account_id In (SELECT id from ACCOUNT WHERE company_id=$2 AND archived=$4 ) ';
                  let searchFieldVal = ['%'+req.body.searchText+'%',req.user.company_id, false,false];
                  if(!req.user.permissions.includes('projectManager')){
                    whereClause += ' AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$2 AND user_id=$'+(searchFieldVal.length+1)+')';
                    searchFieldVal.push(req.user.id);
                  }
                  let innerQuery='SELECT count(*) from PROJECT '+whereClause;
                  let queryToExec='' ;
                  if(req.body.status) {
                    innerQuery+=' AND status ilike $'+(searchFieldVal.length+1);
                    queryToExec='SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id,('+innerQuery+') as searchcount FROM PROJECT p '+whereClause+' AND status ilike $'+(searchFieldVal.length+1);
                    searchFieldVal.push(req.body.status);
                  }else{
                    queryToExec='SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id,('+innerQuery+') as searchcount FROM PROJECT p '+whereClause;
                  }
                  queryToExec+=' ORDER BY start_date DESC,name OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
                  // console.log('---------queryToExec for filter-------'+req.body.status);
                   //console.log(queryToExec);
                   //console.log(searchFieldVal);
                  client.query(queryToExec, searchFieldVal, function (err, project) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding project data');
                    /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                  } else {
                    client.query('SELECT * FROM ACCOUNT where company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                      if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding account data');
                      } else {
                            let accountIdArr=[];
                              if(accountList.rows.length>0){
                                accountIdArr = accountList.rows.map(function (ele) {
                                    return ele.id;
                                });
                              }
                            let projectArr=[];

                            let account={};
                            if(project.rows.length>0){
                              // console.log("----------project.rows------------- 2");
                              project.rows.forEach(function (data) {
                                if(accountIdArr.includes(data.account_id)){
                                    data["start_date"] = (data.start_date==null)?'':moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    data["end_date"] =  (data.end_date==null)?'':moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    // data["start_date"] = (data.start_date==null)?'':dateFormat(data.start_date);
                                    // data["end_date"] =  (data.end_date==null)?'':dateFormat(data.end_date);
                                    if(data.account_id){
                                        if(accountList.rows.length>0){
                                          account=accountList.rows.filter(acc => acc.id==data.account_id);
                                          if(account.length>0){
                                            // console.log('account '+account);
                                            data.account_name=account[0].name;
                                          }
                                        }
                                      }else{
                                        data.account_name='';
                                      }
                                    projectArr.push(data);
                                }
                              });
                              searchCount=project.rows[0].searchcount;
                            }
                            // console.log(projectArr);
                            done();
                            handleResponse.sendSuccess(res,'Projects searched successfully',{projects: projectArr,count:searchCount});
                      }
                    });
                    /*res.render('pages/projects-listing', { projects: project.rows, user: req.user, error: err });*/
                  }
                });
              }
            })
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

exports.getProject = (req, res) => {
   setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/projects-listing',{projects: [], totalCount: 0,notStartedCount:0, inProgressCount :0, atRiskCount :0, completedCount:0,user:req.user, error:err},"error","  Error in finding company setting");
        /*handleResponse.handleError(res, err, ' error in finding company setting');*/
      }else{
          companyDefaultTimezone=result.timezone;
          // console.log('companyDefaultTimezone');
          // console.log(companyDefaultTimezone);
          pool.connect((err, client, done) => {
            whereClause='WHERE company_id=$1 AND archived=$2 AND account_id In (SELECT id from ACCOUNT WHERE company_id=$1 AND archived=$2)';
            let queryParamArray = [req.user.company_id, false,false,'%Not Started%','%In Progress%','%At Risk%','%Completed%'];
            if(!req.user.permissions.includes('projectManager')){
              whereClause += ' AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$8)';
              queryParamArray.push(req.user.id);
            }
            client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id,(SELECT count(*) FROM PROJECT '+whereClause+' AND isGlobal=$3) as totalCount,(SELECT count(*) FROM PROJECT '+whereClause+' AND isGlobal=$3 AND status ilike $4) as notStartedCount,(SELECT count(*) FROM PROJECT '+whereClause+' AND isGlobal=$3 AND status ilike $5) as inProgressCount,(SELECT count(*) FROM PROJECT '+whereClause+' AND isGlobal=$3 AND status ilike $6) as atRiskCount,(SELECT count(*) FROM PROJECT '+whereClause+
            ' AND isGlobal=$3 AND status ilike $7) as completedCount FROM PROJECT p '+whereClause+' AND isGlobal=$3 ORDER BY start_date DESC,name ', queryParamArray, function (err, project) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.responseToPage(res,'pages/projects-listing',{projects: [], totalCount: 0,notStartedCount:0, inProgressCount :0, atRiskCount :0, completedCount:0,user:req.user, error:err},"error","  Error in finding project data");
                /*handleResponse.handleError(res, err, ' Error in finding project data');*/
              } else {
                client.query('SELECT * FROM ACCOUNT where company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.responseToPage(res,'pages/projects-listing',{projects: [], totalCount: 0,notStartedCount:0, inProgressCount :0, atRiskCount :0, completedCount:0,user:req.user, error:err},"error","  Error in finding account data");
                  } else {
                     //console.log("----------project.rows-------------");

                        let accountIdArr=[];
                          if(accountList.rows.length>0){
                            accountIdArr = accountList.rows.map(function (ele) {
                                return ele.id;
                            });
                          }

                        let allProjectCount=0,notStartedCount=0,atRiskCount=0,completedCount=0,inProgressCount = 0;

                        let projectArr=[];
                        if(project.rows.length>0){
                            project.rows.forEach(function (data) {
                                //console.log(data.status);
                                if(accountIdArr.includes(data.account_id) && data.status.includes('In Progress')){
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
                                  data["startDateFormatted"] = startDateFormatted;
                                  data["endDateFormatted"] = endDateFormatted;
                                  if(data.account_id){
                                      if(accountList.rows.length>0){
                                        account=accountList.rows.filter(acc => acc.id==data.account_id);
                                        if(account.length>0){
                                          // console.log('account '+account);
                                          data.account_name=account[0].name;
                                        }
                                      }
                                    }else{
                                      data.account_name='';
                                    }
                                    projectArr.push(data);
                                    // if(data.status=="In Progress".trim()){
                                    // }
                              }
                            });
                            allProjectCount=project.rows[0].totalcount;
                            inProgressCount=project.rows[0].inprogresscount;
                            notStartedCount=project.rows[0].notstartedcount;
                            atRiskCount=project.rows[0].atriskcount;
                            completedCount=project.rows[0].completedcount;
                        }
                         //console.log('-----------project.rows------------');

                        // console.log('--------project----------');
                        // console.log(allProjectCount+' '+notStartedCount+' '+atRiskCount+' '+completedCount+' '+inProgressCount);
                        /*projectNotStarted=projectArr.filter(pro => pro.status=="Not Started");
                        projectInProgress=projectArr.filter(pro => pro.status=="In Progress");
                        projectAtRisk=projectArr.filter(pro => pro.status=="At Risk");
                        projectCompleted=projectArr.filter(pro => pro.status=="Completed");*/
                        done();
                        handleResponse.responseToPage(res,'pages/projects-listing',{projects: projectArr.length>process.env.PAGE_RECORD_NO?projectArr.slice(0, process.env.PAGE_RECORD_NO):projectArr, totalCount: allProjectCount,notStartedCount:notStartedCount, inProgressCount :inProgressCount, atRiskCount :atRiskCount, completedCount:completedCount,user:req.user, error:err, accounts:accountList.rows,currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD'),companyDefaultTimezone:companyDefaultTimezone,stripeCustomerId:result.stripe_customer_id},"success","Successfully rendered");
                  }
                });
                /*res.render('pages/projects-listing', { projects: project.rows, user: req.user, error: err });*/
              }
            });
          })
        }
      });
};

exports.getGlobalProject = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
        if(err==true){
          // console.log('error in setting');
          // console.log(err);
          handleResponse.handleError(res, err, "  Error in finding company setting");
          /*handleResponse.handleError(res, err, ' error in finding company setting');*/
        }else{
            companyDefaultTimezone=result.timezone;
            // console.log('companyDefaultTimezone');
            // console.log(companyDefaultTimezone);
            pool.connect((err, client, done) => {
              client.query('SELECT NOW() at time zone \''+companyDefaultTimezone+'\' as currentdate', function(err, currentTimestamp) {
                if(err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding current date and time');
                } else {
                    // currentTimestamp.rows[0].currentdate = JSON.stringify(currentTimestamp.rows[0].currentdate);
                    client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id FROM PROJECT p WHERE company_id=$1 AND archived=$2 AND isGlobal=$3', [req.user.company_id, false, true], function (err, project) {
                      if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding project data');
                      } else {
                        if(project.rows.length>0){

                          client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id FROM TASK t WHERE company_id=$1 AND archived=$2 AND project_id=$3', [req.user.company_id, false, project.rows[0].id], function (err, task) {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in finding task data');
                            } else {
                                // console.log("----------project.rows-------------");
                                // console.log("----------task.rows-------------");
                                /*if(project.rows.length>0){
                                  project.rows.forEach(function (data) {
                                    let startDateFormatted = dateFormat(data.start_date);
                                    let endDateFormatted = dateFormat(data.end_date);
                                    data["startDateFormatted"] = startDateFormatted;
                                    data["endDateFormatted"] = endDateFormatted;
                                  })
                                }*/
                                done();
                                //// console.log(project.rows);
                                // console.log(task.rows);
                                // console.log('companyDefaultTimezone '+companyDefaultTimezone)

                                // let currentTime=moment.tz(task.rows[0].currentdate, companyDefaultTimezone).format('HH:mm:ss');
                                // let currentDate=moment.tz(task.rows[0].currentdate, companyDefaultTimezone).format();
                                let currentDate=moment.tz(currentTimestamp.rows[0].currentdate, companyDefaultTimezone).format('YYYY-MM-DD');
                                let currentTime=moment.tz(currentTimestamp.rows[0].currentdate, companyDefaultTimezone).format('HH:mm:ss');
                                currentTimestamp.rows[0].currentdate = moment.tz(currentTimestamp.rows[0].currentdate, companyDefaultTimezone).format('YYYY-MM-DD HH:mm:ssZ');
                                console.log('getGlobalProject currentDate and time: '+currentDate+' '+currentTime);
                                console.log(currentTimestamp.rows[0].currentdate);
                                // let currentDate=currentTimestamp.rows[0].currentdate.split(' ')[0];
                                // let currentTime=currentTimestamp.rows[0].currentdate.split(' ')[1];
                                // let currentTime=dateFormat(task.rows[0].currentdate);
                                // let currentDate=task.rows[0].currentdate.split(' ')[1];
                                // console.log('currentTime and currentDate from global project are ');

                                // console.log(currentTime+' '+currentDate+' '+task.rows[0].currentdate);
                                handleResponse.sendSuccess(res,'Global Project and Task found.',{"project": project.rows[0],"task": task.rows[0],"currentTime":currentTime,"currentDate":currentDate,"currentTimestamp":currentTimestamp.rows[0].currentdate});
                                /*res.status(200).json({ "success": true, "projects": project.rows, "message": "success" });*/
                            }
                          });
                        } else{
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in global project.Please add it firstly');
                        }
                      }

                    });
                  }
              });
            })
        }
  });

};


exports.getProjectListForCompany = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
       handleResponse.handleError(res, err, ' Error in finding company setting data');
     }else{
         companyDefaultTimezone=result.timezone;
         console.log('companyDefaultTimezone');
         console.log(companyDefaultTimezone);
          pool.connect((err, client, done) => {
            client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id FROM PROJECT p WHERE company_id=$1 AND archived=$2 AND isGlobal=$3', [req.user.company_id, false, false], function (err, project) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding project data');
              } else {
                commonController.getCompanyAllRoles(req, client, err, done, res, function(userRoles) {
                    // console.log("----------project.rows-------------");
                    if(project.rows.length>0){
                      project.rows.forEach(function (data) {
                        // let startDateFormatted = dateFormat(moment.tz(data.start_date, companyDefaultTimezone).format());
                        // let endDateFormatted = dateFormat(moment.tz(data.end_date, companyDefaultTimezone).format());
                        let startDateFormatted = dateFormat(JSON.stringify(data.start_date));
                        let endDateFormatted = dateFormat(JSON.stringify(data.end_date));
                        data["startDateFormatted"] = startDateFormatted;
                        data["endDateFormatted"] = endDateFormatted;
                      })
                    }
                    done();
                    // console.log(project.rows);
                    handleResponse.sendSuccess(res,'Project list fetched.',{"projects": project.rows,"userRoles":userRoles,"companyDefaultTimezone":companyDefaultTimezone});
                });
              }
            });
          })
        }
      });

};


exports.getProjectList = (req, res) => {
  let accountId = req.body.accountId;
  if (accountId == '' || accountId == null || accountId == undefined) {
    handleResponse.handleError(res, "incorrect account id", " Account id is not correct");
  } else {
    pool.connect((err, client, done) => {
      client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id FROM PROJECT p WHERE company_id=$1 AND archived=$2 AND isGlobal=$3 AND account_id=$4', [req.user.company_id, false, false, req.body.accountId], function (err, project) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding project data');
        } else {
          // console.log("----------project.rows-------------");
          project.rows.forEach(function (data) {
            // let startDateFormatted = dateFormat(moment.tz(data.start_date, companyDefaultTimezone).format());
            // let endDateFormatted = dateFormat(moment.tz(data.end_date, companyDefaultTimezone).format());
            let startDateFormatted = dateFormat(data.start_date);
            let endDateFormatted = dateFormat(data.end_date);
            data["startDateFormatted"] = startDateFormatted;
            data["endDateFormatted"] = endDateFormatted;
          })
          done();
          // console.log(project.rows);
          handleResponse.sendSuccess(res,'Project list fetched.',{"projects": project.rows});
          /*res.status(200).json({ "success": true, "projects": project.rows, "message": "success" });*/
        }
      });
    })
  }
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
exports.getProjectDetail = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       // console.log('error in setting');
       // console.log(err);
       handleResponse.handleError(res, err, ' Error in finding company setting data');
     }else{
         companyDefaultTimezone=result.timezone;
          // console.log('getProjectDetail-------------' + req.query.projectId);
          let projectId = req.query.projectId;
          if (projectId == '' || projectId == null || projectId == undefined) {
            handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [],user:req.user, error:err},"error"," Project id is not correct");
            /*handleResponse.handleError(res, "incorrect project id", " Project id is not correct");*/
          } else {
            pool.connect((err, client, done) => {
              client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id,p.total_hours,p.total_invoice_amount,p.total_expense_amount,p.task_sort_order,p.total_invoice_time,p.total_invoice_expense,(SELECT count(id) from task where project_id = $1 AND status = $3) as total_completed_task_count,(SELECT count(id) from task where project_id = $1 AND company_id = $2 AND archived = $4) as total_task_count FROM PROJECT p where id=$1 AND company_id=$2', [req.query.projectId, req.user.company_id,"Completed",false], function (err, project) {
                if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [],user:req.user, error:err},"error"," Error in finding project data");
                  /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                } else {
                  if(project.rowCount > 0) {
                    // console.error('getProject>>>>>>>>>>>>>');
                    // // console.log(project.rows[0]);
                    // console.log('queryToExec in project details: SELECT t.*,(select count(*) from TASK where company_id=$1 AND project_id=$2 AND archived=$3) as total FROM TASK t where company_id=$1 AND project_id=$2 AND archived=$3 ORDER BY project_id,name OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO+' '+req.user.company_id+' '+ req.query.projectId+' '+ false);
                    // client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date ,t.updated_date ,t.archived ,t.project_name ,t.record_id ,(select count(*) from TASK where company_id=$1 AND project_id=$2 AND archived=$3) as total FROM TASK t where company_id=$1 AND project_id=$2 AND archived=$3 ORDER BY id,project_id,start_date DESC,name LIMIT '+process.env.PAGE_RECORD_NO+' OFFSET 0', [req.user.company_id, req.query.projectId, false], function (err, taskList) {
                      
                    let requiredTasks= project.rows[0].task_sort_order.substring(0,project.rows[0].task_sort_order.split(',',process.env.PAGE_RECORD_NO).join(',').length);
                    let qry=`SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone '${companyDefaultTimezone}' as start_date ,t.end_date at time zone '${companyDefaultTimezone}' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone '${companyDefaultTimezone}' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date ,t.updated_date ,t.archived ,t.project_name ,t.record_id  
                      FROM TASK t 
                      where id in (${requiredTasks}) 
                      ORDER BY position(id::text in '${requiredTasks}')`;
                      client.query(qry, [req.user.company_id, req.query.projectId, false], function (err, taskList) {
                      if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [],user:req.user, error:err},"error"," Error in finding task data");
                        /*handleResponse.handleError(res, err, ' Error in finding task data');*/
                      } else {
                        console.log("-------------taskList------------");
                        console.log(taskList.rows);
                        let startDateFormatted = '';
                        let endDateFormatted = '';
                        if(project.rows[0].start_date != null) {
                          // startDateFormatted = dateFormat(moment.tz(project.rows[0].start_date, companyDefaultTimezone).format());
                          startDateFormatted = dateFormat(project.rows[0].start_date);
                        }
                        if(project.rows[0].end_date != null) {
                          // endDateFormatted = dateFormat(moment.tz(project.rows[0].end_date, companyDefaultTimezone).format());
                          endDateFormatted = dateFormat(project.rows[0].end_date);
                        }
                        project.rows[0]["startDateFormatted"] = startDateFormatted;
                        project.rows[0]["endDateFormatted"] = endDateFormatted;

                        project.rows[0]["total_hours"] = minuteToHours(project.rows[0]["total_hours"]);
                        project.rows[0]["total_invoice_time"] = minuteToHours(project.rows[0]["total_invoice_time"]);

                        //let taskTotalCount=0;
                        //let projectTaskSortOrder = project.rows[0].task_sort_order?project.rows[0].task_sort_order.split(','):[];
                        let taskSortedArr = [];
                        if(taskList.rows.length>0){
                            taskList.rows.forEach(function (data,index) {
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
                              data["startDateFormatted"] = startDateFormatted;
                              data["endDateFormatted"] = endDateFormatted;
                              // console.log('task assignment detail')
                              // console.log(data.id)
                              // console.log(data.assigned_user_id)
                              data["user_id"]='';
                              data["user_role"]='';
                              data["user_email"]='';
                              if(data.assigned_user_id){
                                client.query('SELECT user_id,user_email,user_role FROM TASK_ASSIGNMENT where task_id=$1', [data.id], function (err, taskAssignResourceId) {
                                  if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding task assignment data");
                                    return false;
                                  } else {
                                    if(taskAssignResourceId.rows.length>0){
                                      client.query('SELECT id, first_name, last_name, email FROM users WHERE id=$1', [taskAssignResourceId.rows[0].user_id], function (err, taskAssignResourceDetail) {
                                        if (err) {
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding user data");

                                        } else {
                                            console.log('taskAssignResourceId.rows')
                                            console.log(taskAssignResourceId.rows[0]);
                                            data["user_id"] = taskAssignResourceId.rows[0].user_id;
                                            data["user_role"] = taskAssignResourceId.rows[0].user_role;
                                            data["user_first_name"] = taskAssignResourceDetail.rows[0].first_name;
                                            data["user_last_name"] = taskAssignResourceDetail.rows[0].last_name;
                                            data["user_email"] = taskAssignResourceDetail.rows[0].email;
                                            //data["user_email"]=taskAssignResourceId.rows[0].user_email.substring(0,taskAssignResourceId.rows[0].user_email.indexOf('('));
                                        }
                                      })
                                    }
                                  }
                                })
                              }
                              taskSortedArr.push(data);
                            });
                            taskTotalCount=project.rows[0].total_task_count;
                            console.log('taskTotalCount')
                            console.log(taskTotalCount)

                            // let percent_completed = 0;
                            // if (taskTotalCount > 0) {
                            //   percent_completed = parseInt((parseInt(project.rows[0].total_completed_task_count) / parseInt(taskTotalCount)) * 100);
                            // }
                            // if (project.rows[0].percent_completed != percent_completed) {
                            //   project.rows[0].percent_completed = percent_completed;
                            //   client.query('update project set percent_completed=$1 where id=$2 and company_id=$3', [parseInt(percent_completed), req.query.projectId, req.user.company_id], (err, updatedProjects) => {
                            //     if (err) {
                            //       console.error(err);
                            //       handleResponse.shouldAbort(err, client, done);
                            //       handleResponse.responseToPage(res, 'pages/project-details', { project: {}, userRoleList: [], tasks: [], accounts: [], userList: [], resUsers: [], user: req.user, error: err }, "error", " Error in updating project percentage");
                            //     }
                            //   })
                            // }
                        }
                        console.log('sorted task array')
                        console.log(taskSortedArr);
                        client.query('SELECT * FROM ACCOUNT where company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, accountList) {
                          if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding account data");
                            /*handleResponse.handleError(res, err, ' Error in finding account data');*/
                          } else {
                            client.query('SELECT id,email, role, user_role, first_name, last_name, bill_rate, cost_rate FROM USERS WHERE company_id=$1 AND archived=$2', [req.user.company_id, false], function (err, userList) {
                              if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding user data");
                                /*handleResponse.handleError(res, err, ' Error in finding user data');*/
                              } else {
                                // // console.log("----userList--------");
                                // // console.log(userList.rows);
                                client.query('SELECT u.id, u.first_name, u.last_name, u.email, pa.user_role as role, pa.bill_rate, pa.cost_rate, pa.id as assinment_id from PROJECT_ASSIGNMENT pa INNER JOIN users u ON pa.user_id = u.id AND pa.company_id = u.company_id AND u.archived = $1 AND pa.project_id = $2  ORDER BY u.email, pa.user_role', [false, req.query.projectId], function (err, resUsers) {
                                  if (err) {
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding user data");
                                    /*handleResponse.handleError(res, err, ' Error in finding user data');*/
                                  } else {
                                    console.log('res users')
                                    console.log(resUsers.rows);
                                    client.query('SELECT user_role FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, userRoleData) {
                                      if (err) {
                                        console.error(err);
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding user role for the company");
                                      }
                                      else {

                                          let userRole=['Manager'];
                                          if(userRoleData.rows.length>0){
                                              userRole=userRoleData.rows[0].user_role;
                                          }
                                          let userRoleList = userList.rows.concat(resUsers.rows).sort(function(a,b){return (a.email>b.email)-(a.email<b.email)})
                                          client.query('SELECT id,message,modified_date,resource_id,(SELECT email from users where id = resource_id) as email , (SELECT first_name from users where id = resource_id) as first_name , (SELECT last_name from users where id = resource_id) as last_name , (Select count(id) from PROJECT_COMMENT where parent_id = pc.id) as responseCount FROM PROJECT_COMMENT pc WHERE company_id = $1 AND project_id = $2 AND type = $3 AND parent_id IS NULL ORDER BY modified_date desc', [req.user.company_id,req.query.projectId,"Conversation"], function (err, projectConversationThread) {
                                            if (err) {
                                              console.error(err);
                                              handleResponse.shouldAbort(err, client, done);
                                              handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding user role for the company");
                                            }
                                            else {
                                              projectConversationThread.rows.forEach(data=>{
                                                  data.modified_date = moment.tz(data.modified_date, companyDefaultTimezone).format('MM-DD-YYYY hh:mm:ss');
                                              })
                                              // console.log('projectConversationThread')
                                              // console.log(projectConversationThread.rows)
                                              done();
                                              handleResponse.responseToPage(res,'pages/project-details',{ project: project.rows[0], userRoleList:userRole ,tasks: taskSortedArr, accounts: accountList.rows, userList: userList.rows, user: req.user, resUsers: resUsers.rows ,taskTotalCount:taskTotalCount,currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD'),stripeCustomerId:result.stripe_customer_id,"projectConversationThread":projectConversationThread.rows },"success","Successfully rendered");
                                              /*res.render('pages/project-details', { project: project.rows[0], tasks: taskList.rows, accounts: accountList.rows, userList: userList.rows, user: req.user, error: err, resUsers: resUsers.rows });*/
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
                    })
                  }
                }
              })
            });
          }
        }
      });

};

exports.getAddProject = (req, res) => {
  handleResponse.responseToPage(res,'component/addProject',{},"success","Successfully rendered");
  /*res.render('component/addProject', {
    title: 'Add Project'
  });*/
};

exports.getEditProject = (req, res) => {

};


exports.postEditProject = (req, res) => {
  // console.log(req.body);
  // req.assert('project-title', 'Name cannot be blank').notEmpty();
  // const errors = req.validationErrors();

  // if (errors) {
  //   handleError(res, errors, errors);
  // }

  // console.log(req.body.projectId);
  // console.log(req.user.company_id);
  let project_cost = 0;
  if(req.body.projectData.project_type == "fixed_fee") {
    project_cost = parseFloat(req.body.projectData.project_cost);
  }
  if (req.user) {
    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' error in connecting to database');
        } else {
          client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.total_hours ,p.billable ,p.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,p.status ,p.include_weekend ,p.description ,p.percent_completed ,p.estimated_hours ,p.global_project ,p.completed ,p.company_id ,p.archived ,p.account_id ,p.isglobal ,p.project_cost ,p.record_id FROM PROJECT p where id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, project) {
            if (err) {
              console.error(err);
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in finding project data');
            } else {
              // console.log('getProject>>>>>>>>>>>>>');
              // console.log(project.rows[0]);
              var projectStatus = req.body.projectData.project_status;
              var projectPer = req.body.projectData.project_complete_per?req.body.projectData.project_complete_per:0;
              if('Completed' === projectStatus){
                projectPer = 100;
              } else if(projectPer >= 100) {
                projectPer = 100;
                projectStatus = 'Completed';
              }
              let start_date = null;
              let end_date = null;
              if(req.body.projectData.start_date) {
                console.log(req.body.projectData.start_date);
                start_date = moment.tz(req.body.projectData.start_date, companyDefaultTimezone).format();
                // start_date = dateFormat(req.body.projectData.start_date);
              }
              if(req.body.projectData.end_date) {
                console.log(req.body.projectData.end_date);
                end_date = moment.tz(req.body.projectData.end_date, companyDefaultTimezone).format();
                // end_date = dateFormat(req.body.projectData.start_date);
              }

              // client.query('UPDATE PROJECT SET name=$1, start_date=$2, end_date=$3, billable=$4, status=$5, description=$6, global_project=$7,  account_id=$10, type=$11, project_cost=$12 WHERE id=$8 AND company_id=$9', [req.body.projectData.project_title, start_date, end_date, req.body.projectData.billable, projectStatus, req.body.projectData.project_desc, req.body.projectData.global_project, req.body.projectId, req.user.company_id, req.body.projectData.account, req.body.projectData.project_type, project_cost], function (err, updatedData) {
              // console.log(start_date +' ************* '+ end_date);
              client.query('UPDATE PROJECT SET name=$1, start_date=$2, end_date=$3, billable=$4, status=$5, description=$6, global_project=$7, percent_completed=$8, account_id=$11, type=$12, project_cost=$13 WHERE id=$9 AND company_id=$10', [req.body.projectData.project_title, start_date, end_date, req.body.projectData.billable, projectStatus, req.body.projectData.project_desc, req.body.projectData.global_project, projectPer, req.body.projectId, req.user.company_id, req.body.projectData.account, req.body.projectData.project_type, project_cost], function (err, updatedData) {
                // console.log('Error >>>>>>>>>>>>>');
                // console.log(err);
                if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in updating project data');
                } else {
                  client.query('COMMIT', (err) => {
                    if (err) {
                      // console.log('Error committing transaction', err.stack)
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in committing transaction');
                    } else {
                      done();
                      // console.log('Updated project >>>>>>>>>>>>>');
                      // console.log(updatedData);
                      handleResponse.sendSuccess(res,'Project updated successfully.',{});
                      /*res.status(200).json({ "success": true, "message": "success" });*/
                    }
                  })
                }
              });
            }
          })
        }
      })
    });
  } else {
    done();
    res.redirect('/domain');
  }
};


exports.postAddProject = (req, res) => {
  // console.log("Inside add project post method");
  // console.log(req.body);
  if (req.user) {
    let project_name = req.body.title;
    //req.assert('new-project-title', 'Project Name cannot be blank').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
      if(errors.length>0){
            // console.log(errors[0].msg);
            handleResponse.handleError(res, errors, ""+errors[0].msg);
          }else{
             handleResponse.handleError(res, errors, " Error in validating data.");
          }
    }
    else {
      let project_desc = req.body.description;
      let project_type = req.body.type;
      var start_date = null;
      if (req.body.startDate != null && req.body.startDate != '') {
        req.body.startDate = req.body.startDate.split('T')[0];
        start_date = moment.tz(req.body.startDate, companyDefaultTimezone).format();
        console.log(req.body.startDate+ ' ' +start_date);
      }
      var end_date = null;
      if (req.body.endDate != null && req.body.endDate != '') {
        // end_date = req.body.endDate;
        req.body.endDate = req.body.endDate.split('T')[0];
        end_date = moment.tz(req.body.endDate, companyDefaultTimezone).format();
        console.log(req.body.endDate + ' '+end_date);
      }
      var billable = req.body.isBillable;
      var total_hours = 0;
      var include_weekend = false;
      var completion_date = null;
      var complete_per = 0;
      var estimate_hours = 100;
      var global_project = false;
      var completed = false;

      // let newDate= moment.tz(new Date(), companyDefaultTimezone).format();
      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in connecting to the database');
          } else {
            client.query('SELECT * FROM PROJECT where company_id = $1 AND name = $2', [req.user.company_id, project_name], function (err, existingProject) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding project data');
              } else {
                // console.log("existingProject-----------");
                // console.log(existingProject);

                if (existingProject.rows.length > 0) {
                  done();
                  handleResponse.handleError(res, 'Project adding error', ' Project with this name already exists.');
                } else {
                  client.query('Insert INTO PROJECT (name,description,type, start_date, end_date, total_hours, billable, completion_date, include_weekend, percent_completed, estimated_hours, global_project, completed, company_id, account_id, project_cost) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id', [project_name, project_desc, project_type, start_date, end_date, total_hours, billable, completion_date, include_weekend, complete_per, estimate_hours, global_project, completed, req.user.company_id, req.body.accountId, req.body.project_cost], function (err, insertedProject) {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in adding project data to the database');
                    } else {
                      client.query('Insert INTO PROJECT_ASSIGNMENT (company_id,account_id,user_id, project_id, created_by, bill_rate, cost_rate, user_role, created_date, updated_date) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [req.user.company_id, req.body.accountId, req.user.id, insertedProject.rows[0].id, req.user.id, req.user.bill_rate, req.user.cost_rate, req.user.role, 'now()', 'now()'], function (err, createdProjectAssignment) {
                        if (err) {
                          console.error('Error committing transaction', err.stack);
                          handleResponse.handleError(res, err, ' Error in committing transaction');
                        } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              console.error('Error committing transaction', err.stack);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
                              done();
                              handleResponse.sendSuccess(res,'Project added successfully.',{"projectId": insertedProject.rows[0].id});
                              /*res.status(200).json({ "success": true, "projectId": insertedProject.rows[0].id, "message": "success" });*/
                            }
                          });
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
    }
  } else {
    res.redirect('/domain');
  }

};
exports.deleteProject = (req, res) => {

  // console.log('Archived Project-------------' + req.query.projectId);
  if (req.user) {
    let projectId = req.body.projectId;
    if (projectId == '' || projectId == null || projectId == undefined) {
      handleResponse.handleError(res, "incorrect project id", " Project id is not correct");
    } else {
      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' error in connecting to database');
          } else {
            // console.log("req.body.projectId");
            // console.log(req.body.projectId);
            client.query('UPDATE PROJECT SET archived = $1 WHERE id=$2', [true, req.body.projectId], function (err, archivedProject) {
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in deleting project.');
              } else {
                client.query('COMMIT', (err) => {
                  if (err) {
                    // console.log('Error committing transaction', err.stack)
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in committing transaction');
                  } else {
                    console.error('Affected ID>>>>>>>>>>>>>');
                    // console.log(archivedProject.rows[0]);
                    done();
                    handleResponse.sendSuccess(res,'Project deleted successfully.',{});
                    /*res.status(200).json({ "success": true, "message": "success" });*/
                  }
                })
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
}


exports.checkAndCreateProjectAssignment = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
        let extraParams = {};
        extraParams.project_id = req.body.project_id;
        extraParams.assigned_user = req.user.id;
        extraParams.user_role = req.body.user_role;
        commonController.checkProjectAssignment(req, client, err, done, extraParams, res, function (response) {
          if(!response) {
            client.query('SELECT account_id FROM PROJECT where id=$1 AND company_id=$2', [req.body.project_id, req.user.company_id], function (err, projectDetail) {
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in adding timesheet row.');
              } else {
                extraParams.account_id = projectDetail.rows[0].account_id;
                commonController.createProjectAssignment(req, client, err, done, extraParams, req.user.bill_rate, req.user.cost_rate, res, function (response2) {
                  let userData = {};
                  // userData.userEmail = req.user.email;
                  // req.body.userData = userData;
                  // commonController.createTaskAssignment(req, client, err, done, req.body.task_id, req.user.bill_rate, req.user.cost_rate, extraParams, res, function (response3) {
                    client.query('COMMIT', (err) => {
                      if (err) {
                        // console.log('Error committing transaction', err.stack)
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in committing transaction');
                      } else {
                        done();
                        handleResponse.sendSuccess(res,'Assignment created successfully.',{});
                      }
                    })
                  // });
                })
              }
            });
           } else {
              done();
              handleResponse.sendSuccess(res,'Assignment created successfully.',{});
            }

          // } else {
          //   extraParams.task_id = req.body.task_id;
          //   commonController.checkTaskAssignment(req, client, err, done, extraParams, res, function (response) {
          //     if(!response) {
          //       let userData = {};
          //       userData.userEmail = req.user.email;
          //       req.body.userData = userData;
          //       commonController.createTaskAssignment(req, client, err, done, req.body.task_id, req.user.bill_rate, req.user.cost_rate, extraParams, res, function (response3) {
          //         client.query('COMMIT', (err) => {
          //           if (err) {
          //             // console.log('Error committing transaction', err.stack)
          //             handleResponse.shouldAbort(err, client, done);
          //             handleResponse.handleError(res, err, ' Error in committing transaction');
          //           } else {
          //             done();
          //             handleResponse.sendSuccess(res,'Assignment created successfully.',{});
          //           }
          //         })
          //       });
          //     } else {
          //       done();
          //       handleResponse.sendSuccess(res,'Assignment created successfully.',{});
          //     }
          //   });
          // }
        });
      }
    });
  });
}

