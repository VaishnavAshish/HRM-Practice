const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const commonController = require('./common-functions');
const email = require('./email');
let companyDefaultTimezone;

function dateFormat(gDate) {
  return(gDate.split(' ')[0]);
}

exports.postAddConversation = (req, res) => {

  req.assert('newConversationTitle', 'Conversation Title cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    if(errors.length>0){
          handleResponse.handleError(res, errors, ""+errors[0].msg);
        }else{
           handleResponse.handleError(res, errors, " Error in validating data.");
        }
  }
  else {
     setting.getCompanySetting(req, res ,(err,result)=>{
        if(err==true){
          handleResponse.handleError(res, err, ' Error in finding company setting');
        } else {
          companyDefaultTimezone=result.timezone;
          pool.connect((err, client, done) => {
            client.query('BEGIN', (err) => {
              if (err){
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' error in connecting to database');
              } else {
                client.query('INSERT INTO PROJECT_COMMENT (type,message,created_date,modified_date,company_id,project_id,resource_id) values ($1,$2,$3,$4,$5,$6,$7) RETURNING id', ['Conversation',req.body.newConversationTitle,'now()','now()',req.user.company_id,req.body.project_id,req.user.id], function (err, insertedProjectConversation) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in adding project conversation to the database');
                  } else {
                    client.query('COMMIT', (err) => {
                      if (err) {
                        // console.log('Error committing transaction', err.stack)
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in committing transaction');
                      } else {
                        done();
                        handleResponse.sendSuccess(res,'Project Conversation added successfully',{});
                      }
                    })
                  }
                })
              }
            })
          });
        }
      });
    }
};

exports.postEditConversation = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       handleResponse.handleError(res, err, ' Error in finding company setting');
     } else {
       companyDefaultTimezone=result.timezone;
       pool.connect((err, client, done) => {
         client.query('BEGIN', (err) => {
           if (err){
             handleResponse.shouldAbort(err, client, done);
             handleResponse.handleError(res, err, ' error in connecting to database');
           } else {
             client.query('SELECT type,message,created_date,modified_date,company_id,project_id,resource_id FROM PROJECT_COMMENT where id=$1', [req.body.conversation_id], function (err, selectedProjectConversation) {
               if (err) {
                 handleResponse.shouldAbort(err, client, done);
                 handleResponse.handleError(res, err, ' Error in finding project conversation in the database');
               } else {
                 client.query('UPDATE PROJECT_COMMENT SET message=$1 , modified_date=$2 where id = $3', [req.body.conversation_message,'now()',req.body.conversation_id], function (err, updatedProjectConversation) {
                   if (err) {
                     handleResponse.shouldAbort(err, client, done);
                     handleResponse.handleError(res, err, ' Error in updating project conversation in the database');
                   } else {
                       client.query('COMMIT', (err) => {
                         if (err) {
                           // console.log('Error committing transaction', err.stack)
                           handleResponse.shouldAbort(err, client, done);
                           handleResponse.handleError(res, err, ' Error in committing transaction');
                         } else {
                           done();
                           handleResponse.sendSuccess(res,'Project Conversation updated successfully',{});
                         }
                       })
                   }
                 })
               }
             })
           }
         })
       });
     }
   });
}

exports.deleteConversation = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
        client.query('DELETE FROM PROJECT_COMMENT where parent_id=$1', [req.body.conversation_id], function (err, deletedProjectConversation) {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in deleting project comment related to the conversation in the database');
          } else {
            client.query('DELETE FROM PROJECT_COMMENT where id=$1', [req.body.conversation_id], function (err, deletedProjectConversation) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in deleting project conversation in the database');
              } else {
                  client.query('COMMIT', (err) => {
                    if (err) {
                      // console.log('Error committing transaction', err.stack)
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in committing transaction');
                    } else {
                      done();
                      handleResponse.sendSuccess(res,'Project Conversation deleted successfully',{});
                    }
                  })
              }
            })
          }
        })
      }
    })
  });
}

exports.postAddComment = (req, res) => {
  // console.log('---req.body postAddComment---')
  // console.log(req.body)
  req.assert('newCommentTitle', 'Comment Title cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    if(errors.length>0){
          handleResponse.handleError(res, errors, ""+errors[0].msg);
        }else{
           handleResponse.handleError(res, errors, " Error in validating data.");
        }
  }
  else {
     setting.getCompanySetting(req, res ,(err,result)=>{
        if(err==true){
          handleResponse.handleError(res, err, ' Error in finding company setting');
        } else {
          companyDefaultTimezone=result.timezone;
          pool.connect((err, client, done) => {
            client.query('BEGIN', (err) => {
              if (err){
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' error in connecting to database');
              } else {
                client.query('INSERT INTO PROJECT_COMMENT (type,message,created_date,modified_date,company_id,project_id,resource_id,parent_id) values ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', ['Comment',req.body.newCommentTitle,'now()','now()',req.user.company_id,req.body.project_id,req.user.id,req.body.conversation_id], function (err, insertedProjectComment) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in adding project comment to the database');
                  } else {
                    client.query('UPDATE PROJECT_COMMENT SET modified_date = $1 WHERE id = $2 RETURNING *', ['now()',req.body.conversation_id], function (err, updatedProjectConversation) {
                      if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in adding project conversation to the database');
                      } else {
                        client.query('COMMIT', (err) => {
                          if (err) {
                            // console.log('Error committing transaction', err.stack)
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in committing transaction');
                          } else {
                            if(req.body.sendemail == true){
                              client.query('SELECT user_id FROM PROJECT_ASSIGNMENT where project_id =$1', [req.body.project_id],function (err, projectResourceIdList) {
                                if (err) {
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in finding project assignment users in the database');
                                } else {
                                  client.query('SELECT name FROM PROJECT where id =$1', [req.body.project_id],function (err, projectData) {
                                    if (err) {
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in finding project data in the database');
                                    } else {
                                      let userIdList = projectResourceIdList.rows.concat(updatedProjectConversation.rows[0].resource_id);
                                      console.log('userIdList');
                                      console.log(userIdList);
                                      client.query('SELECT id,email ,first_name ,last_name from users where id In (SELECT user_id FROM PROJECT_ASSIGNMENT where project_id =$1) OR id IN (SELECT resource_id FROM PROJECT_COMMENT where id =$2 OR parent_id = $2)', [req.body.project_id,req.body.conversation_id],function (err, selectedProjectUserList) {
                                        if (err) {
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.handleError(res, err, ' Error in finding project user in the database');
                                        } else {
                                            let selectedProjectConverationUser = selectedProjectUserList.rows.filter(user => user.id == updatedProjectConversation.rows[0].resource_id)[0];
                                            // if(projectResourceIdList.rows.indexOf(updatedProjectConversation.rows[0].resource_id)==-1){
                                            //   projectResourceIdList.rows = projectResourceIdList.rows.filter(projectResource => projectResource != updatedProjectConversation.rows[0].resource_id);
                                            // }
                                            console.log('selectedProjectConverationUser');
                                            console.log(selectedProjectUserList.rows)
                                            console.log(selectedProjectConverationUser);
                                            updatedProjectConversation.rows[0].email = selectedProjectConverationUser.email
                                            updatedProjectConversation.rows[0].first_name = selectedProjectConverationUser.first_name
                                            updatedProjectConversation.rows[0].last_name = selectedProjectConverationUser.last_name

                                            client.query('SELECT id,message,modified_date,parent_id,resource_id,(SELECT email from users where id = resource_id) as email , (SELECT first_name from users where id = resource_id) as first_name , (SELECT last_name from users where id = resource_id) as last_name FROM PROJECT_COMMENT pc where parent_id=$1 AND project_id=$2 ORDER BY modified_date desc LIMIT 10', [req.body.conversation_id,req.body.project_id],function (err, selectedProjectComment) {
                                              if (err) {
                                                handleResponse.shouldAbort(err, client, done);
                                                handleResponse.handleError(res, err, ' Error in adding project comment to the database');
                                              } else {
                                                // console.log('updatedProjectConversation.rows[0]');
                                                // console.log(updatedProjectConversation.rows[0]);
                                                // console.log(selectedProjectComment.rows);
                                                updatedProjectConversation.rows[0].modified_date = moment.tz(updatedProjectConversation.rows[0].modified_date, companyDefaultTimezone).format('MM-DD-YYYY hh:mm:ss');
                                                selectedProjectComment.rows.forEach(data=>{
                                                    data.modified_date = moment.tz(data.modified_date, companyDefaultTimezone).format('MM-DD-YYYY hh:mm:ss');
                                                })
                                                let projectResourceEmailList = ''
                                                selectedProjectUserList.rows.map(userData => projectResourceEmailList += userData.email+',');
                                                // console.log(projectResourceEmailList)
                                                // console.log(projectData.rows)

                                                sendConversationThread(req,res,updatedProjectConversation.rows[0],selectedProjectComment.rows,projectResourceEmailList,projectData.rows[0],function(){
                                                  done();
                                                  handleResponse.sendSuccess(res,'Project Comment added successfully',{});
                                                });
                                              }
                                            })
                                        }
                                      })
                                    }
                                  })
                                }
                              })
                            }else{
                                done();
                                handleResponse.sendSuccess(res,'Project Comment added successfully',{});
                            }
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          });
        }
      });
    }
}

function getRandomColor() {
     // var letters = 'BCDEF'.split('');
     // var color = '#';
     // for (var i = 0; i < 6; i++ ) {
     //     color += letters[Math.floor(Math.random() * letters.length)];
     // }
     // return color;

     // color = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
     // return color;
    return "#"+((1<<24)*Math.random()|0).toString(16);
 }


sendConversationThread = (req, res, conversation_thread, commentList,projectResourceEmailList,projectData,next) => {
  let serverName = process.env.BASE_URL;
  let commentListHTML = ``;
  let colorMap = new Map();
  commentList.forEach(commentData => {
    if(!colorMap.has(commentData.email)){
      colorMap.set(commentData.email,getRandomColor());
      // colorMap.set(commentData.email,"#DDDDDD");
    }
    commentHTML = `<tr>
                      <td  valign="top" style=" font-size:14px;font-family: arial,sans-serif; padding-top:10px; border-top: 1px solid #eee; color: #999; width:50px;">
                          <span style="border-radius: 50%; height:48px; width: 48px; text-align:center; line-height: 48px; background-color:${colorMap.get(commentData.email)}; display: inline-block; text-transform: uppercase; letter-spacing: 1px; color: white; font-size: 16px;">
                              ${commentData.first_name.substring(0,1).toUpperCase()}${commentData.last_name?commentData.last_name.substring(0,1).toUpperCase():''}
                          </span>
                      </td>
                      <td   style=" font-size:14px;font-family: arial,sans-serif; padding:10px 10px 25px 10px; border-top: 1px solid #eee; ">
                          <div style="font-size:11px; color: #999;">
                              ${commentData.modified_date} / By: ${commentData.first_name} ${commentData.last_name?commentData.last_name:''}
                          </div>
                          <div style="color: #505661; line-height: 1.5; font-size: 13px;">
                              ${commentData.message}
                          </div>
                      </td>
                  </tr>`
        commentListHTML += commentHTML;
  })
  console.log(commentListHTML);
  //<a href="javascript:void(0);" target="_blank"><img src="${process.env.BASE_URL}/getCompanyLogoForEmail/${req.user.company_id}" alt="company_logo" style="max-width:150px;"></a>

  let html = `<html><head></head><body>
                <div style="background-color: #f7f8f9;">
                  <table border="0" cellpadding="0" cellspacing="0"  width="100%" bgcolor="#f7f8f9">
                    <tbody>
                        <tr>
                            <td valign="top" align="center">
                                <h1>${req.user.company}</h1>
                            </td>
                        </tr>
                        <tr>
                            <td  valign="top" align="center">
                                <table border="0" cellpadding="0" cellspacing="0" height="100%" width="800px">
                                    <tr>
                                        <td  valign="top" >
                                            <table cellpadding="0" cellspacing="0"  width="100%" style="background: #fff; border: 1px solid #eee; margin: 0; padding: 30px; ">
                                                <tbody>
                                                    <tr>
                                                        <td  valign="top" >
                                                            <div style="font-family: arial,sans-serif; font-size:16px;  margin-bottom: 15px;">
                                                                <span style="color: #999;">
                                                                    Project :
                                                                </span>
                                                                ${projectData.name}
                                                            </div>
                                                            <div style="border-left: 3px solid #006dcc; padding-left: 10px; margin-top: 15px; margin-bottom: 15px;">
                                                                <div style="font-family: arial,sans-serif; font-size:24px; line-height: 1.5;  color: #006dcc;">
                                                                        ${conversation_thread.message}
                                                                </div>
                                                                <div style="font-family: arial,sans-serif; font-size:11px; font-weight:normal; color: #999;">
                                                                    Last Modify: ${conversation_thread.modified_date} / By: ${conversation_thread.first_name} ${conversation_thread.last_name?conversation_thread.last_name:''} ${conversation_thread.email}
                                                                </div>
                                                            </div>
                                                            <table border="0" cellpadding="0" cellspacing="0"  width="100%" style="table-layout: fixed;">
                                                                <tbody>
                                                                    ${commentListHTML}

                                                                </tbody>
                                                            </table>

                                                        </td>
                                                    </tr>

                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                  </table>
                  </div></body></html>`;




  const mailOptions = {
    to: projectResourceEmailList,
    from: '"'+req.user.company_info.name+'"support@krowsoftware.com',
    subject: "New Activity for Project: "+projectData.name,
    html: html
  };

  req.mailOptions = mailOptions;
  console.log('html of conversation is:')
  console.log(html);
  console.log(mailOptions)
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

exports.getAllRelatedComment = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       handleResponse.handleError(res, err, ' Error in finding company setting');
     } else {
       companyDefaultTimezone=result.timezone;
        pool.connect((err, client, done) => {
          client.query('BEGIN', (err) => {
            if (err){
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' error in connecting to database');
            } else {
                client.query('SELECT id,message,modified_date,parent_id,resource_id,(SELECT email from users where id = resource_id) as email , (SELECT first_name from users where id = resource_id) as first_name , (SELECT last_name from users where id = resource_id) as last_name, (SELECT user_img from users where id = resource_id) as user_img FROM PROJECT_COMMENT pc where parent_id=$1 AND project_id=$2 ORDER BY modified_date desc', [req.body.conversation_id,req.body.project_id], function (err, relatedCommentList) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in fetching project comment related to conversation from the database');
                  } else {
                      client.query('COMMIT', (err) => {
                        if (err) {
                          // console.log('Error committing transaction', err.stack)
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in committing transaction');
                        } else {
                          relatedCommentList.rows.forEach(data => {
                              data.modified_date = moment.tz(data.modified_date, companyDefaultTimezone).format('MM-DD-YYYY hh:mm:ss');
                          })
                          done();
                          handleResponse.sendSuccess(res,'Project Comment fetched successfully',{"relatedCommentList":relatedCommentList.rows});
                        }
                      })
                  }
                })
            }
          })
        });
      }
    });
}

exports.deleteComment = (req, res) => {
  console.log('inside deleteComment ');
  console.log(req.body);
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      if (err){
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' error in connecting to database');
      } else {
          client.query('DELETE FROM PROJECT_COMMENT where id=$1', [req.body.comment_id], function (err, deletedProjectComment) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in deleting project comment in the database');
            } else {
              client.query('UPDATE PROJECT_COMMENT SET modified_date = $1 WHERE id = $2', ['now()',req.body.conversation_id], function (err, updatedProjectConversation) {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in adding project conversation to the database');
                } else {
                  client.query('COMMIT', (err) => {
                    if (err) {
                      // console.log('Error committing transaction', err.stack)
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in committing transaction');
                    } else {
                      done();
                      handleResponse.sendSuccess(res,'Project Comment deleted successfully',{});
                    }
                  })
                }
              })
            }
          })
      }
    })
  });
}

exports.postEditComment = (req, res) => {
  console.log('inside postEditComment ');
  console.log(req.body);
  setting.getCompanySetting(req, res ,(err,result)=>{
     if(err==true){
       handleResmessageponse.handleError(res, err, ' Error in finding company setting');
     } else {
       companyDefaultTimezone=result.timezone;
       pool.connect((err, client, done) => {
         client.query('BEGIN', (err) => {
           if (err){
             handleResponse.shouldAbort(err, client, done);
             handleResponse.handleError(res, err, ' error in connecting to database');
           } else {
               client.query('UPDATE PROJECT_COMMENT SET message=$1,modified_date=$2 where id=$3', [req.body.comment_message,'now()',req.body.comment_id], function (err, updatedProjectComment) {
                 if (err) {
                   handleResponse.shouldAbort(err, client, done);
                   handleResponse.handleError(res, err, ' Error in updating project comment in the database');
                 } else {
                   client.query('UPDATE PROJECT_COMMENT SET modified_date = $1 WHERE id = $2', ['now()',req.body.conversation_id], function (err, updatedProjectConversation) {
                     if (err) {
                       handleResponse.shouldAbort(err, client, done);
                       handleResponse.handleError(res, err, ' Error in updating project conversation to the database');
                     } else {
                       client.query('COMMIT', (err) => {
                         if (err) {
                           // console.log('Error committing transaction', err.stack)
                           handleResponse.shouldAbort(err, client, done);
                           handleResponse.handleError(res, err, ' Error in committing transaction');
                         } else {
                           done();
                           handleResponse.sendSuccess(res,'Project Comment updated successfully',{});
                         }
                       })
                     }
                   })
                 }
               })
           }
         })
       });
     }
   });
}
