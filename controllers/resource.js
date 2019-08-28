const pg = require("pg");
const pool = require('./../config/dbconfig');
const userrole = require('./../config/user-role');
const email =require('./email');
const { promisify } = require('util');
const crypto = require('crypto');
const randomBytesAsync = promisify(crypto.randomBytes);
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
var setting = require('./company-setting');
let companyDefaultTimezone;
/*handleError = (res, reason, message, code) => {
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

getCompany = (companyid,next) => {

    if(companyid==''||companyid==null||companyid==undefined){
        handleResponse.handleError(res, 'incorrect company id', ' Company id is not correct ');
    }else{
      // console.log('getCompanyName-------------' + companyid)
      pool.connect((err, client, done) => {
        client.query('SELECT id,name FROM company where id=$1', [companyid], function (err, companies) {
          if (err) {
            // console.log(err);
            handleResponse.shouldAbort(err, client, done);
            next(error,null);
            /*res.render('pages/org-details', { company: companies.rows[0], user: req.user, error: err });*/
          } else {
            done();
            // console.log("comapny data is "+JSON.stringify(companies));
            next(null,companies.rows[0]);
          }
        })
      })
    }
}
getCompanyId = (domain,next) => {

    if(domain==''||domain==null||domain==undefined){
        handleResponse.handleError(res, 'incorrect company domain', ' Company domain is not correct ');
    }else{
      // console.log('getCompanyId-------------' + domain)
      pool.connect((err, client, done) => {
        client.query('SELECT id FROM company where domain=$1', [domain], function (err, companies) {
          if (err) {
            // console.log(err);
            handleResponse.shouldAbort(err, client, done);
            next(error,null);
            /*res.render('pages/org-details', { company: companies.rows[0], user: req.user, error: err });*/
          } else {
            done();
            // console.log("company data is "+JSON.stringify(companies));
            next(null,companies.rows[0].id);
          }
        })
      })
    }
}
exports.postResetPassword = (req, res) => {
  console.log('inside postResetPassword');
  req.assert('email', 'Email cannot be blank').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    handleResponse.handleError(res, errors, errors.message);

  }
  else{
      getCompanyId(req.body.domain,function(err,companyId){
          if(err){
              handleResponse.handleError(res, err, ' Error in finding company id with the given domain');
          }else{
            req.companyId=companyId;
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                    client.query('SELECT * FROM users where email = $1 AND company_id=$2', [req.body.email,companyId], function (err, existingUser) {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding user data');
                    } else {
                      // console.log("existingUser-----------");
                      // console.log(existingUser.rows);
                      if (existingUser.rows.length > 0) {
                        let createRandomToken = randomBytesAsync(16)
                                .then(buf => buf.toString('hex'));
                          createRandomToken.then( token =>{
                              // console.log(token);
                              client.query('UPDATE users set password_reset_token=$1 where email=$2 AND company_id=$3 RETURNING *',[token,req.body.email,companyId], function (err, user) {
                                if (err) {
                                  // console.log(err);
                                  handleResponse.shouldAbort(err, client, done);
                                  handleResponse.handleError(res, err, ' Error in updating user data');
                                } else {
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      // console.log('Error committing transaction', err.stack)
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, ' Error in committing transaction');
                                    } else {
                                      // console.log('--------user after update is--------');
                                      // console.log(user.rows[0].email);
                                      // console.log(user.rows[0].password_reset_token);
                                      req.token=token;
                                      sendResetEmail(req,res,function(error,response){
                                        // console.log('callback');
                                        if(error){
                                          handleResponse.shouldAbort(err, client, done);
                                          handleResponse.handleError(res, error, ' Error in sending email to user');
                                        }else{
                                          handleResponse.sendSuccess(res,'Password reset email send successfully',{});
                                          /*res.status(200).json({ "success": true,"message":"success" });*/
                                        }
                                      });
                                    }
                                  })

                                }

                              })
                          })

                      } else {
                        done();
                        handleResponse.handleError(res, 'incorrect email id', 'User with this email does not exists.');
                      }
                  }
                });
              }
            })
        });
    }
  })
 }
};
exports.postAddResource = (req, res) => {

  // console.log('inside post resource ' + req.body.email + req.body.first_name + req.body.last_name + req.body.phone + req.body.mobile + req.body.company);

    setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');

      }else{
        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
        let companyId = (req.body.company != undefined) ? req.body.company : req.user.company_id;
        // console.log('resource company id is ' + companyId);
            req.assert('email', 'Email cannot be blank').notEmpty();
            req.assert('first_name', 'First name cannot be blank').notEmpty();
            /*req.assert('password', 'Password cannot be blank').notEmpty();
            req.assert('first_name', 'First name cannot be blank').notEmpty();
            req.assert('last_name', 'Last name cannot be blank').notEmpty();*/

            const errors = req.validationErrors();

            if (errors) {
              handleResponse.handleError(res, errors, errors.message);
              /*req.flash('errors', errors);
              return res.redirect('/addCompany');*/
            }
            else{
                 pool.connect((err, client, done) => {
                  client.query('BEGIN', (err) => {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in connecting to the database');
                    } else {
                      client.query('SELECT u.id ,u.email ,u.password ,u.username ,u.company_id ,u.user_role ,u.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,u.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date ,u.first_name ,u.last_name ,u.phone ,u.mobile ,u.designation ,u.archived ,u.password_reset_token ,u.add_status ,u.bill_rate ,u.cost_rate ,u.permissions ,u.role ,u.record_id FROM users u where u.email = $1 AND u.company_id=$2', [req.body.email,req.user.company_id], function (err, existingUser) {
                        if (err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding user data');
                        } else {
                          // let created_date = moment.tz(new Date(), companyDefaultTimezone).format();
                          // console.log("existingUser-----------");
                          // console.log(existingUser);

                          if (existingUser.rows.length > 0) {
                            done();
                            handleResponse.handleError(res, 'User adding error', ' User with this email already exists.');
                          } else {
                            let createRandomToken = randomBytesAsync(16)
                                  .then(buf => buf.toString('hex'));
                            createRandomToken.then( token =>{
                                // console.log(token);
                                let user_role='{"USER"}';
                                if(parseInt(req.user.company_id) == parseInt('999999999999999')) {
                                  user_role = '{"SUPER_ADMIN"}';
                                }
                                client.query('Insert into USERS(email,user_role,first_name,last_name,phone,mobile,company_id,created_date,modified_date,add_status,password_reset_token,bill_rate,cost_rate,permissions, role) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)  RETURNING id', [req.body.email, user_role, req.body.first_name, req.body.last_name, req.body.phone, req.body.mobile, companyId, 'now()', 'now()', "Invited",token,req.body.bill_rate,req.body.cost_rate,req.body.permissions, req.body.user_role], function (err, user) {
                                  if (err) {
                                    // console.log(err);
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, ' Error in adding user data to the database');
                                  } else {
                                    client.query('COMMIT', (err) => {
                                      if (err) {
                                        console.error('Error committing transaction', err.stack)
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.handleError(res, err, ' Error in committing transaction to the database.');
                                      } else {
                                        done();
                                        // console.log(user);
                                        getCompany(companyId,function(err,company){
                                          if(err){
                                              handleResponse.handleError(res, err, ' Error in finding company with the given id');
                                          }else{
                                            // console.log(company);
                                            req.company=company;
                                            req.token=token;
                                            sendInvitationEmail(req,res,function(error,info){
                                              // console.log('callback');
                                              if(error){
                                                  handleResponse.shouldAbort(err, client, done);
                                                  handleResponse.handleError(res, error, ' Error in sending invitation email.');
                                              }else{
                                                  handleResponse.sendSuccess(res,'Resource added successfully',{});
                                                  /*res.status(200).json({ "success": true,"message":"success" });    */
                                              }
                                            })
                                          }
                                        });


                                      }
                                    })
                                  }
                                });
                            })
                            .catch(err=>{
                              console.log(err);
                              handleResponse.handleError(res, err, ' Error in generating random token');
                            });

                          }
                        }
                      });
                    }
                  });
                });
            }
      }
    });
};
sendInvitationEmail = (req, res, next) => {

    let mailOptions = {
      to: req.body.email,
      from: '"'+req.company.name+'"support@krowsoftware.com',
      subject: req.user.email+" has invited you to join Krow PSA"
    };
    let hostN=process.env.BASE_URL;
    let redirectUrl= hostN+'/reset/'+req.token;
    // console.log(hostN+' '+redirectUrl);
    let html='<html>'+
            '<body>'+
                '<div style="background-color: #f7f8f9;">'+
                    '<table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f7f8f9">'+
                        '<tbody>'+
                            '<tr>'+
                                '<td valign="top" align="center" style="padding-top: 20px; padding-bottom: 10px;">'+
                                        '<img src="'+process.env.BASE_URL+'/img/krow-logo.png" alt=""  width="84" height="29">'+
                           '</td>'+
                            '</tr>'+
                            '<tr>'+
                                '<td valign="top" align="center">'+
                                    '<table border="0" cellpadding="0" cellspacing="0" height="100%" width="600px">'+
                                        '<tbody>'+
                                            '<tr>'+
                                                '<td valign="top">'+
                                                    '<table cellpadding="0" cellspacing="0" width="100%" style="background: #fff; border: 1px solid #eee; margin: 0; padding: 30px; ">'+
                                                        '<tbody>'+
                                                            '<tr>'+
                                                                '<td valign="top">'+
                                                                    '<h1 style="font-family: arial,sans-serif; font-size:24px; font-weight:normal; line-height: 20px; color: orange;">'+
                                                                        '<strong>'+
                                                                            'You are invited to join '+req.company.name.toLowerCase()+' on Krow PSA.'+
                                                                        '</strong>'+
                                                                    '</h1>'+
                                                                    '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">'+
                                                                        req.user.email+' has invited you to join the Krow PSA for company '+req.company.name.toLowerCase()+' . <br><br> Click the button below to join!'+
                                                                    '</p>'+
                                                                    '<table border="0" cellpadding="0" cellspacing="0" width="100%">'+
                                                                        '<tbody>'+
                                                                            '<tr>'+
                                                                                '<td align="center" style="padding: 15px;">'+
                                                                                    '<table cellpadding="0" cellspacing="0" width="300px" style="margin: 0; padding: 0;">'+
                                                                                        '<tbody>'+
                                                                                            '<tr>'+
                                                                                                '<td align="center" style="font-family: arial,sans-serif;">'+
                                                                                                    '<a href="'+redirectUrl+'" target="_blank" style="font-size:14px; color: #ffffff; font-weight:normal; background: #0070d2; border-radius: 4px; display:block; padding: 12px 30px 12px 30px; text-decoration: none;">Join Team</a>'+
                                                                                                '</td>'+
                                                                                            '</tr>'+
                                                                                        '</tbody>'+
                                                                                    '</table>'+
                                                                                '</td>'+
                                                                            '</tr>'+
                                                                        '</tbody>'+
                                                                    '</table>'+

                                                                '</td>'+
                                                            '</tr>'+

                                                        '</tbody>'+
                                                    '</table>'+
                                                '</td>'+
                                            '</tr>'+
                                        '</tbody>'+
                                    '</table>'+
                                '</td>'+
                            '</tr>'+
                            '<tr>'+
                                '<td valign="top" align="center" style=" font-family: arial,sans-serif; padding:20px 20px 20px 20px; color: #999; font-size: 14px;">'+
                                    'For more help and support'+
                                    '<a href="/" target="_blank" style="color: #4387fd;">contact us</a>'+
                                '</td>'+
                            '</tr>'+
                        '</tbody>'+
                    '</table>'+
                '</div>'+
            '</body>'+

            '</html>';
            // '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">'+
            //     'Join team'+
            // '</p>'+
            // '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-bottom: 5px;">'+
            //     'Thanks,'+
            // '</p>'+
            // '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-top: 5px;">'+
            //     req.user.email
            // '</p>'+
    mailOptions.html=html;
    req.mailOptions=mailOptions;
    // console.log('transpoter');
    email.sendMail(req,res,function(error,info){
       // console.log('transpoter');
        if(error){
            // console.log(error);
            next(error,null);
        }else{
            // console.log('Message sent: ' + info.response);
            next(null,info);
            /*res.status(200).json({"success": true,"message":"success" });*/
        }
    });
};
sendResetEmail = (req,res,next)=>{
  let mailOptions = {
      to: req.body.email,
      from: '"'+req.body.domain.split('.')[0]+'"support@krowsoftware.com',
      subject: "Krow PSA reset password"
    };
    let hostN=process.env.BASE_URL;
    let redirectUrl= hostN+'/reset/'+req.token;
    let firstName = req.body.first_name?req.body.first_name:'';
    let lastName = req.body.last_name?req.body.last_name:'';
    // console.log(hostN+' '+redirectUrl);
  let html= '<html>'+
   '<body>'+
      '<div style="background-color: #f7f8f9;">'+
          '<table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f7f8f9">'+
              '<tbody>'+
                  '<tr>'+
                      '<td valign="top" align="center" style="padding-top: 20px; padding-bottom: 10px;">'+
                          '<a href="javascript:void(0);" target="_blank">'+
                              '<img src="'+process.env.BASE_URL+'/img/krow-logo.png" alt="" height="29" width="84">'+
                          '</a>'+
                      '</td>'+
                  '</tr>'+
                  '<tr>'+
                      '<td valign="top" align="center">'+
                          '<table border="0" cellpadding="0" cellspacing="0" height="100%" width="600px">'+
                              '<tbody>'+
                                  '<tr>'+
                                      '<td valign="top">'+
                                          '<table cellpadding="0" cellspacing="0" width="100%" style="background: #fff; border: 1px solid #eee; margin: 0; padding: 30px; ">'+
                                              '<tbody>'+
                                                  '<tr>'+
                                                      '<td valign="top">'+
                                                          '<h5 style="font-family: arial,sans-serif; font-size:18px; font-weight:normal;margin: 0; ">'+
                                                              'Hi '+firstName+' '+lastName+','+mailOptions.to+
                                                          '</h5>'+
                                                          '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">'+
                                                              'We have received a request to reset the password for account '+mailOptions.to+'. If you made this request, Click the link below to '+
                                                              'change your password:'+
                                                          '</p>'+
                                                          '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal;">'+
                                                              '<table border="0" cellpadding="0" cellspacing="0" width="100%">'+
                                                                  '<tbody>'+
                                                                      '<tr>'+
                                                                          '<td align="center" style="padding: 15px;">'+
                                                                              '<table cellpadding="0" cellspacing="0" width="300px" style="margin: 0; padding: 0;">'+
                                                                                  '<tbody>'+
                                                                                      '<tr>'+
                                                                                          '<td align="center" style="font-family: arial,sans-serif;">'+
                                                                                              '<a href="'+redirectUrl+'" target="_blank" style="font-size:14px; color: #ffffff; font-weight:normal; background: #0070d2; border-radius: 4px; display:block; padding: 12px 30px 12px 30px; text-decoration: none;">Reset Password</a>'+
                                                                                          '</td>'+
                                                                                      '</tr>'+
                                                                                  '</tbody>'+
                                                                              '</table>'+
                                                                          '</td>'+
                                                                      '</tr>'+
                                                                  '</tbody>'+
                                                              '</table>'+
                                                          '</p>'+
                                                          '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">'+
                                                              'If you did not make this request, you can safely ignore this email'+
                                                          '</p>'+
                                                          '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-bottom: 5px;">'+
                                                              'Thanks,'+
                                                          '</p>'+
                                                          '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-top: 5px;">'+
                                                              'The Team at Krow'+
                                                          '</p>'+
                                                      '</td>'+
                                                  '</tr>'+
                                              '</tbody>'+
                                          '</table>'+
                                      '</td>'+
                                  '</tr>'+
                              '</tbody>'+
                          '</table>'+
                      '</td>'+
                  '</tr>'+
                  '<tr>'+
                      '<td valign="top" align="center" style=" font-family: arial,sans-serif; padding:20px 20px 20px 20px; color: #999; font-size: 14px;">'+
                          'For more help and support'+
                          '<a href="/" target="_blank" style="color: #4387fd;"> contact us</a>'+
                      '</td>'+
                  '</tr>'+
              '</tbody>'+
          '</table>'+
      '</div>'+
   '</body>'+
   '</html>';
   //console.log('html');
   //console.log(html);
   mailOptions.html=html;
    req.mailOptions=mailOptions;
    // console.log('transpoter');
    email.sendMail(req,res,function(error,info){
       // console.log('transpoter');
        if(error){
            console.log(error);
            next(error,null);
        }else{
            console.log('Message sent: ' + info.response);
            next(null,info);
            /*res.status(200).json({"success": true,"message":"success" });*/
        }
    });
}

exports.deleteResource = (req, res) => {

  // console.log('inside delete resource id is ' + req.body.resourceId);
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');

      }else{
        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
        let resourceId=req.body.resourceId;
        console.log('resourceId '+resourceId);
        if(resourceId==''||resourceId==null||resourceId==undefined){
          handleResponse.handleError(res, "incorrect resource id", " Resource id is not correct");
        }else{
            pool.connect((err, client, done) => {
              client.query('BEGIN', (err) => {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' error in connecting to database');
                } else {
                  // console.log(req.body.resourceId);
                  client.query('SELECT * FROM users WHERE id=$1', [req.body.resourceId], function (err, userDetails) {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in deleting resource.');
                    }else{
                      console.log('user details are '+JSON.stringify(userDetails.rows[0]));
                      if(userDetails.rows[0].user_role.includes('ADMIN') || parseInt(req.body.resourceId) == parseInt(req.user.id)) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, 'You can not delete this user.');
                      } else {
                        client.query('UPDATE users SET archived=true where id =$1', [req.body.resourceId], function (err, resource) {
                          if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in deleting resource.');
                          }else{
                            client.query('COMMIT', (err) => {
                              if (err) {
                                // console.log('Error committing transaction', err.stack)
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in committing transaction');
                              } else {
                                done();
                                handleResponse.sendSuccess(res,'Resource deleted successfully',{});
                                res.end();
                              }
                            })
                          }

                        });
                      }
                    }
                  })
                }
              })
            })
          }
        }
      });

}

exports.updateResourcePassword = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        handleResponse.handleError(res, err, ' error in finding company setting');

      }else{
        companyDefaultTimezone=result.timezone;

        req.assert('new_password', 'New Password cannot be blank').notEmpty();
        req.assert('old_password', 'Old Password cannot be blank').notEmpty();

        const errors = req.validationErrors();

        if (errors) {
          handleResponse.handleError(res, errors, errors.message);
        }
        else {
          pool.connect((err, client, done) => {
            client.query('BEGIN', (err) => {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in connecting to database .');
              } else {
                client.query('SELECT email,password FROM USERS WHERE id=$1',[req.user.id], function (err, selectedUser) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in getting resource data');
                  } else {
                    if(selectedUser.rows[0].password != req.body.old_password){
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, 'Old password is not correct.Please enter correct password.');
                    }else{
                      client.query('UPDATE users set password=$1 where id=$2  RETURNING *', [req.body.new_password, req.user.id], function (err, updatedResource) {
                        if (err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in updating resource password');
                        } else {
                          // console.log("resource------------");
                          // console.log(resource);
                          client.query('COMMIT', (err) => {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              console.error('Error committing transaction', err.stack);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            }else{
                              done();
                              handleResponse.sendSuccess(res,'Resource password updated successfully',{});
                            }
                          })

                        }
                      });

                    }
                  }
                });

              }
            });
          });
        }
    }
  });
};

exports.updateResource = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, ' error in finding company setting');

      }else{
        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
        // console.log('inside update resource ' + req.body.email + req.body.first_name + req.body.last_name + req.body.phone + req.body.mobile);
        /*// console.log(req.body.profile_role);*/
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.assert('first_name', 'First name cannot be blank').notEmpty();
         /*req.assert('last_name', 'Last name cannot be blank').notEmpty();*/

        const errors = req.validationErrors();

        if (errors) {
          handleResponse.handleError(res, errors, errors.message);
        }
        else {
          pool.connect((err, client, done) => {
            client.query('BEGIN', (err) => {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in connecting to database .');
              } else {
                let permissions=(req.body.permissions)?req.body.permissions:req.user.permissions;
                // let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
                client.query('SELECT * FROM USERS WHERE id=$1',[req.body.id], function (err, selectedUser) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in updating resource data');
                  } else {
                    // console.log('-----------selectedUser----------');
                    // console.log(selectedUser.rows[0]);
                    // console.log('------------------req.body.bill_rate---------');
                    req.body.bill_rate=(req.body.bill_rate==undefined||req.body.bill_rate==null||req.body.bill_rate=='')?selectedUser.rows[0].bill_rate:req.body.bill_rate;
                    req.body.cost_rate=(req.body.cost_rate==undefined||req.body.cost_rate==null||req.body.cost_rate=='')?selectedUser.rows[0].cost_rate:req.body.cost_rate;
                    client.query('UPDATE users set email=$1,first_name=$2,last_name=$3,phone=$4,mobile=$5,modified_date=$6,bill_rate=$7,cost_rate=$8,permissions=$9,role=$10 where id=$11  RETURNING *', [req.body.email, req.body.first_name, req.body.last_name, req.body.phone, req.body.mobile, 'now()',req.body.bill_rate,req.body.cost_rate,permissions,req.body.user_role, req.body.id], function (err, resource) {
                      if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in updating resource data');
                      } else {
                        // console.log("resource------------");
                        // console.log(resource);
                        client.query('COMMIT', (err) => {
                          if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            console.error('Error committing transaction', err.stack);
                            handleResponse.handleError(res, err, ' Error in committing transaction');
                          }else{
                            let userData=resource.rows[0];
                            if(userData.id==req.user.id){
                                req.login(userData, function(err) {
                                    if (err) {
                                      try {
                                          res.clearCookie('remember_me');
                                          req.logout();
                                          req.session.destroy((error) => {
                                            if (error) {
                                              // console.log('Error : Failed to destroy the session during logout.', err);
                                              handleResponse.handleError(res, error, ' Failed to destroy the session during logout.');
                                            }else{
                                              req.user = null;
                                             /* window.history.forward();*/
                                              /*shouldAbort(err, client, done);*/
                                              handleResponse.handleError(res, err, ' Error in user logout before logging in another user.');
                                              /*res.redirect('/login?error=2&domain=' + domain);*/
                                            }
                                          });
                                        } catch (err) {
                                          console.debug("--------3333-" + err);

                                          handleResponse.handleError(res, err, ' Error in user logout');
                                          /*res.redirect('/login?error=3&domain=' + domain);*/
                                        }
                                    }else{
                                      userData.domain = req.user.domain;
                                      // console.log('inside relogin after update user is ' + JSON.stringify(userData));
                                      var pages = userrole.setupPagePermissions(userData, req.user);
                                      // console.log("userData=========================");
                                      userData.pages = pages;
                                      // console.log(userData);
                                      done();
                                      handleResponse.sendSuccess(res,'Resource updated successfully',{});
                                      /*res.status(200).json({ "success": true ,"message":"success"});*/
                                    }


                                })
                            }else{
                              let userToRefresh={};
                              userToRefresh.userid=userData.id;
                              inputUser.push(userToRefresh);
                              done();
                              handleResponse.sendSuccess(res,'Resource updated successfully',{});
                            }
                          }
                        })

                      }
                    });
              }
            });

              }
            });
          });
        }
    }
  });
};


exports.findResourceByCriteria = (req, res) => {
  // console.log("findResourceByCriteria----------------------------------"+req.body.searchField);
  let company_id=(req.body.company_id)?req.body.company_id:req.user.company_id;
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
            let searchCriteriaVal=[company_id];
            let whereClause='WHERE company_id=$1 ';
            if(req.body.searchField.length>0){
              let searchField=req.body.searchField;
              searchField.forEach((search,index)=>{
                  whereClause+='AND '+search.fieldName+' $'+(index+2)+' ';
                  searchCriteriaVal.push(search.fieldValue);
              });
              /*let queryToExec='SELECT * FROM account WHERE '+req.body.searchField+' like $1 AND company_id=$2';*/
            }
            client.query('SELECT name FROM company WHERE id=$1',[company_id], function (err, company) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding company data');
              }else{

                    let offset=0;
                    if(req.body.offset){
                      offset=req.body.offset;
                    }
                    let queryToExec='SELECT u.id ,u.email ,u.password ,u.username ,u.company_id ,u.user_role ,u.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,u.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date,u.first_name ,u.last_name ,u.phone ,u.mobile ,u.designation ,u.archived ,u.password_reset_token ,u.add_status ,u.bill_rate ,u.cost_rate ,u.permissions ,u.role ,u.record_id,(SELECT count(*) from USERS '+whereClause+') as searchcount FROM USERS u '+whereClause+' ORDER BY created_date DESC,email OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
                    if(req.body.company_id){
                        whereClause=' WHERE company_id=$1 AND archived=$2 AND email ilike $3';
                        queryToExec='SELECT u.id ,u.email ,u.password ,u.username ,u.company_id ,u.user_role ,u.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,u.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date,u.first_name ,u.last_name ,u.phone ,u.mobile ,u.designation ,u.archived ,u.password_reset_token ,u.add_status ,u.bill_rate ,u.cost_rate ,u.permissions ,u.role ,u.record_id,(SELECT count(*) from USERS '+whereClause+') as searchcount FROM USERS u '+whereClause+' ORDER BY created_date DESC,email OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
                        if(req.body.searchField&&req.body.searchField.length>0){
                            searchCriteriaVal=[req.body.company_id,false,req.body.searchField[0].fieldValue];
                        }else{
                            searchCriteriaVal=[req.body.company_id,false,'%%'];
                        }
                    }
                    // console.log('queryToExec '+queryToExec+' searchCriteriaVal'+searchCriteriaVal);
                    client.query(queryToExec,searchCriteriaVal, function (err,users) {
                      if (err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding resource data');
                      }
                      else{
                          let searchCount=0;
                          // console.log(JSON.stringify(users.rows));
                          if(users.rows.length>0){
                                users.rows.forEach(function(userData){
                                  if(userData.archived) {
                                    userData['user_status'] = "Archived";
                                  } else if(!userData.archived && userData.add_status != "Invited") {
                                    userData['user_status'] = "Active"
                                  } else {
                                    userData['user_status'] = "Invited";
                                  }
                                    userData.created_date=moment.tz(userData.created_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    userData.modified_date=moment.tz(userData.modified_date, companyDefaultTimezone).format('MM-DD-YYYY');
                                    // userData.created_date=dateFormat(userData.created_date);
                                    // userData.modified_date=dateFormat(userData.modified_date);
                                })

                                searchCount=users.rows[0].searchcount;
                                // console.log('search count result is: '+users.rows[0].searchcount);
                              }
                          done();
                          handleResponse.sendSuccess(res,'Resources searched successfully',{resources: users.rows,company:company.rows[0].name,count:searchCount});
                      }
                    });
                  }
                });
          })
      }
    });
};

exports.findUserByEmail = (req, res) => {
  // console.log("findUserByEmail----------------------------------"+req.body.searchText+' '+req.body.companyId);

  let company_id=(req.body.company_id)?req.body.company_id:req.user.company_id;
  // console.log('company_id '+req.body.company_id);
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
            let queryToExec='SELECT u.id ,u.email ,u.password ,u.username ,u.company_id ,u.user_role ,u.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,u.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date,u.first_name ,u.last_name ,u.phone ,u.mobile ,u.designation ,u.archived ,u.password_reset_token ,u.add_status ,u.bill_rate ,u.cost_rate ,u.permissions ,u.role ,u.record_id FROM users u WHERE email ilike $1'+'%'+req.body.searchText+'%';
            client.query('SELECT name FROM company WHERE id=$1',[company_id], function (err, company) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                /*handleResponse.responseToPage(res,'pages/org-listing',{user:req.user, error:err},"error"," Error in finding company data");*/
                handleResponse.handleError(res, err, ' Error in finding company data');
              }else{
                let offset=0;
                if(req.body.offset){
                  offset=req.body.offset;
                }
                let queryToExec='SELECT u.id ,u.email ,u.password ,u.username ,u.company_id ,u.user_role ,u.created_date at time zone \''+companyDefaultTimezone+'\' as created_date,u.modified_date at time zone \''+companyDefaultTimezone+'\' as modified_date,u.first_name ,u.last_name ,u.phone ,u.mobile ,u.designation ,u.archived ,u.password_reset_token ,u.add_status ,u.bill_rate ,u.cost_rate ,u.permissions ,u.role ,u.record_id,(select count(*) from Users WHERE '+req.body.searchField+' ilike $1 AND company_id=$2 AND archived=false ) as searchCount FROM Users u WHERE '+req.body.searchField+' ilike $1 AND company_id=$2 AND archived=false ORDER BY created_date DESC,email OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
                // console.log("queryToExec "+queryToExec);
                client.query(queryToExec,['%'+req.body.searchText+'%',company_id], function (err, users) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    /*handleResponse.responseToPage(res,'pages/org-listing',{user:req.user, error:err},"error"," Error in finding company data");*/
                    handleResponse.handleError(res, err, ' Error in finding company users');
                  }
                  else{
                      let searchCount=0;
                      if(users.rows.length>0){
                        users.rows.forEach(function(userData){
                            // userData.created_date=dateFormat(moment.tz(userData.created_date, companyDefaultTimezone).format());
                            // userData.modified_date=dateFormat(moment.tz(userData.modified_date, companyDefaultTimezone).format());
                            userData.created_date=dateFormat(userData.created_date);
                            userData.modified_date=dateFormat(userData.modified_date);
                        })
                        searchCount=users.rows[0].searchcount;
                        // console.log('search count result is: '+users.rows[0].searchcount);
                      }
                      // console.log(JSON.stringify(users.rows));
                      done();
                      handleResponse.sendSuccess(res,'Users searched successfully',{resources: users.rows,company:company.rows[0].name,count:searchCount});
                      /*handleResponse.responseToPage(res,'pages/org-listing',{ compnies: companies.rows, user: req.user },"success","Successfully rendered");*/
                      /*res.render('pages/org-listing', { compnies: companies.rows, user: req.user, error: err });*/

                  }
                });
              }
            });
          })
      }
    });
};
