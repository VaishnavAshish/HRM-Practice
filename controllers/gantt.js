const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
let companyDefaultTimezone;

function dateFormat(gDate) {
  return(gDate.split(' ')[0]);
}


exports.loadGanttData = (req, res) => {
   setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        handleResponse.handleError(res, err, ' Error in finding company setting');
      }else{
          companyDefaultTimezone=result.timezone;

          pool.connect((err, client, done) => {
            client.query('SELECT p.id ,p.name ,p.type ,p.start_date at time zone \''+companyDefaultTimezone+'\' as start_date ,p.end_date at time zone \''+companyDefaultTimezone+'\' as end_date ,p.percent_completed ,p.company_id FROM PROJECT p where id=$1 AND company_id=$2', [req.params.project_id, req.user.company_id], function (err, project) {
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
                          		parent_id,
                          		project_id,
                                  name,
                                  start_date at time zone '${companyDefaultTimezone}' as start_date,
                                  end_date at time zone '${companyDefaultTimezone}' as end_date,
                                  percent_completed,
                          		subtask_sort_order,
                          		position(id::text in (select task_sort_order from project where id = project_id)) as sortorder
                              FROM
                                  task
                              WHERE
                                  project_id = $1 AND parent_id is null
                              UNION ALL
                              SELECT
                                  task.id,
                                  task.parent_id,
                          		    task.project_id,
                                  task.name,
                                  task.start_date at time zone '${companyDefaultTimezone}' as start_date,
                                  task.end_date at time zone '${companyDefaultTimezone}' as end_date,
                                  task.percent_completed,
                          		task.subtask_sort_order,
                          		position(task.id::text in taskTree.subtask_sort_order) as sortorder
                              FROM
                                  taskTree
                          	JOIN task ON task.parent_id = taskTree.id
                          )
                          SELECT
                              *
                          FROM
                              taskTree`;

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
                      }
                      if(project.rows[0].end_date != null) {
                        // endDateFormatted = dateFormat(moment.tz(project.rows[0].end_date, companyDefaultTimezone).format());
                        endDateFormatted = dateFormat(project.rows[0].end_date);
                      }
                      project.rows[0]["start_date"] = startDateFormatted;
                      project.rows[0]["end_date"] = endDateFormatted;

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
                              startDateFormatted = moment.tz(data.start_date, companyDefaultTimezone).format('MM-DD-YYYY');
                              // startDateFormatted = dateFormat(data.start_date);
                            }
                            if(data.end_date != null) {
                              endDateFormatted = moment.tz(data.end_date, companyDefaultTimezone).format('MM-DD-YYYY');
                              // endDateFormatted = dateFormat(data.end_date);
                            }
                            data["start_date"] = startDateFormatted;
                            data["end_date"] = endDateFormatted;
                            if(!data.parent_id){
                              data["parent_id"] = project.rows[0].id;
                            }
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
