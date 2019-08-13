const moment = require('moment-timezone');
var module;

function createTaskAssignment(req, client, err, done, taskId, billRate, costRate, taskData, res, result) {
    // let newDate=moment.tz(new Date(), taskData.companyDefaultTimezone).format();
    let projectId = req.body.projectId;
    if(!req.body.projectId) {
      projectId = taskData.project_id;
    }
    let userEmail = req.body.userData.userEmail;
    // console.log(userEmail);
    client.query('INSERT INTO TASK_ASSIGNMENT (task_id,project_id, user_id, user_email, bill_rate, cost_rate, company_id,created_date,updated_date, user_role) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [taskId,projectId,taskData.assigned_user,userEmail, billRate, costRate,req.user.company_id,'now()','now()',taskData.user_role], function (err, taskAssignList) {
      if (err) {
        console.error(err);
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in inserting task assignment data');
      } else {
        return result(true,res);
      }
    });
  }

  function updateTaskAssignment(req, client, err, done, taskId, billRate, costRate, taskData, res, result) {
      // let newDate=moment.tz(new Date(), taskData.companyDefaultTimezone).format();
      let projectId = req.body.projectId;
      if(!req.body.projectId) {
        projectId = taskData.project_id;
      }
      let userEmail = req.body.userData.userEmail;
      console.log('UPDATE TASK_ASSIGNMENT set user_id=$1, user_email=$2, bill_rate=$3, cost_rate=$4,updated_date=$5, user_role=$6 WHERE task_id=$7 AND project_id=$8  RETURNING id', [taskData.assigned_user,userEmail, billRate, costRate,'now()',taskData.user_role,taskId,projectId]);
      // console.log(userEmail);
      client.query('UPDATE TASK_ASSIGNMENT set user_id=$1, user_email=$2, bill_rate=$3, cost_rate=$4,updated_date=$5, user_role=$6 WHERE task_id=$7 AND project_id=$8  RETURNING id', [taskData.assigned_user,userEmail, billRate, costRate,'now()',taskData.user_role,taskId,projectId], function (err, taskAssignList) {
        if (err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in updating task assignment data');
        } else {
          return result(true,res);
        }
      });
    }



  function createProjectAssignment (req, client, err, done, taskData, billRate, costRate, res, result) {
    // let newDate=moment.tz(new Date(), taskData.companyDefaultTimezone).format();
    let projectId = req.body.projectId;
    if(!req.body.projectId) {
      projectId = taskData.project_id;
    }
    let accountId = req.body.accountId;
    if(!req.body.accountId) {
      accountId = taskData.account_id;
    }
    client.query('INSERT INTO PROJECT_ASSIGNMENT (project_id, user_id, account_id, created_by, bill_rate, cost_rate, company_id,created_date,updated_date, user_role) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [projectId,taskData.assigned_user, accountId, req.user.id, billRate, costRate,req.user.company_id,'now()' ,'now()', taskData.user_role], function (err, insertedProjectAssgn) {
      if (err) {
        console.error(err);
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in inserting task assignment data');
      } else {
        return result(insertedProjectAssgn.rows[0],res);
      }
    });
  }



  function checkProjectAssignment (req, client, err, done, taskData, res, result) {
    var whereClause = ' WHERE project_id=$1 AND user_id=$2 AND company_id=$3 AND user_role=$4';
    var searchCriteria = [taskData.project_id,taskData.assigned_user,req.user.company_id, taskData.user_role];
    /* if(parseInt(taskData.res_bill_rate) && parseInt(taskData.res_cost_rate)) {
      whereClause += ' AND bill_rate=$5 AND cost_rate=$6';
      searchCriteria.push(parseInt(taskData.res_bill_rate));
      searchCriteria.push(parseInt(taskData.res_cost_rate));
    } */
    // console.log("********** searchCriteria ***********");
    // console.log(searchCriteria);
    client.query('SELECT * FROM PROJECT_ASSIGNMENT'+whereClause, searchCriteria, function (err, assignedUser) {
      if (err) {
        // console.log(">>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<");
        console.error(err);
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in inserting task assignment data');
      } else {
        // console.log("fetch project assignment");
        // console.log(assignedUser);
        // console.log(">>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<");
        if(assignedUser.rows.length > 0) {
          return result(assignedUser.rows[0]);
        } else {
          return result(false,res);
        }
      }
    });
  }



  function checkTaskAssignmentForTask(req, client, err, done, taskData, res, result) {
    var whereClause = ' WHERE project_id=$1 AND company_id=$2 AND task_id=$3';
    var searchCriteria = [taskData.project_id,req.user.company_id, taskData.taskId];
    console.log(taskData.project_id,req.user.company_id, taskData.taskId);
    client.query('SELECT * FROM TASK_ASSIGNMENT'+whereClause, searchCriteria, function (err, assignedUser) {
      if (err) {
        // console.log(">>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<");
        console.error(err);
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in fetching task assignment data');
      } else {
        // console.log("fetch project assignment");
        // console.log(assignedUser);
        // console.log(">>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<");
        if(assignedUser.rows.length > 0) {
          console.log('inside assigned user found')
          return result(assignedUser.rows[0]);
        } else {
          console.log('inside assigned user not found')
          return result(false,res);
        }
      }
    });
  }

  function checkTaskAssignment(req, client, err, done, taskData, res, result) {
    var whereClause = ' WHERE project_id=$1 AND user_id=$2 AND company_id=$3 AND user_role=$4 AND task_id=$5';
    var searchCriteria = [taskData.project_id,taskData.assigned_user,req.user.company_id, taskData.user_role, taskData.task_id];
    client.query('SELECT * FROM TASK_ASSIGNMENT'+whereClause, searchCriteria, function (err, assignedUser) {
      if (err) {
        // console.log(">>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<");
        console.error(err);
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in inserting task assignment data');
      } else {
        // console.log("fetch project assignment");
        // console.log(assignedUser);
        // console.log(">>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<");
        if(assignedUser.rows.length > 0) {
          return result(assignedUser.rows[0]);
        } else {
          return result(false,res);
        }
      }
    });
  }

  function getCompanyAllRoles(req, client, err, done, res, callback) {
    client.query('SELECT user_role FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, userRoleList) {
      if (err) {
        console.error(err);
        handleResponse.shouldAbort(err, client, done);
        return callback(null);
        // handleResponse.responseToPage(res,'pages/resources-listing',{resources: [], userRoleList:[] , totalCount:0,activeCount:0, archivedCount:0,user:req.user, error:err},"error"," Error in finding user role for the company");
      } else {
        // console.log("userRoles");
        // console.log(userRoleList.rows[0].user_role);
        return callback(userRoleList.rows[0].user_role);
      }
    });
  }

  module.exports.checkProjectAssignment = checkProjectAssignment;
  module.exports.createProjectAssignment = createProjectAssignment;

  module.exports.checkTaskAssignment = checkTaskAssignment;
  module.exports.createTaskAssignment = createTaskAssignment;

  module.exports.getCompanyAllRoles = getCompanyAllRoles;
  module.exports.updateTaskAssignment = updateTaskAssignment;
  module.exports.checkTaskAssignmentForTask = checkTaskAssignmentForTask;
