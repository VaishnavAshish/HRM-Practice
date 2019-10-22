const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
// const commonController = require('./common-functions');

let companyDefaultTimezone;
let crudDataMap = {};
function dateFormat(gDate) {
  return(gDate.split(' ')[0].split('T')[0]);
}

exports.ganttTaskCRUD = (req,res) => {
  // console.log(req.body);
  crudDataMap = {};
  console.log(JSON.parse(req.body.data));
  let reqData =JSON.parse(req.body.data);
  for(var i=0;i<=reqData.length;i++){
    console.log(reqData[i]);
    if(i == reqData.length){
      setTimeout(function(){
        console.log('crudDataMap in final update');
        console.log(crudDataMap);
        res.status(200).json(crudDataMap);
      },2000);
    }else{
        if(reqData[i].entity == "task"){
          if(reqData[i].action == "create"){
            createdTask(req,res,JSON.parse(reqData[i].entityData));
          }else if(reqData[i].action == "update"){
            updateTask(req,res,JSON.parse(reqData[i].entityData));
          }else if(reqData[i].action == 'delete'){
            deleteTask(req,res,JSON.parse(reqData[i].entityData));
          }
        }
    }

  }
}

function updateTask(req,res,taskData){
  console.log('inside update task')
  //console.log(crudDataMap[taskData.id]);
  crudDataMap[taskData.id] = taskData
  return true;
}
function deleteTask(req,res,taskData){
  console.log('inside delete task')
  crudDataMap[taskData.id] = taskData
  return true;
}

function createdTask(req,res,taskData){
  console.log('inside create task')
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       //handleResponse.handleError(res, err, ' Error in finding company setting');
       crudDataMap[taskData.id] = 'Error in finding company setting '+err
     } else {
       companyDefaultTimezone=result.timezone;

       // console.log(taskData.end_date);
       if (taskData.start_date!=null && taskData.start_date!='') {
         taskData.start_date = moment.tz(taskData.start_date, companyDefaultTimezone).format();
       }else{
         taskData.start_date=null;
       }
       if (taskData.end_date!=null && taskData.end_date!='') {
         taskData.end_date = moment.tz(taskData.end_date, companyDefaultTimezone).format();
       }else{
         taskData.end_date=null;
       }
       console.log(taskData.start_date);
       pool.connect((err, client, done) => {
         client.query('BEGIN', (err) => {
           if (err){
             handleResponse.shouldAbort(err, client, done);
             //handleResponse.handleError(res, err, ' error in connecting to database');
             crudDataMap[taskData.id] = 'Error in connecting to database'
           } else {
             let parentIdParam;
             if(taskData.parent !=0  && req.body.projectId !=taskData.parent){
               parentIdParam='='+taskData.parent;
             }else{
               parentIdParam='is Null';
             }
             client.query('SELECT t.id ,t.project_id ,t.name ,t.type ,t.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,t.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,t.total_hours ,t.billable ,t.completion_date at time zone \''+companyDefaultTimezone+'\' as completion_date ,t.status ,t.include_weekend ,t.description ,t.percent_completed ,t.estimated_hours ,t.completed ,t.assigned_by_name ,t.assigned_user_id ,t.billable_hours ,t.milestone ,t.parent_id ,t.company_id ,t.priority ,t.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,t.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,t.archived ,t.project_name ,t.record_id FROM TASK t where name=$1 AND company_id=$2 AND project_id=$3 AND parent_id '+parentIdParam, [taskData.text, req.user.company_id, req.body.projectId ], function (err, taskList) {
               if (err) {
                 console.error(err);
                 handleResponse.shouldAbort(err, client, done);
                 crudDataMap[taskData.id] = 'Error in finding task data '+err
                 //handleResponse.handleError(res, err, ' Error in finding task data');
               } else {
                 if (taskList.rows.length > 0) {
                   done();
                   crudDataMap[taskData.id] = 'Task with same name already exist '
                   // handleResponse.handleError(res,"Task with same name already exist","Task with same name already exist");
                 } else {
                   let reqData = {};
                   createTaskRecord(req, client, err, done, (taskData.parent !=0 && req.body.projectId !=taskData.parent),null,taskData, res, function (err,result) {
                     if(err){
                        crudDataMap[taskData.id] = ' Error in inserting task '+err
                     }else{
                         client.query('COMMIT', (err) => {
                           if (err) {
                             // console.log('Error committing transaction', err.stack)
                             handleResponse.shouldAbort(err, client, done);
                             crudDataMap[taskData.id] = ' Error in committing transaction '+err
                             //handleResponse.handleError(res, err, ' Error in committing transaction');
                           } else {
                             done();
                             console.log('result of task insertion is ');
                             console.log(result);
                             console.log(taskData.id);
                             crudDataMap[taskData.id] = result;
                             console.log(crudDataMap);
                             return true;
                             // handleResponse.sendSuccess(res,'Task added successfully',{});
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
     }
   });
}

function createTaskRecord(req, client, err, done, isSubtask,assigned_user_id, taskData,res, callback) {
  console.log('inside create task record')
  let insertQry = insertQryParam =parentId='';
  insertQryParam = [req.body.projectId,taskData.text,taskData.start_date,taskData.end_date,0,'',req.user.company_id, 0, 'Not Started', true,null,null]


  if(isSubtask){
    parentId = ', $13';
    insertQryParam.push(taskData.parent);
  }else{
    parentId = ', null';
  }
  insertQry = 'Insert INTO TASK (project_id, name, start_date, end_date, estimated_hours, description, company_id, percent_completed, status, billable,project_name, assigned_user_id, parent_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12'+parentId+') RETURNING *';
  client.query(insertQry,insertQryParam , function (err, insertedTask) {
    if(err) {
      handleResponse.shouldAbort(err, client, done);
      //handleResponse.handleError(res, err, ' Error in adding task to the database');
      return(callback(err,null));
    } else {
      let taskSortQry = taskSortParam = '';
      taskSortParam = [insertedTask.rows[0].id,','+insertedTask.rows[0].id];
      if(isSubtask){
        table='Task';
        column='subtask_sort_order';
        taskSortParam.push(taskData.parent);
      }else{
        table='Project';
        column='task_sort_order';
        taskSortParam.push(req.body.projectId);
      }
      taskSortQry = 'UPDATE '+table+' SET '+column+' = (CASE WHEN '+column+' IS NULL THEN $1 ELSE '+column+' || $2 END) WHERE id=$3';
      client.query(taskSortQry,taskSortParam, function (err, updatedProjectWithSortOrder) {
        if(err) {
          handleResponse.shouldAbort(err, client, done);
          //handleResponse.handleError(res, err, ' Error in adding updating task sort order to the database');
          return(callback(err,null));
        } else {
          return callback(null,insertedTask.rows[0]);
        }
      });
      //return callback(insertedTask.rows[0].id);
    }
  });
}

exports.loadGanttData = (req, res) => {
   setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        handleResponse.handleError(res, err, ' Error in finding company setting');
      }else{
          companyDefaultTimezone=result.timezone;

          pool.connect((err, client, done) => {
            client.query('SELECT p.id ,p.name as text ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.percent_completed as progress,p.company_id FROM PROJECT p where id=$1 AND company_id=$2', [req.params.project_id , req.user.company_id], function (err, project) {
              if (err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                // handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [],user:req.user, error:err},"error"," Error in finding project data");
                handleResponse.handleError(res, err, ' Error in finding project data');
              } else {
                if(project.rowCount > 0) {
                  console.error('getProject>>>>>>>>>>>>>');
                  console.log(project.rows[0]);

                  let requiredTasks = null;
                  console.log(project.rows[0].task_sort_order);
                  if(project.rows[0].task_sort_order){
                    requiredTasks= project.rows[0].task_sort_order.substring(0,project.rows[0].task_sort_order.split(',',process.env.PAGE_RECORD_NO).join(',').length);
                  }
                  console.log(requiredTasks);
                  let qry=`WITH RECURSIVE taskTree AS (
                              SELECT
                                  id,
                          		parent_id as parent,
                          		project_id,
                                  name as text,
                                  start_date at time zone '${companyDefaultTimezone}' as start_date,
                                  end_date at time zone '${companyDefaultTimezone}' as end_date,
                                  percent_completed as progress,
                          		subtask_sort_order,
                          		position(id::text in (select task_sort_order from project where id = project_id)) as sortorder
                              FROM
                                  task
                              WHERE
                                  project_id = $1 AND parent_id is null
                              UNION ALL
                              SELECT
                                  task.id,
                                  task.parent_id as parent,
                          		    task.project_id,
                                  task.name as text,
                                  task.start_date at time zone '${companyDefaultTimezone}' as start_date,
                                  task.end_date at time zone '${companyDefaultTimezone}' as end_date,
                                  task.percent_completed as progress,
                          		task.subtask_sort_order,
                          		position(task.id::text in taskTree.subtask_sort_order) as sortorder
                              FROM
                                  taskTree
                          	JOIN task ON task.parent_id = taskTree.id
                          )
                          SELECT
                              *
                          FROM
                              taskTree
                          ORDER BY sortorder`;

                    client.query(qry, [req.params.project_id], function (err, taskList) {
                    if (err) {

                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      // handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [],user:req.user, error:err},"error"," Error in finding task data");
                      handleResponse.handleError(res, err, ' Error in finding task data');
                    } else {
                      // console.log("-------------taskList------------");
                      // console.log(taskList.rows);
                      let startDateFormatted = '';
                      let endDateFormatted = '';
                      let taskTotalCount=0;
                      if(project.rows[0].start_date != null) {
                        // startDateFormatted = dateFormat(moment.tz(project.rows[0].start_date, companyDefaultTimezone).format());
                        startDateFormatted = dateFormat(project.rows[0].start_date);
                      }else{
                        startDateFormatted = moment.tz(new Date(), companyDefaultTimezone).format('YYYY-MM-DD')
                      }
                      if(project.rows[0].end_date != null) {
                        // endDateFormatted = dateFormat(moment.tz(project.rows[0].end_date, companyDefaultTimezone).format());
                        endDateFormatted = dateFormat(project.rows[0].end_date);
                      }else{
                        endDateFormatted = moment.tz(new Date(), companyDefaultTimezone).format('YYYY-MM-DD')
                      }
                      project.rows[0]["start_date"] = startDateFormatted;
                      project.rows[0]["end_date"] = endDateFormatted;
                      project.rows[0]["open"] = true;
                      project.rows[0].type = 'project';
                      // project.rows[0]["progress"] = project.rows[0]["percent_completed"]

                      // project.rows[0]["total_hours"] = minuteToHours(project.rows[0]["total_hours"]);
                      // project.rows[0]["total_invoice_time"] = minuteToHours(project.rows[0]["total_invoice_time"]);

                      //let taskTotalCount=0;
                      //let projectTaskSortOrder = project.rows[0].task_sort_order?project.rows[0].task_sort_order.split(','):[];
                      //let taskSortedArr = [];
                      if(taskList.rows.length>0){
                          taskList.rows.forEach(function (data,index) {
                            let startDateFormatted = '';
                            let endDateFormatted = '';
                            if(data.start_date != null) {
                              startDateFormatted = moment.tz(data.start_date, companyDefaultTimezone).format('YYYY-MM-DD');
                              // startDateFormatted = dateFormat(data.start_date);
                            }else{
                              startDateFormatted = moment.tz(new Date(), companyDefaultTimezone).format('YYYY-MM-DD')
                            }
                            if(data.end_date != null) {
                              endDateFormatted = moment.tz(data.end_date, companyDefaultTimezone).format('YYYY-MM-DD');
                              // endDateFormatted = dateFormat(data.end_date);
                            }else{
                              endDateFormatted = moment.tz(new Date(), companyDefaultTimezone).format('YYYY-MM-DD')
                            }
                            data["start_date"] = startDateFormatted;
                            data["end_date"] = endDateFormatted;
                            if(!data.parent){
                              data["parent"] = project.rows[0].id;
                            }
                            data.type = 'task';
                            /*else{
                              data["parent"] = data["parent"]
                            }
                            data["text"] = data["name"]
                            data["progress"] = data["percent_completed"] */
                            data["open"] = true;
                            // console.log('task assignment detail')
                            // console.log(data.id)
                            // console.log(data.assigned_user_id)
                            // data["user_id"]='';
                            // data["user_role"]='';
                            // data["user_email"]='';
                            // if(data.assigned_user_id){
                            //   client.query('SELECT user_id,user_email,user_role FROM TASK_ASSIGNMENT where task_id=$1', [data.id], function (err, taskAssignResourceId) {
                            //     if (err) {
                            //       console.error(err);
                            //       handleResponse.shouldAbort(err, client, done);
                            //       handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding task assignment data");
                            //       return false;
                            //     } else {
                            //       if(taskAssignResourceId.rows.length>0){
                            //         client.query('SELECT id, first_name, last_name, email FROM users WHERE id=$1', [taskAssignResourceId.rows[0].user_id], function (err, taskAssignResourceDetail) {
                            //           if (err) {
                            //             handleResponse.shouldAbort(err, client, done);
                            //             handleResponse.responseToPage(res,'pages/project-details',{project: {}, userRoleList:[] ,tasks: [], accounts: [], userList: [], resUsers: [], user:req.user, error:err},"error"," Error in finding user data");

                            //           } else {
                            //               console.log('taskAssignResourceId.rows')
                            //               console.log(taskAssignResourceId.rows[0]);
                            //               data["user_id"] = taskAssignResourceId.rows[0].user_id;
                            //               data["user_role"] = taskAssignResourceId.rows[0].user_role;
                            //               data["user_first_name"] = taskAssignResourceDetail.rows[0].first_name;
                            //               data["user_last_name"] = taskAssignResourceDetail.rows[0].last_name;
                            //               data["user_email"] = taskAssignResourceDetail.rows[0].email;
                            //               //data["user_email"]=taskAssignResourceId.rows[0].user_email.substring(0,taskAssignResourceId.rows[0].user_email.indexOf('('));
                            //           }
                            //         })
                            //       }
                            //     }
                            //   })
                            // }
                            //taskSortedArr.push(data);
                          });

                          // if(project.rows[0].total_task_count){
                          //   taskTotalCount=project.rows[0].total_task_count;
                          // }
                          // console.log('taskTotalCount')
                          // console.log(taskTotalCount)

                      }
                      // console.log('sorted task array')
                      // console.log(taskSortedArr);
                      let responseData = {
                        data: [project.rows[0]].concat(taskList.rows),
                        link:[]
                      }
                      console.log('responseData')
                      console.log(responseData)
                      done();
                      //handleResponse.sendSuccess(res,'Project data fetched successfully.',{responseData});
                      res.status(200).json(responseData);
                      //handleResponse.responseToPage(res,'pages/project-details',{ project: project.rows[0], userRoleList:userRole ,tasks: taskSortedArr, accounts: accountList.rows, userList: userList.rows, user: req.user, resUsers: resUsers.rows ,taskTotalCount:taskTotalCount,currentdate:moment.tz(result.currentdate, companyDefaultTimezone).format('YYYY-MM-DD'),stripeCustomerId:result.stripe_customer_id,"projectConversationThread":projectConversationThread.rows },"success","Successfully rendered");
                    }
                  })
                }
              }
            })
          })
      }
    });
};
