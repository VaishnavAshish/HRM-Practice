const pg = require("pg");
const pool = require('./../config/dbconfig');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
const setting = require('./company-setting');
const commonController = require('./common-functions');
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
                            handleResponse.sendSuccess(res,'Project Comment added successfully',{});
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
