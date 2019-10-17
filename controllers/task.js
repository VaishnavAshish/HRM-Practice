const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const commonController = require('./common-functions');
const jsonexport = require('jsonexport');
let companyDefaultTimezone;
// common-functions.js
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
//   // console.log('Date format called');
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
//   // console.log('Date format returned');
//   return formatedDate;
// }

exports.generateTaskCsv = (req, res) => {

  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
          handleResponse.handleError(res, err, ' error in finding company setting');
     }else{
         companyDefaultTimezone=result.timezone;

         pool.connect((err, client, done) => {
           client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.billable_hours ,t.milestone ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date,t.project_name ,t.record_id FROM TASK t where project_id=$1 AND company_id=$2 AND archived=$3', [req.params.projectId, req.user.company_id,false], function (err, tasks) {
             if (err) {
               handleResponse.shouldAbort(err, client, done);
               handleResponse.handleError(res, err, ' Error in finding task data');
             } else {
              //  console.log('---------task.rows---------');
              //  console.log(tasks.rows);
               done();
               if(tasks.rowCount>0){
                   jsonexport(tasks.rows,function(err, csv){
                       if(err) {
                         console.log('err');
                         console.log(err);
                         handleResponse.handleError(res, err, "Server Error: Error in creating csv file");
                       }
                      //  console.log(csv);
                       res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'task-' + Date.now() + '.csv\"');
                       res.writeHead(200, {
                         'Content-Type': 'text/csv'
                       });
                       res.end(csv);
                   });
               }else{
                  handleResponse.handleError(res, err, ' No Task Found');
               }

             }
           });
         })
       }
     });

}

exports.loadMoreTasks = (req,res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
    if(err==true){
      handleResponse.handleError(res, err, ' error in finding company setting');
    }else{
      companyDefaultTimezone=result.timezone;
    pool.connect((err, client, done) => {
      var fetch_sort_order_qry=fetch_sort_order_param=obj_name='';
      if(req.body.isSubtask){
        fetch_sort_order_qry = 'select subtask_sort_order as task_sort_order from task where id = $1';
        fetch_sort_order_param = [req.body.parentId];
        obj_name = 'Subtask';
      }else{
        fetch_sort_order_qry = 'select task_sort_order from project where id = $1';
        fetch_sort_order_param = [req.body.project_id];
        obj_name = 'Task';
      }
      client.query(fetch_sort_order_qry, fetch_sort_order_param, (err, task_sort_order) => {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding task sort order');
        } else {
          if(task_sort_order.rows[0].task_sort_order==null){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in finding task sort order');
          }
          let en = parseInt(req.body.offset)+parseInt(process.env.PAGE_RECORD_NO);
          let splitt = task_sort_order.rows[0].task_sort_order.split(',',en);
          var filtered = splitt.filter(function(value, index, arr){
            return index > (parseInt(req.body.offset)-1);
          });
          let requiredIDs = filtered.join(',');

          client.query('SELECT distinct on (task_id) task_id, user_email, updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date FROM TASK_ASSIGNMENT WHERE project_id=$1 AND company_id=$2 order by task_id, updated_date desc', [req.body.project_id, req.user.company_id], function (err, taskAssList) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in finding task data');
            } else {
              let queryToExec=`SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone '${companyDefaultTimezone}' as start_date ,t.end_date at time zone '${companyDefaultTimezone}' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone '${companyDefaultTimezone}' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone '${companyDefaultTimezone}' as created_date ,t.updated_date at time zone '${companyDefaultTimezone}' as updated_date ,t.archived ,t.record_id
              FROM task t
              WHERE id in(${requiredIDs})
              ORDER BY position(id::text in '${requiredIDs}')`;
              client.query(queryToExec,[], function (err, tasks) {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding task data');
                }
                else{
                  let searchCount=0;
                  if (tasks.rows.length > 0) {
                    tasks.rows.forEach(function (data, index) {
                      let startDateFormatted = (data.start_date==null)?'':moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                      let endDateFormatted = (data.end_date==null)?'':moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                      // let startDateFormatted = (data.start_date==null)?'':dateFormat(data.start_date);
                      // let endDateFormatted = (data.end_date==null)?'':dateFormat(data.end_date);
                      data["startDateFormatted"] = startDateFormatted;
                      data["endDateFormatted"] = endDateFormatted;
                      taskAssList.rows.filter(function (taskAssignment) {
                        if(taskAssignment.task_id == data.id) {
                          data["user_email"] = taskAssignment.user_email;
                        }
                      });
                      if(tasks.rows.length == (index + 1)) {
                        searchCount=tasks.rows[0].searchcount;
                        // console.log("tasks.rows");
                        // console.log(tasks.rows);
                        done();
                        handleResponse.sendSuccess(res,obj_name+' searched successfully',{tasks: tasks.rows,count:task_sort_order.rows[0].task_sort_order.split(',').length});
                      }
                    });
                  } else {
                    done();
                    handleResponse.sendSuccess(res,obj_name+' searched successfully',{tasks: tasks.rows,count:task_sort_order.rows[0].task_sort_order.split(',').length});
                  }
                }
              })
            }
          })

        }
      })
    })
  }
})
}



exports.findTaskByName = (req, res) => {
  // console.log("findAccountByName----------------------------------"+req.body.searchText);
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');
      }else{

        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
      pool.connect((err, client, done) => {
          let offset=0;
          let queryToExec,queryParam;
          if(req.body.offset){
            offset=req.body.offset;
          }
          if(req.body.isSubtask && req.body.isSubtask==true){
            queryToExec='SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id,(SELECT count(*) FROM TASK WHERE '+req.body.searchField+' ilike $1 AND company_id=$2 AND project_id=$3 AND parent_id=$4 AND archived=false) as searchcount FROM task t WHERE '+req.body.searchField+
            ' ilike $1 AND company_id=$2 AND project_id=$3 AND parent_id=$4 AND archived=false ORDER BY id,project_id,start_date DESC,name OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
            queryParam=['%'+req.body.searchText+'%',req.user.company_id,req.body.project_id,req.body.parentId];
          }else{
            queryToExec='SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id,(SELECT count(*) FROM TASK WHERE '+req.body.searchField+' ilike $1 AND company_id=$2 AND project_id=$3 AND archived=false) as searchcount FROM task t WHERE '+req.body.searchField+
            ' ilike $1 AND company_id=$2 AND project_id=$3 AND archived=false ORDER BY id,project_id,start_date DESC,name OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
            queryParam=['%'+req.body.searchText+'%',req.user.company_id,req.body.project_id];
          }
          
          // console.log('queryToExec '+queryToExec+' '+'%'+req.body.searchText+'%'+' '+req.user.company_id+' '+req.body.project_id);
          client.query(queryToExec,queryParam, function (err, tasks) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in finding task data');
            }
            else{
              client.query('SELECT distinct on (task_id) task_id, user_email, updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date FROM TASK_ASSIGNMENT WHERE project_id=$1 AND company_id=$2 order by task_id, updated_date desc', [req.body.project_id, req.user.company_id], function (err, taskAssList) {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding task data');
                } else {
                  // console.log(JSON.stringify(tasks.rows));
                  let searchCount=0;
                  if (tasks.rows.length > 0) {
                    tasks.rows.forEach(function (data, index) {
                      let startDateFormatted = (data.start_date==null)?'':moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                      let endDateFormatted = (data.end_date==null)?'':moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                      // let startDateFormatted = (data.start_date==null)?'':dateFormat(data.start_date);
                      // let endDateFormatted = (data.end_date==null)?'':dateFormat(data.end_date);
                      data["startDateFormatted"] = startDateFormatted;
                      data["endDateFormatted"] = endDateFormatted;
                      taskAssList.rows.filter(function (taskAssignment) {
                        if(taskAssignment.task_id == data.id) {
                          data["user_email"] = taskAssignment.user_email;
                        }
                      });
                      if(tasks.rows.length == (index + 1)) {
                        searchCount=tasks.rows[0].searchcount;
                        // console.log("tasks.rows");
                        // console.log(tasks.rows);
                        done();
                        handleResponse.sendSuccess(res,'Tasks searched successfully',{tasks: tasks.rows,count:searchCount});
                      }
                    });
                  } else {
                    done();
                    handleResponse.sendSuccess(res,'Tasks searched successfully',{tasks: tasks.rows,count:searchCount});
                  }
                }
              });
            }
          });
        })
      }
    });
};

exports.postAddTask = (req, res) => {

 setting.getCompanySetting(req, res ,(err,result)=>{
    if(err==true){
      // console.log('error in setting');
      // console.log(err);
      handleResponse.handleError(res, err, ' Error in finding company setting');
      /*handleResponse.handleError(res, err, ' error in finding company setting');*/
    } else {
      companyDefaultTimezone=result.timezone;
      // var today = moment.tz(new Date(), companyDefaultTimezone).format('Y-MM-DD');
      // var dd = parseInt(moment.tz(new Date(), companyDefaultTimezone).format('D'));
      // var mm = parseInt(moment.tz(new Date(), companyDefaultTimezone).format('M')); //January is 0!
      // var yyyy = parseInt(moment.tz(new Date(), companyDefaultTimezone).format('Y'));
      console.log('req.body.taskData.start_date');
      console.log('req.body.taskData.end_date');
      // req.body.taskData.start_date = moment.tz(req.body.taskData.start_date.split('T')[0], companyDefaultTimezone).format();
      // req.body.taskData.due_date = moment.tz(req.body.taskData.due_date.split('T')[0], companyDefaultTimezone).format();
      console.log(typeof req.body.taskData.start_date);
      console.log(req.body.taskData.start_date!=' ');
      // console.log(req.body.taskData.due_date);
      if (req.body.taskData.start_date!=null && req.body.taskData.start_date!='') {
        req.body.taskData.start_date = moment.tz(req.body.taskData.start_date.split('T')[0], companyDefaultTimezone).format();
      }else{
        req.body.taskData.start_date=null;
      }
      if (req.body.taskData.due_date!=null && req.body.taskData.due_date!='') {
        req.body.taskData.due_date = moment.tz(req.body.taskData.due_date.split('T')[0], companyDefaultTimezone).format();
      }else{
        req.body.taskData.due_date=null;
      }
      console.log(req.body.taskData.start_date);
      // if (!req.body.taskData.start_date) {
      //   req.body.taskData.start_date = null;
      // }
      // if (!req.body.taskData.due_date) {
      //   req.body.taskData.due_date = null;
      // }
      // if (!req.body.taskData.estimate_hours) {
      //   req.body.taskData.estimate_hours = 0;
      // }

      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' error in connecting to database');
          } else {
            // console.log("Project Id");
            // console.log(req.body.projectId);
            client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id FROM TASK t where name=$1 AND company_id=$2 AND project_id=$3', [req.body.taskData.task_name, req.user.company_id, req.body.projectId], function (err, taskList) {
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding task data');
              } else {
                if (taskList.rows.length > 0) {
                  done();
                  handleResponse.handleError(res,"Task with same name already exist","Task with same name already exist");
                } else {
                  let reqData = {};
                  createTaskRecord(req, client, err, done, req.body.isSubtask,req.body.userData.assignment_id, res, function (result) {
                    var reqData = req.body.taskData;
                    reqData.project_id = req.body.projectId;
                    console.log('req.body.taskData.assigned_user')
                    console.log(req.body.taskData.assigned_user)

                    if(req.body.taskData.assigned_user) {
                      commonController.createTaskAssignment(req, client, err, done, result, req.body.userData.billRate, req.body.userData.costRate, reqData,res, function (result2) {
                         if(result2) {
                           client.query('COMMIT', (err) => {
                             if (err) {
                               // console.log('Error committing transaction', err.stack)
                               handleResponse.shouldAbort(err, client, done);
                               handleResponse.handleError(res, err, ' Error in committing transaction');
                             } else {
                                done();
                                handleResponse.sendSuccess(res,'Task added successfully',{});
                             }
                           })
                           // done();
                           // handleResponse.sendSuccess(res,'Task added successfully',{});
                         }
                       });
                    } else {
                      client.query('COMMIT', (err) => {
                        if (err) {
                          // console.log('Error committing transaction', err.stack)
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in committing transaction');
                        } else {
                           done();
                           handleResponse.sendSuccess(res,'Task added successfully',{});
                        }
                      })
                    }
                  });

                  // var reqData = req.body.taskData;
                  // reqData.project_id = req.body.projectId;
                  // if(req.body.taskData.assigned_user) {
                  //   commonController.checkProjectAssignment(req, client, err, done, reqData, res, function (result) {
                  //     // console.log("Project Assignment Result");
                  //     // console.log(result);
                  //     reqData.companyDefaultTimezone = companyDefaultTimezone;
                  //     if(!result) {
                  //       commonController.createProjectAssignment(req, client, err, done, reqData, req.body.taskData.res_bill_rate, req.body.taskData.res_cost_rate, res, function (result1){
                  //         reqData.assigned_user_id = result1.id;
                  //         createTaskRecord(req, client, err, done, reqData, res, function (taskId) {
                  //           commonController.createTaskAssignment(req, client, err, done, taskId, req.body.taskData.res_bill_rate, req.body.taskData.res_cost_rate, reqData, res, function (result2) {
                  //             if(result2) {
                  //               done();
                  //               handleResponse.sendSuccess(res,'Task added successfully',{});
                  //             }
                  //           });
                  //         });
                  //       });
                  //     } else {
                  //       /* commonController.checkTaskAssignment(req, client, err, done, reqData, res, function (isTaskAssignment) {
                  //         if(!isTaskAssignment) {
                  //
                  //         }
                  //       }); */
                  //       reqData.assigned_user_id = parseInt(result.id);
                  //       createTaskRecord(req, client, err, done, reqData, res, function (taskId) {
                  //         commonController.createTaskAssignment(req, client, err, done, taskId, req.body.taskData.res_bill_rate, req.body.taskData.res_cost_rate, reqData, res, function (result2) {
                  //           if(result2) {
                  //             done();
                  //             handleResponse.sendSuccess(res,'Task added successfully',{});
                  //           }
                  //         });
                  //       });
                  //     }
                  //   });
                  // } else {
                  //   reqData.assigned_user_id = null;
                  //   createTaskRecord(req, client, err, done, reqData, res, function (result) {
                  //     done();
                  //     handleResponse.sendSuccess(res,'Task added successfully',{});
                  //   });
                  // }
                }
              }
            });
          }
        })
      });
    }
  });
};



function createTaskRecord(req, client, err, done, isSubtask,assigned_user_id, res, callback) {
  let insertQry = insertQryParam ='';
  if(isSubtask){
    insertQry = 'Insert INTO TASK (project_id, name, start_date, end_date, estimated_hours, description, company_id, percent_completed, status, billable,project_name, assigned_user_id, parent_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id';
    insertQryParam = [req.body.projectId, req.body.taskData.task_name, req.body.taskData.start_date, req.body.taskData.due_date, req.body.taskData.estimate_hours, req.body.taskData.task_desc, req.user.company_id, 0, 'Not Started', req.body.taskData.billable, req.body.projectName,assigned_user_id,req.body.parent_id];
  }else{
    insertQry ='Insert INTO TASK (project_id, name, start_date, end_date, estimated_hours, description, company_id, percent_completed, status, billable,project_name, assigned_user_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id';
    insertQryParam = [req.body.projectId, req.body.taskData.task_name, req.body.taskData.start_date, req.body.taskData.due_date, req.body.taskData.estimate_hours, req.body.taskData.task_desc, req.user.company_id, 0, 'Not Started', req.body.taskData.billable, req.body.projectName,assigned_user_id];
  }
  client.query(insertQry,insertQryParam , function (err, insertedTask) {
    if(err) {
      handleResponse.shouldAbort(err, client, done);
      handleResponse.handleError(res, err, ' Error in adding task to the database');
    } else {
      let taskSortQry = taskSortParam = '';
      if(isSubtask){
        taskSortQry = 'UPDATE Task SET subtask_sort_order = (CASE WHEN subtask_sort_order IS NULL THEN $1 ELSE subtask_sort_order || $2 END) WHERE id=$3';
        taskSortParam = [insertedTask.rows[0].id,','+insertedTask.rows[0].id,req.body.parent_id];
      }else{
        taskSortQry = 'UPDATE Project p SET task_sort_order = (CASE WHEN task_sort_order IS NULL THEN $1 ELSE p.task_sort_order || $2 END) WHERE id=$3';
        taskSortParam = [insertedTask.rows[0].id,','+insertedTask.rows[0].id,req.body.projectId];
      }
      client.query(taskSortQry,taskSortParam, function (err, updatedProjectWithSortOrder) {
        if(err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in adding updating task sort order to the database');
        } else {
          return callback(insertedTask.rows[0].id);
        }
      });
      //return callback(insertedTask.rows[0].id);
    }
  });
}


function updateTaskRecord(req, client, err, done, res, taskData, callback) {
  // let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
  let start_date = null;
  let end_date = null;
  if(req.body.taskDetails.start_date) {
    start_date = moment.tz(req.body.taskDetails.start_date, companyDefaultTimezone).format()
    console.log(req.body.taskDetails.start_date+' '+start_date);
    // start_date = req.body.taskDetails.start_date;
  }
  if(req.body.taskDetails.end_date) {
    end_date = moment.tz(req.body.taskDetails.end_date, companyDefaultTimezone).format()
    console.log(req.body.taskDetails.end_date+' '+end_date);
    // end_date = req.body.taskDetails.end_date;
  }
  if(req.body.taskDetails.task_complete_per == ''){
    req.body.taskDetails.task_complete_per = 0;
  }
  console.log('taskData.assigned_user_id')
  console.log(taskData.assigned_user_id)
  client.query('UPDATE TASK SET name=$1, start_date=$2, end_date=$3, billable=$4, status=$5, description=$6, estimated_hours=$7, priority=$8, updated_date=$9, assigned_user_id=$12 , percent_completed=$13 WHERE id=$10 AND company_id=$11 RETURNING *', [req.body.taskDetails.title, start_date, end_date, req.body.taskDetails.billable, req.body.taskDetails.status, req.body.taskDetails.description, req.body.taskDetails.estimated_hours, req.body.taskDetails.priority, 'now()', req.body.taskDetails.taskId, req.user.company_id, taskData.assigned_user_id, req.body.taskDetails.task_complete_per], function (err, updatedData) {
    if (err) {
      console.error(err);
      handleResponse.shouldAbort(err, client, done);
      handleResponse.handleError(res, err, ' Error in updating task.');
    } else {
      // client.query('select (SELECT count(id) from task where project_id = $1 AND status = $2) as total_completed_task_count ,(select count(id) from task where project_id=$1) as total_project_task from project where id=$1', [req.body.taskDetails.project_id, "Completed"], (err, taskProjectDetails) => {
      //   if (err) {
      //     console.error(err);
      //     handleResponse.shouldAbort(err, client, done);
      //     handleResponse.handleError(res, err, ' Error in fetching project task details.');
      //   }
      //   else {
      //     let percent_completed = 0;
      //     if (taskProjectDetails.rows[0].total_project_task > 0) {
      //       percent_completed = (parseInt(taskProjectDetails.rows[0].total_completed_task_count) / parseInt(taskProjectDetails.rows[0].total_project_task)) * 100;
      //     }
      //     client.query('update project set percent_completed=$1 where id=$2', [percent_completed, req.body.taskDetails.project_id], (err, updatedProject) => {
      //       if (err) {
      //         console.error(err);
      //         handleResponse.shouldAbort(err, client, done);
      //         handleResponse.handleError(res, err, ' Error in updating project.');
      //       }
      //     });
      //   }
      // })
      console.log('updated task record')
      console.log(updatedData.rows[0]);
      return callback(updatedData.rows[0].id);
    }
  });
}


exports.getTaskDetails = (req, res) => {

  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,hierarchyData:[]},"error"," error in finding company setting");
        /*handleResponse.handleError(res, err, ' error in finding company setting');*/
      }else{

        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
          if (req.query.taskId != '' && req.query.taskId != undefined && req.query.taskId != null) {
            pool.connect((err, client, done) => {
              client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,(select name from project where id=t.project_id) as project_name, (select account_id from project where id=t.project_id) as account_id ,t.record_id,t.subtask_sort_order, (select count(id) from task where parent_id = t.id and archived = false) as totalSubtasksCount,(select billable from project where id = t.project_id) FROM TASK t where id=$1 AND company_id=$2', [req.query.taskId, req.user.company_id], function (err, taskDetail) {
                if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,hierarchyData:[]},"error"," Error in finding task data");
                  /*handleResponse.handleError(res, err, ' Error in finding task data');*/
                } else {

                  if(taskDetail.rows.length>0){
                      let taskId=taskDetail.rows[0].id;
                      client.query('SELECT ta.id ,ta.company_id ,ta.project_id ,ta.user_id ,ta.created_by ,ta.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,ta.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,ta.account_id ,ta.task_id ,ta.user_email ,ta.bill_rate ,ta.cost_rate ,ta.user_role ,ta.record_id FROM TASK_ASSIGNMENT ta where task_id=$1 AND company_id=$2', [req.query.taskId, req.user.company_id], function (err, taskAssignDetail) {
                      if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,hierarchyData:[]},"error"," Error in finding task data");
                        /*handleResponse.handleError(res, err, ' Error in finding task data');*/
                      } else {
                          client.query('SELECT id,email,bill_rate,cost_rate, role as user_role,first_name,last_name FROM USERS WHERE id NOT IN (SELECT user_id FROM PROJECT_ASSIGNMENT WHERE project_id=$1) AND company_id=$2 AND archived=$3', [taskDetail.rows[0].project_id,req.user.company_id,false], function (err, userList) {
                            if (err) {
                              console.error(err);
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,project : {},taskTotalCount:taskDetail.rows[0].totalsubtaskscount,hierarchyData:[]},"error"," Error in finding users data");
                            } else {
                              client.query('SELECT u.id, u.email,u.first_name, u.last_name, pa.bill_rate, pa.cost_rate, pa.user_role, pa.id as assignment_id from PROJECT_ASSIGNMENT pa INNER JOIN users u ON pa.user_id = u.id AND pa.company_id = u.company_id AND u.archived = $1 AND pa.project_id = $2', [false, taskDetail.rows[0].project_id], function (err, resList) {
                                if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,project : {},taskTotalCount:taskDetail.rows[0].totalsubtaskscount,hierarchyData:[]},"error"," Error in finding users data");
                                } else {
                                    // console.log("taskDetail");
                                    // console.log(taskDetail);
                                    done();
                                    let userListCombined=[];
                                    // let startDateFormatted = dateFormat(moment.tz(taskDetail.rows[0].start_date, companyDefaultTimezone).format());
                                    // let endDateFormatted = dateFormat(moment.tz(taskDetail.rows[0].end_date, companyDefaultTimezone).format());

                                    let startDateFormatted = taskDetail.rows[0].start_date;
                                    if(taskDetail.rows[0].start_date != null) {
                                      startDateFormatted = dateFormat(taskDetail.rows[0].start_date);
                                    }
                                    let endDateFormatted = taskDetail.rows[0].end_date;
                                    if(taskDetail.rows[0].end_date != null) {
                                      endDateFormatted = dateFormat(taskDetail.rows[0].end_date);
                                    }
                                    taskDetail.rows[0]["startDateFormatted"] = startDateFormatted;
                                    taskDetail.rows[0]["endDateFormatted"] = endDateFormatted;
                                    taskDetail.rows[0]["user_id"] = null;
                                    taskDetail.rows[0]["user_email"] = null;
                                    console.log('required details')
                                    //console.log( taskDetail.rows[0].assigned_user_id)
                                    //console.log( taskAssignDetail.rows[0].user_id)
                                    if(taskAssignDetail.rows.length>0 && taskDetail.rows[0].assigned_user_id != null){
                                      taskDetail.rows[0]["user_id"] = taskAssignDetail.rows[0].user_id;
                                      taskDetail.rows[0]["user_email"] = taskAssignDetail.rows[0].user_email;
                                    }
                                    /*if(userList.rows.length>0){
                                        userListCombined=userListCombined.concat(userList.rows);
                                    }*/
                                    if(resList.rows.length>0){
                                        userListCombined=userListCombined.concat(resList.rows);
                                    }
                                    /*taskDetail.rows[0]["project_name"] = req.query.project;*/
                                    // console.log('>>>>>>>>>>>>>>>>>> Task List <<<<<<<<<<<<<<<<<<');
                                    // console.log(userListCombined);

                                    let hierarchyQry=`with recursive getParent as (
                                      select * from task where id = ${req.query.taskId} union all select task.* from task 
                                        join getParent on getParent.parent_id = task.id
                                      )
                                      select * from getParent order by id`;

                                  client.query(hierarchyQry, [], (err, hierarchyData) => {
                                    if (err) {
                                      console.error(err);
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.responseToPage(res, 'pages/task-details', { taskDetails: {}, userList: [], user: req.user, error: err ,hierarchyData:[]}, "error", " Error in finding Subtasks");
                                    } else {
                                      
                                      let requiredSubtasks = null;
                                      if (taskDetail.rows[0].subtask_sort_order) {
                                        requiredSubtasks = taskDetail.rows[0].subtask_sort_order.substring(0, taskDetail.rows[0].subtask_sort_order.split(',', process.env.PAGE_RECORD_NO).join(',').length);
                                        let qry = `SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone '${companyDefaultTimezone}' as start_date ,t.end_date at time zone '${companyDefaultTimezone}' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone '${companyDefaultTimezone}' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date ,t.updated_date ,t.archived ,t.project_name ,t.record_id,(select first_name from users where id=t.assigned_user_id) as user_first_name, (select last_name from users where id=t.assigned_user_id) as user_last_name, (select role from users where id=t.assigned_user_id) as user_role
                                        FROM TASK t
                                        where id in (${requiredSubtasks})
                                        ORDER BY position(id::text in '${requiredSubtasks}')`;
                                        client.query(qry, [], (err, subtasks) => {
                                          if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.responseToPage(res, 'pages/task-details', { taskDetails: {}, userList: [], user: req.user, error: err ,hierarchyData:[]}, "error", " Error in finding Subtasks");
                                          } else{
                                            subtasks.rows.forEach((subtask)=>{
                                              subtask.startDateFormatted = (subtask.start_date==null)?'':moment.tz(subtask.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                              subtask.endDateFormatted = (subtask.end_date==null)?'':moment.tz(subtask.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                            })
                                            handleResponse.responseToPage(res, 'pages/task-details', {taskDetails: taskDetail.rows[0], userList: userListCombined,  user: req.user, stripeCustomerId: result.stripe_customer_id, subtasks: subtasks.rows, resUsers:userListCombined , userRoleList : [],project : {},taskTotalCount:taskDetail.rows[0].totalsubtaskscount,hierarchyData:hierarchyData.rows }, "success", "Successfully rendered");
                                          }
                                        })
                                      } else {
                                        handleResponse.responseToPage(res, 'pages/task-details', { user: req.user, taskDetails: taskDetail.rows[0], userList: userListCombined, stripeCustomerId: result.stripe_customer_id, subtasks: [], resUsers : userListCombined, userRoleList :[],project : {},taskTotalCount:taskDetail.rows[0].totalsubtaskscount ,hierarchyData:hierarchyData.rows}, "success", "Successfully rendered");
                                      }
                                    }
                                  })

                                /*res.render('pages/task-details', { user: req.user, taskDetails: taskDetail.rows[0] });*/
                                }
                              });
                            }
                          });
                      }
                    });
                  }else{
                      handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,userRoleList :[],project : {},taskTotalCount:taskDetail.rows[0].totalsubtaskscount},"error"," Error in finding task data");
                  }
                }
              });

            });
          } else {
            handleResponse.responseToPage(res,'pages/task-details',{taskDetails: {},userList:[],user:req.user, error:err,userRoleList : [],project : {},taskTotalCount:0,subtasks:[]},"error"," Error in finding task data");
          }
      }
    });
};

exports.postEditTask = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');
      }else{

        companyDefaultTimezone=result.timezone;
          if (req.body.taskDetails.taskId != '' && req.body.taskDetails.taskId != undefined && req.body.taskDetails.taskId != null) {
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in beginning transaction ');
                } else {
                  client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id FROM TASK t where id=$1 AND company_id=$2', [req.body.taskDetails.taskId, req.user.company_id], function (err, taskDetail) {
                    if (err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding task data for updating');
                    } else {

                          if (taskDetail.rows.length > 0) {
                            var taskData = {};
                            taskData.assigned_user_id = req.body.taskDetails.assignment_id;
                            console.log('taskData.assigned_user_id')
                            console.log(taskData.assigned_user_id)
                            updateTaskRecord(req, client, err, done, res, taskData, function (taskId) {
                                var reqData = req.body.taskDetails;
                                 if(req.body.taskDetails.assignment_id != null) {
                                    commonController.checkTaskAssignment(req, client, err, done, reqData, res, function (response) {
                                      if(!response) {
                                        console.log('inside task assignment not found ')
                                        commonController.checkProjectAssignment(req, client, err, done, reqData, res, function (isProjectAssignment) {
                                            let billRate = 0;
                                            let costRate = 0;
                                            if(!isProjectAssignment) {
                                              billRate = req.user.bill_rate;
                                              costRate = req.user.cost_rate;
                                            } else {
                                              billRate = isProjectAssignment.bill_rate;
                                              costRate = isProjectAssignment.cost_rate;
                                            }
                                            commonController.checkTaskAssignmentForTask(req, client, err, done, reqData, res, function (isTaskAssigned) {
                                              if(isTaskAssigned){
                                                console.log('inside checkTaskAssignmentForTask');
                                                commonController.updateTaskAssignment(req, client, err, done, taskId, billRate, costRate, reqData, res, function (result2) {
                                                  if(result2) {
                                                    client.query('COMMIT', (err) => {
                                                      if (err) {
                                                        handleResponse.shouldAbort(err, client, done);
                                                        handleResponse.handleError(res, err, ' Error in ending transaction ');
                                                      } else {
                                                        done();
                                                        handleResponse.sendSuccess(res,'Task added successfully',{});
                                                      }
                                                    })
                                                  }
                                                });
                                              } else {
                                                console.log('inside create new task assignment')
                                                commonController.createTaskAssignment(req, client, err, done, taskId, billRate, costRate, reqData, res, function (result2) {
                                                  if(result2) {
                                                    client.query('COMMIT', (err) => {
                                                      if (err) {
                                                        handleResponse.shouldAbort(err, client, done);
                                                        handleResponse.handleError(res, err, ' Error in ending transaction ');
                                                      } else {
                                                        done();
                                                        handleResponse.sendSuccess(res,'Task updated successfully',{});
                                                      }
                                                    })
                                                  }
                                                });
                                              }
                                            })
                                          })

                                      } else {
                                        client.query('COMMIT', (err) => {
                                          if (err) {
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in ending transaction ');
                                          } else {
                                            done();
                                            handleResponse.sendSuccess(res,'Task updated successfully',{});
                                          }
                                        })
                                      }
                                    })
                                } else {
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in ending transaction ');
                                    } else {
                                      done();
                                      handleResponse.sendSuccess(res,'Task updated successfully',{});
                                    }
                                  })
                                }
                            });
                            // console.log("Assignment id");
                            // console.log(req.body.taskDetails);
                            // var taskData = {};
                            // var reqData = req.body.taskDetails;
                            // if(req.body.taskDetails.assignment_id != null) {
                            //   taskData.assigned_user_id = req.body.taskDetails.assignment_id;
                            //   updateTaskRecord(req, client, err, done, res, taskData, function (taskId) {
                            //     reqData.task_id = taskId;
                            //     commonController.checkTaskAssignment(req, client, err, done, reqData, res, function (response) {
                            //       if(!response) {
                            //         commonController.checkProjectAssignment(req, client, err, done, reqData, res, function (isProjectAssignment) {
                            //           let billRate = 0;
                            //           let costRate = 0;
                            //           if(!isProjectAssignment) {
                            //             billRate = req.user.bill_rate;
                            //             costRate = req.user.cost_rate;
                            //           } else {
                            //             billRate = isProjectAssignment.bill_rate;
                            //             costRate = isProjectAssignment.cost_rate;
                            //           }
                            //           commonController.createTaskAssignment(req, client, err, done, taskId, billRate, costRate, reqData, res, function (result2) {
                            //             if(result2) {
                            //               done();
                            //               handleResponse.sendSuccess(res,'Task added successfully',{});
                            //             }
                            //           });
                            //         })
                            //       } else {
                            //         done();
                            //         handleResponse.sendSuccess(res,'Task added successfully',{});
                            //       }
                            //     })
                            //   });
                            // } else {
                            //   client.query('SELECT account_id FROM PROJECT where id=$1 AND company_id=$2', [req.body.taskDetails.project_id, req.user.company_id], function (err, projectDetail) {
                            //     if (err) {
                            //       console.error(err);
                            //       handleResponse.shouldAbort(err, client, done);
                            //       handleResponse.handleError(res, err, ' Error in finding project data for task');
                            //     } else {
                            //       // console.log("taskData");
                            //       // console.log(req.body);
                            //       req.body.accountId = projectDetail.rows[0].account_id;
                            //       req.body.projectId = reqData.project_id;
                            //       commonController.createProjectAssignment(req, client, err, done, reqData, req.body.userData.billRate, req.body.userData.costRate, res, function (result1){
                            //         taskData.assigned_user_id = result1.id;
                            //         updateTaskRecord(req, client, err, done, res, taskData, function (taskId) {
                            //           commonController.createTaskAssignment(req, client, err, done, taskId, req.body.userData.billRate, req.body.userData.costRate, reqData, res, function (result2) {
                            //             if(result2) {
                            //               done();
                            //               handleResponse.sendSuccess(res,'Task added successfully',{});
                            //             }
                            //           });
                            //         });
                            //       });
                            //     }
                            //   });
                            // }
                          } else {
                            done();
                            handleResponse.sendSuccess(res,"no task found",{"msg":"no task found"});
                          }
                      //   }
                      // })
                    }
                  })
                }
              })
            });
          } else{
            handleResponse.handleError(res, "incorrect task id", " Task id is not correct");
          }
      }
    });
};

exports.deleteTask = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');
      }else{

        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
          if (req.body.taskId != '' && req.body.taskId != undefined && req.body.taskId != null) {
            // console.log('>>>>>>>>>>>>>>>>>> Inside Task Details Update If Statement <<<<<<<<<<<<<<<<<<');
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                  // console.log('>>>>>>>>>>>>>>>>>> Inside Task Details Update Pool Connection <<<<<<<<<<<<<<<<<<');
                  var sortOrderQryStr=updateSortOrderQryStr=updateSortOrderQryParam=findAllChildQry='';
                  if(req.body.isSubtask && req.body.isSubtask==true){
                    sortOrderQryStr='(SELECT subtask_sort_order FROM task where id = t.parent_id ) as projectTaskSortOrder';
                  }else{
                    sortOrderQryStr='(SELECT task_sort_order FROM project where id = t.project_id ) as projectTaskSortOrder';
                  }
                  client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id,'+sortOrderQryStr+' FROM TASK t where id=$1 AND company_id=$2', [req.body.taskId, req.user.company_id], function (err, taskDetail) {
                    // console.log('>>>>>>>>>>>>>>>>>> Inside Task Details Update After Query <<<<<<<<<<<<<<<<<<');
                    if (err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding task data');
                    } else {
                      if (taskDetail.rows.length > 0) {
                        client.query('UPDATE TASK SET archived = $1 WHERE id=$2 AND company_id=$3', [true, req.body.taskId, req.user.company_id], function (err, archivedTask) {
                          if (err) {
                            console.error(err);
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in deleting task');
                          } else {
                            console.log('task details');
                            console.log(taskDetail.rows[0]);
                            let updatedSortOrder = taskDetail.rows[0].projecttasksortorder;
                            console.log(updatedSortOrder);
                            updatedSortOrder = updatedSortOrder.split(',');
                            // delete updatedSortOrder[updatedSortOrder.indexOf(req.body.taskId)];
                            updatedSortOrder = updatedSortOrder.filter(function(item) {
                                  return item !== req.body.taskId;
                              })
                            console.log(updatedSortOrder.join(','));
                            updatedSortOrder = updatedSortOrder.join(',');
                            if(req.body.isSubtask && req.body.isSubtask==true){
                              updateSortOrderQryStr='UPDATE TASK SET subtask_sort_order = $1 WHERE id=$2 AND company_id=$3';
                              updateSortOrderQryParam=[updatedSortOrder, taskDetail.rows[0].parent_id, req.user.company_id];
                            }else{
                              updateSortOrderQryStr='UPDATE PROJECT SET task_sort_order = $1 WHERE id=$2 AND company_id=$3';
                              updateSortOrderQryParam=[updatedSortOrder, taskDetail.rows[0].project_id, req.user.company_id];
                            }
                            client.query(updateSortOrderQryStr, updateSortOrderQryParam, function (err, archivedTask) {
                              if (err) {
                                console.error(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in deleting task');
                              } else {
                                
                                if(req.body.isSubtask && req.body.isSubtask==true){
                                  let findAllChildQry = `WITH RECURSIVE rec_tree(parent_id,id) AS (
                                    SELECT t.parent_id, t.id
                                    FROM task t where id = ${req.body.taskId}
                                  UNION ALL
                                    SELECT t.parent_id,t.id
                                    FROM task t, rec_tree rt
                                    WHERE t.parent_id = rt.id
                                  )
                                  SELECT string_agg(id::text , ',') as allChildren FROM rec_tree`;
                                  client.query(findAllChildQry, [], function (err, allChildren) {
                                    if (err) {
                                      console.error(err);
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in deleting task');
                                    } else {
                                      if(allChildren.rows[0].allchildren){
                                        let deleteQry = `update task set archived = true where id in (${allChildren.rows[0].allchildren})`;
                                        client.query(findAllChildQry, [], function (err, allChildren) {
                                          if (err) {
                                            console.error(err);
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, ' Error in deleting task');
                                          } else {
                                            client.query('COMMIT', (err) => {
                                              if (err) {
                                                // console.log('Error committing transaction', err.stack)
                                                handleResponse.shouldAbort(err, client, done);
                                                handleResponse.handleError(res, err, ' Error in committing transaction');
                                              } else {
                                                  console.error('Affected ID>>>>>>>>>>>>>');
                                                  // console.log(archivedTask.rows);
                                                  done();
                                                  handleResponse.sendSuccess(res,'Task deleted successfully',{});
                                                  /*res.status(200).json({ "success": true ,"message":"success"});*/
                                              }
                                            })
                                          }
                                        })
                                      }
                                    }
                                  })
                                }else{
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      // console.log('Error committing transaction', err.stack)
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                        console.error('Affected ID>>>>>>>>>>>>>');
                                        // console.log(archivedTask.rows);
                                        done();
                                        handleResponse.sendSuccess(res,'Task deleted successfully',{});
                                        /*res.status(200).json({ "success": true ,"message":"success"});*/
                                    }
                                  })
                                }
                              }
                            })
                          }
                        })
                      } else {
                        done();
                      }
                    }
                  })
                }
              })
            });
          }  else{
                handleResponse.handleError(res, "incorrect task id", " Task id is not correct");
              }
      }
    });
}

exports.getTaskAndAssignmentList = (req, res, callback) => {
  // console.log("Inside method")
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');
      }else{
        companyDefaultTimezone=result.timezone;
        pool.connect((err, client, done) => {
          client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id FROM TASK t where project_id=$1 AND company_id=$2', [req.body.projectId, req.user.company_id], function (err, tasks) {
            if (err) {
              console.error(err);
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in finding task data');
            } else {
              client.query('SELECT pa.bill_rate ,pa.cost_rate ,pa.user_role FROM PROJECT_ASSIGNMENT pa WHERE company_id=$1 AND project_id=$2 AND user_id=$3',[req.user.company_id, req.body.projectId, req.user.id], function (err, projectAssignment) {
                if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding projectAssignment data');
                } else {
                  // console.log("req.body.getTaskList");
                  // console.log(req.body.getTaskList)
                  if(req.body.getTaskList) {
                    // console.log("returned success");
                    return callback(tasks.rows);
                  } else {
                    done();
                    handleResponse.sendSuccess(res,'Task list fetched',{"tasks": tasks.rows ,"projectAssignment" :projectAssignment.rows});
                    /*res.status(200).json({ "success": true, "tasks": tasks.rows ,"message":"success"});*/
                  }
                }
              })
            }
          })
        });
      }
    });
};

/* exports.getEditTask = (req, res) => {
  // console.log('task details are: ' + req.params.taskId);
  let taskId = req.params.taskId;
  // console.log('task id is ' + taskId);
  let domain = req.user.domain;
  let domainWODot = domain.split('.').join("");

  let queryToExec = 'SELECT * FROM ' + domainWODot + '_task where id = $1';
  client.query(queryToExec, [taskId], function (err, task) {
    if (err) {
      req.flash('errors', { msg: 'error in getting task from table' + err });
      return res.redirect('/task');
    }id
    // console.log('task is ' + JSON.stringify(task));
    if (task.rows.length > 0) {
      res.render('component/editTask', {
        title: 'edit task',
        task: task.rows[0]
      });
    } else {
      req.flash('errors', { msg: 'error in finding task with this id' + err });
      return res.redirect('/task');
    }


  });

}; */
