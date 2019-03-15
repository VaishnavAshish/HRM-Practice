const pg = require("pg");
var pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
var setting = require('./company-setting');
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
//   var mm = today.getMonth()+1; //January is 0!
//   var yyyy = today.getFullYear();
//   if(dd<10) {
//       dd = '0'+dd
//   }
//   if(mm<10) {
//       mm = '0'+mm
//   }
//   formatedDate = yyyy+'-'+mm+'-'+dd;
//   return formatedDate;
// }

exports.postAddProjectRes = (req, res) => {
    setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, errors, "Server Error : Error in find company setting.");
        /*handleResponse.handleError(res, err, 'Server Error: error in finding company setting');*/
      }else{

        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
          // console.log(req.body)
          req.assert('projectId', 'project cannot be blank').notEmpty();
          req.assert('accountId', 'account cannot be blank').notEmpty();
          req.assert('project_user', 'project user cannot be blank').notEmpty();
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
                client.query('SELECT pa.id ,pa.company_id ,pa.account_id ,pa.user_id ,pa.project_id ,pa.created_by ,pa.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,pa.updated_date at time zone \''+companyDefaultTimezone+'\' as updated_date ,pa.bill_rate ,pa.cost_rate ,pa.user_role ,pa.record_id FROM PROJECT_ASSIGNMENT pa WHERE company_id=$1 AND project_id=$2 AND user_id=$3 AND user_role=$4',[req.user.company_id, req.body.projectId, req.body.project_user,req.body.user_role], function(err, projectRes) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, 'Server error : Error in finding project assigment');
                    } else {
                        // console.log('projectRes >>>>>>>>>>>>>');
                        // console.log(projectRes.rows.length);
                        // console.log(req.body);
                        if(projectRes.rows.length === 0) {
                          // let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
                            client.query('INSERT INTO PROJECT_ASSIGNMENT (company_id, account_id, user_id, user_role, project_id, created_by, created_date, updated_date, bill_rate, cost_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[req.user.company_id, req.body.accountId, req.body.project_user, req.body.user_role, req.body.projectId, req.user.id, 'now()', 'now()', req.body.res_bill_rate, req.body.res_cost_rate], function(err, insertedRecord) {
                                // console.log('Error >>>>>>>>>>>>>');
                                // console.log(err);
                                if (err) {
                                  console.error(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, 'Server error : Error in adding project assigned to user in the database');
                                } else {
                                    done();
                                    // console.log('insertedRecord  >>>>>>>>>>>>>');
                                    // console.log(insertedRecord.rows);
                                    handleResponse.sendSuccess(res,'Project has successfully assigned to resource',{});
                                    /*res.status(200).json({"success": true ,"message":"success"});*/
                                }
                            });
                        } else {
                            done();
                            handleResponse.sendSuccess(res,'This project is already assigned to this user.',{'msg': 'This project is already assigned to this user.'});
                            /*res.status(200).json({"success": false, 'msg': 'This project is already assigned to this user.' ,"message":"This project is already assigned to this user."});*/
                        }
                    }
                })
            });
          }
        }
      });
};

    exports.deleteProjectRes = (req, res) => {

    let projectId = req.body.projectId;
    let userId = req.body.userId;
    let user_role = req.body.user_role;
    if(projectId==''||projectId==null||projectId==undefined) {
      handleResponse.handleError(res, "incorrect project id", "Server Error : Project id is not correct");
    } else if(userId==''||userId==null||userId==undefined) {
      handleResponse.handleError(res, "incorrect user id", "user id is not correct");
    } else {
            pool.connect((err, client, done) => {
                client.query('SELECT * FROM PROJECT_ASSIGNMENT WHERE id=$1',[req.body.assignment_id], function(err, projectRes) {
                    if (err) {
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, 'Server error : Error in finding project assignment data');
                    } else {
                        // console.log('projectRes >>>>>>>>>>>>>');
                        // console.log(projectRes.rows[0]);
                        if(projectRes.rows.length > 0) {
                            /* client.query('SELECT * FROM timesheet_line_item where project_id=$1 AND  id=$1',[req.body.assignment_id], function(err, deletedRecord) {
                            }); */
                            client.query('DELETE FROM PROJECT_ASSIGNMENT WHERE id=$1',[req.body.assignment_id], function(err, deletedRecord) {
                                // console.log('Error >>>>>>>>>>>>>');
                                // console.log(err);
                                if (err) {
                                    console.error(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, 'Server error : Error in deleting project assigned to user');
                                } else {
                                    done();
                                    handleResponse.sendSuccess(res,'User removed from the project successfully',{});
                                    /*res.status(200).json({"success": true ,"message":"success"});*/
                                }
                            });
                        } else {
                            done();
                            handleResponse.sendSuccess(res,'User already removed from this project.',{'msg': 'User already removed from this project.'});
                        }
                    }
                })
            });
        }
    };
