const isValidDomain = require('is-valid-domain');
var pool = require('./../config/dbconfig');
const email = require('./email');
const { promisify } = require('util');
const crypto = require('crypto');
const randomBytesAsync = promisify(crypto.randomBytes);
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
var setting = require('./company-setting');
let companyDefaultTimezone;

Array.prototype.contains = function (needle) {
  for (i in this) {
    if (this[i] == needle) return true;
  }
  return false;
}

/*handleError = (res, reason, message, code) => {
  // console.log("ERROR: " + reason);
  res.status(code || 500).json({ "success": false, "message": message });
}

shouldAbort = (err, client, done) => {
  console.error('inside shouldAbort');
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
  var sDate = new Date(gDate);
  var date = sDate.getDate();
  var month = sDate.getMonth() + 1;
  var year = sDate.getFullYear();
  var formatedDate = '';
  if (month != 10 && month != 11 && month != 12) {
    if (date < 10) {
      formatedDate = year + '-0' + month + '-0' + date;
    } else {
      formatedDate = year + '-0' + month + '-' + date;
    }

  } else {
    if (date < 10) {
      formatedDate = year + '-' + month + '-0' + date;
    } else {
      formatedDate = year + '-' + month + '-' + date;
    }

  }
  // console.log(formatedDate);
  return formatedDate;
}


exports.getResourceDetail = (req, res) => {
  if (req.user) {
    let userId = req.query.userid;
    if (userId == '' || userId == null || userId == undefined) {
      handleResponse.responseToPage(res,'pages/resource-details',{resource: {},userRoleList:[], isSuperAdmin: req.session.passport.user.user_role.contains('SUPER_ADMIN'), company: req.query.comp_name,user:req.session.passport.user, error:err},"error","User id is not correct.");
    } else {
      // console.log('getResourceDetail-------------' + req.query.userid + ' request user session is ' + req.session.passport.user.user_role.contains('SUPER_ADMIN'));
      pool.connect((err, client, done) => {
        client.query('SELECT * FROM users where id=$1', [req.query.userid], function (err, resource) {
          if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/resource-details',{resource: {},userRoleList:[], isSuperAdmin: req.session.passport.user.user_role.contains('SUPER_ADMIN'), company: req.query.comp_name,user:req.session.passport.user, error:err},"error","Server Error: Error in finding user");

          } else {
            client.query('SELECT user_role FROM SETTING WHERE company_id=$1', [resource.rows[0].company_id], function (err, userRoleList) {
            if (err) {
              console.error(err);
              handleResponse.shouldAbort(err, client, done);
              handleResponse.responseToPage(res,'pages/resources-details',{resource: {},userRoleList:[], isSuperAdmin: req.session.passport.user.user_role.contains('SUPER_ADMIN'), company: req.query.comp_name,user:req.session.passport.user, error:err},"error"," Error in finding user role for the company");
            }
            else {
                // console.log('-----------resource detail-------');
                // console.log(resource.rows[0]);
                let userRole=['Manager'];
                if(userRoleList.rows.length>0){
                  userRole=userRoleList.rows[0].user_role;
                }
                done();
                handleResponse.responseToPage(res,'pages/resource-details',{resource: resource.rows[0],userRoleList:userRole, isSuperAdmin: req.session.passport.user.user_role.contains('SUPER_ADMIN'), company: req.query.comp_name, user: req.session.passport.user},"success","Successfully rendered");
                }
            })
          }
        })

      })
    }
  } else {
    done();
    res.redirect('/domain');
  }
};


exports.getCompanyDetail = (req, res) => {
  if (req.user) {
    let companyid = req.query.companyid;
    if (companyid == '' || companyid == null || companyid == undefined) {
      handleResponse.responseToPage(res,'pages/org-details',{ admin: {}, company: {}, resources: [], count:0,userRoleList:[],user: req.session.passport.user, error:err},"error","Server Error: Company id is not correct");
      /*handleResponse.handleError(res, 'incorrect company id', 'company id is not correct ');*/
    } else {
      // console.log('getCompanyDetail-------------' + req.query.companyid)
      pool.connect((err, client, done) => {
        client.query('SELECT * FROM company where id=$1', [req.query.companyid], function (err, companies) {
          if (err) {
            // console.log(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/org-details',{admin: {}, company: {}, resources: [], count:0,userRoleList:[],user:req.session.passport.user, error:err},"error","Server Error: Error in finding company");
            /*handleResponse.handleError(res, err, 'Server Error: Error in finding company');*/
            /*res.render('pages/org-details', { company: companies.rows[0], user: req.session.passport.user, error: err });*/
          } else {

            client.query('SELECT u.*,(select count(*) from Users where company_id=$1 AND archived=$2) as total FROM Users u where company_id=$1 AND archived=$2 ORDER BY created_date DESC,email OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO, [req.query.companyid, false], function (err, resourceList) {
              if (err) {
                // console.log(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.responseToPage(res,'pages/org-details',{admin: {}, company: {}, resources: [], count:0,userRoleList:[],user:req.session.passport.user, error:err},"error","Server Error: Error in finding users for the company");
                /*handleResponse.handleError(res, err, 'Server Error: Error in finding users for the company');*/
              }else{
                client.query('SELECT user_role FROM SETTING WHERE company_id=$1', [req.query.companyid], function (err, userRoleList) {
                if (err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.responseToPage(res,'pages/org-details',{admin: {}, company: {}, resources: [], count:0,userRoleList:[],user:req.session.passport.user, error:err},"error"," Error in finding user role for the company");
                }
                else {
                            let admin_user = resourceList.rows.filter(function (resource) {
                              let user_role = resource.user_role;
                              return user_role.contains("ADMIN");
                            });
                            let totalCount=0;
                            if (resourceList.rows.length > 0) {
                              resourceList.rows.forEach(function (data) {
                                let created_date = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                                let modified_date = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                                data["created_date"] = created_date;
                                data["modified_date"] = modified_date;
                              })
                              totalCount=resourceList.rows[0].total;
                            }
                            let userRole=['Manager'];
                            if(userRoleList.rows.length>0){
                              userRole=userRoleList.rows[0].user_role;
                            }
                            if (companies.rows.length > 0) {
                              companies.rows.forEach(function (data) {
                                let created_date = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                                let modified_date = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                                data["created_date"] = created_date;
                                data["modified_date"] = modified_date;
                              })
                            }

                            console.error('getAllCompanyResources>>>>>>>>>>>>> ' + JSON.stringify(resourceList));
                            // console.log('admin user is ' + JSON.stringify(admin_user))
                            done();
                            handleResponse.responseToPage(res,'pages/org-details',{ admin: admin_user[0], company: companies.rows[0], resources: resourceList.rows, user: req.session.passport.user,count:totalCount,userRoleList:userRole},"success","Successfully rendered");
                            /*res.render('pages/org-details', { admin: admin_user[0], company: companies.rows[0], resources: resourceList.rows, user: req.session.passport.user, error: err });*/
                      }

                  })

              }

            })
          }
        })
      })
    }
  } else {
    done();
    res.redirect('/domain');
  }
};

exports.getUserProfile = (req, res) => {
  if (req.user) {

    // console.log('getUserProfile-------------' + req.user.id);
    // console.log('getUserProfile-------------' + JSON.stringify(req.user));

    pool.connect((err, client, done) => {
      client.query('SELECT * FROM users where id=$1', [req.user.id], function (err, users) {
        if (err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.responseToPage(res,'pages/user-profile',{userObj: {},user:req.session.passport.user, error:err},"error","Server Error: Error in finding user");
          /*handleResponse.handleError(res, err, 'Server Error: Error in finding user');*/
        }
        if (users.rows.length > 0) {

          let created_date = dateFormat(moment.tz(users.rows[0].created_date, companyDefaultTimezone).format());
          let modified_date = dateFormat(moment.tz(users.rows[0].modified_date, companyDefaultTimezone).format());
          users.rows[0].created_date = created_date;
          users.rows[0].modified_date = modified_date;
        }
        console.error('getUserProfile>>>>>>>>>>>>> ' + JSON.stringify(users));
        done();
        handleResponse.responseToPage(res,'pages/user-profile',{ userObj: users.rows[0], user: req.session.passport.user},"success","Successfully rendered");
        /*res.render('pages/user-profile', { userObj: users.rows[0], user: req.session.passport.user, error: err });*/
      })
    })
  } else {
    done();
    res.redirect('/domain');
  }
};

exports.getCompanyProfile = (req, res) => {
  if (req.user) {
    // console.log('getCompanyProfile-------------' + req.user.id)
    pool.connect((err, client, done) => {
      client.query('SELECT * FROM Company where id=$1', [req.user.company_id], function (err, companies) {
        if (err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.responseToPage(res,'pages/company_profile',{company: {},user:req.session.passport.user, error:err},"error"," Error in finding company");
          /*handleResponse.handleError(res, err, 'Server Error: Error in finding company');*/
        }

        if (companies.rows.length > 0) {
          let created_date = dateFormat(moment.tz(companies.rows[0].created_date, companyDefaultTimezone).format());
          let modified_date = dateFormat(moment.tz(companies.rows[0].modified_date, companyDefaultTimezone).format());
          companies.rows[0].created_date = created_date;
          companies.rows[0].modified_date = modified_date;

        }
        console.error('getCompanyProfile>>>>>>>>>>>>> ' + JSON.stringify(companies));
        done();
        handleResponse.responseToPage(res,'pages/company_profile',{company: companies.rows[0], user: req.session.passport.user },"success","Successfully rendered");
        /*res.render('pages/company_profile', { company: companies.rows[0], user: req.session.passport.user, error: err });*/
      })
    })
  } else {
    done();
    res.redirect('/domain');
  }
};

exports.getAllCompanyResources = (req, res) => {
    // console.log('getAllCompanyResources-------------' + req.user.company_id);
    pool.connect((err, client, done) => {
      let queryToExec='SELECT u.*,(select count(*) from Users where company_id=$1) as totalCount,(select count(*) from Users where company_id=$1 AND archived=$2) as activeCount FROM Users u where company_id=$1  ORDER BY created_date DESC,email OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO;
      client.query(queryToExec, [req.user.company_id,false], function (err, resourceList) {
        if (err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.responseToPage(res,'pages/resources-listing',{resources: [], userRoleList:[] , totalCount:0,activeCount:0, archivedCount:0,user:req.session.passport.user, error:err},"error"," Error in finding user for the company");
          /*handleResponse.handleError(res, err, 'Server Error: Error in finding user for the company');*/
        }
        else {
          client.query('SELECT user_role FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, userRoleList) {
          if (err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/resources-listing',{resources: [], userRoleList:[] , totalCount:0,activeCount:0, archivedCount:0,user:req.session.passport.user, error:err},"error"," Error in finding user role for the company");
          }
          else {
              /*let userList=[];*/
              /*let resList=resourceList.rows;*/
              let totalCount,activeCount,archivedCount;
              totalCount=activeCount=archivedCount=0;

              if(resourceList.rows.length>0){
                /*userList=resList.filter(user => user.archived==false);*/
                resourceList.rows.forEach(function (data) {
                  if(data.archived) {
                    data['user_status'] = "Archived";
                  } else if(!data.archived && data.add_status != "Invited") {
                    data['user_status'] = "Active"
                  } else {
                    data['user_status'] = "Invited";
                  }
                  data["created_date"] = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                  data["modified_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                })
                totalCount=resourceList.rows[0].totalcount;
                activeCount=resourceList.rows[0].activecount;
                // console.log(totalCount+' '+archivedCount);

              }
              let userRole=['Manager'];
              if(userRoleList.rows.length>0){
                userRole=userRoleList.rows[0].user_role;
              }
              // console.log('totalCount'+resourceList.rows);
              done();
              handleResponse.responseToPage(res,'pages/resources-listing',{resources: resourceList.rows, userRoleList:userRole , totalCount:totalCount ,activeCount:activeCount, archivedCount:(totalCount-activeCount), user: req.session.passport.user },"success","Successfully rendered");

              }
          })
        }

      })
    })

};


exports.postAddCompany = (req, res) => {
  // console.log('inside post company ' + req.body);
  // if(req.user){
  req.assert('orgName', 'Orgnization name cannot be blank').notEmpty();
  req.assert('domain', 'Domain name cannot be blank').notEmpty();
  /*req.assert('adminUserName', 'Domain\'s admin user name cannot be blank').notEmpty();*/
 /* req.assert('adminPass', 'Password cannot be blank').notEmpty();*/
  req.assert('adminEmail', 'Admin email cannot be blank').notEmpty();

  /*let domainValidation=isValidDomain(req.body.domain);
  req.assert(domainValidation, 'Domain name is invalid');*/
  const err = req.validationErrors();

  if (err) {
    if(err.length>0){
        // console.log(err[0].msg);
        handleResponse.handleError(res, err, "Server Error :"+err[0].msg);
      }else{
         handleResponse.handleError(res, err, "Server Error : Error in validating data.");
      }
    /*req.flash('errors', errors);
    return res.redirect('/addCompany');*/

  }
  // else if (req.body.adminEmail.indexOf(req.body.domain) == -1) {
  //   handleError(res, 'incorrect email id', 'Please enter email id belonging to this domain.');
  //   /*req.flash('errors',{ msg:'Errors: Please enter email id belonging to this domain.'});
  //   return res.redirect('/addCompany');*/

  // }
  else {

    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, 'Server Error: Error in connecting to database.');
        } else {
          client.query('SELECT * FROM COMPANY where domain = $1', [req.body.domain], function (err, existingDomain) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, 'Server Error: Error in finding company');
            } else {
              if (existingDomain.rows.length > 0) {
                // console.log(existingDomain);
                done();
                handleResponse.handleError(res, 'Company adding error', 'Company with this domain already exists.');
              } else {
                /*client.query('SELECT * FROM USERS where email = $1', [req.body.adminEmail], function (err, user) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, 'Server Error: Error in finding user for the company');
                  } else {
                    if(user.rows.length > 0) {
                      done();
                      handleResponse.handleError(res, 'User adding error', 'User with this email already exists.');
                    } else {*/
                      let created_date = moment.tz(new Date(), companyDefaultTimezone).format()
                      var token;
                      crypto.randomBytes(16, function(err, buffer) {
                        if(err) {
                          // console.log(err);
                        } else {
                          // console.log("else");
                          token = buffer.toString('hex');
                          client.query('Insert into COMPANY (name, domain,created_date,modified_date, add_status, token) values ($1,$2,$3,$4,$5,$6)  RETURNING id, domain', [req.body.orgName, req.body.domain, created_date, created_date, 'Approval Pending', token], function (err, company) {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, 'Server Error: Error in adding company to the database');
                            } else {
                              let company_id=company.rows[0].id;
                              client.query('Insert into SETTING (expense_category,user_role,company_address,invoice_note,currency,timezone,company_id) values ($1,$2,$3,$4,$5,$6,$7)  RETURNING id', [['Food'],['Manager','Developer'],'','','USD','America/Los_Angeles',company_id], function (err, companySetting) {
                              if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, 'Server Error: Error in adding company to the database');
                              } else {
                                  client.query('Insert into PROJECT (name,company_id,isGlobal) values ($1,$2,$3)  RETURNING id', ['global project', company.rows[0].id,true], function (err, globalProject) {
                                  if (err) {
                                    handleResponse.shouldAbort(err, client, done);
                                    handleResponse.handleError(res, err, 'Server Error: Error in adding company project to the database');
                                  } else {
                                    client.query('Insert into TASK (name, project_id, company_id) values ($1,$2,$3)  RETURNING id', ['global task',globalProject.rows[0].id, company.rows[0].id], function (err, task) {
                                    if (err) {
                                      handleResponse.shouldAbort(err, client, done);
                                      handleResponse.handleError(res, err, 'Server Error: Error in adding company task to the database');
                                    } else {
                                    client.query('Insert into USERS( password, email, company_id, user_role,created_date,modified_date,add_status, password_reset_token, role,permissions) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [req.body.adminPass, req.body.adminEmail, company.rows[0].id, '{"ADMIN"}', created_date, created_date, 'Invited', token, "Manager",'{"timesheetEntry","expenseManager","projectManager","invoiceManager","timesheetApprover","expenseApprover"}'], function (err, addedUser) {
                                      if (err) {
                                        handleResponse.shouldAbort(err, client, done);
                                        handleResponse.handleError(res, err, 'Server Error: Error in adding admin user to the database');
                                      } else {
                                        client.query('COMMIT', (err) => {
                                          if (err) {
                                            // console.log('Error committing transaction', err.stack)
                                            handleResponse.shouldAbort(err, client, done);
                                            handleResponse.handleError(res, err, 'Server Error: Error in committing transaction');
                                          } else {
                                            done();
                                            if (req.body.isSignup) {
                                              req.body.user_id = addedUser.rows[0].id;
                                              req.body.token = token;
                                              sendEmail(req, res, function (error, info) {
                                                // console.log('callback');
                                                if (error) {
                                                  handleResponse.handleError(res, error, 'Server Error: Error in sending email');
                                                } else {
                                                  handleResponse.sendSuccess(res,'mail sent',{});
                                                  /*res.status(200).json({ "success": true, "message": "mail sent" });*/
                                                }
                                              })
                                            } else {
                                              handleResponse.sendSuccess(res,'Company added successfully',{});
                                              /*res.status(200).json({ "success": true, "message": "success" });*/
                                            }
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
                    });
                  }
                });
                    /*}
                  }
                });*/
              }
            }
          });
        }
      });
    });
  }
};

sendEmail = (req, res, next) => {
  let serverName =process.env.BASE_URL;
  let redirectUrl = serverName+'/login?domain='+req.body.domain+'&token='+req.body.token;
  // console.log("redirectUrl");
  // console.log(redirectUrl);
  let html = '<html>'
    + '<body>'
    + '<div style="background-color: #f7f8f9;">'
    + '<table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f7f8f9">'
    + '<tbody>'
    + '<tr>'
    + '<td valign="top" align="center" style="padding-top: 20px; padding-bottom: 10px;">'
    + '<a href="/" target="_blank">'
    + '<img src="http://multitenant-example-1.herokuapp.com/img/krow-logo.png" alt="">'
    + '</a>'
    + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td valign="top" align="center">'
    + '<table border="0" cellpadding="0" cellspacing="0" height="100%" width="600px">'
    + '<tbody>'
    + '<tr>'
    + '<td valign="top">'
    + '<table cellpadding="0" cellspacing="0" width="100%" style="background: #fff; border: 1px solid #eee; margin: 0; padding: 30px; ">'
    + '<tbody>'
    + '<tr>'
    + '<td valign="top">'
    + '<h1 style="font-family: arial,sans-serif; font-size:24px; font-weight:normal; line-height: 20px; color: orange;">'
    + '<strong>'
    + 'Welcome To Krow!'
    + '</strong>'
    + '</h1>'
    + '<h5 style="font-family: arial,sans-serif; font-size:16px; font-weight:normal;margin: 15px 0 ; ">'
    + 'Hi '+req.body.orgName+','
    +'</h5>'
    + '<table border="0" cellpadding="0" cellspacing="0" width="100%">'
    + '<tbody>'
    + '<tr>'
    + '<td align="" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; color: #999;">'
    + 'Your Company Domian'
    + '</td>'
    + '<td align="right" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; ">'
    +  '<a href="'+serverName+'" target="_blank">'+req.body.domain+'</a>'
    + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td align="" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; color: #999;">'
    + 'User ID'
    + '</td>'
    + '<td align="right" style=" font-size:14px;font-family: arial,sans-serif; padding:10px; border-bottom: 1px solid #eee; ">'
    +  req.body.adminEmail
    + '</td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'

    + '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">'
    +' To get started, we need to confirm.your email address, so please click this link to finish creating your account:'
    +'</p>'
    + '<table border="0" cellpadding="0" cellspacing="0" width="100%">'
    + '<tbody>'
    + '<tr>'
    + '<td align="center" style="padding: 15px;">'
    + '<table cellpadding="0" cellspacing="0" width="300px" style="margin: 0; padding: 0;">'
    + '<tbody>'
    + '<tr>'
    + '<td align="center" style="font-family: arial,sans-serif;">'
    + '<a href="'+redirectUrl+'" target="_blank" style="font-size:14px; color: #ffffff; font-weight:normal; background: #0070d2; border-radius: 4px; display:block; padding: 12px 30px 12px 30px; text-decoration: none;">Confirm your email address</a>'
    + '</td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'
    + '</td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'
    + '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; line-height: 20px;">'
    + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.Sed accumsan convallis iaculis.Quisque at convallis leo.'
    + '</p>'
    + '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-bottom: 5px;">'
    + 'Thanks,'
    +'</p>'
    + '<p style="font-family: arial,sans-serif; font-size:14px; font-weight:normal; margin-top: 5px;">'
    + 'The Team at Krow'
    + '</p>'
    + '</td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'
    + '</td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'
    + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td valign="top" align="center" style=" font-family: arial,sans-serif; padding:20px 20px 20px 20px; color: #999; font-size: 14px;">'
    + 'For more help and support'
    + '<a href="/" target="_blank" style="color: #4387fd;">contact us</a>'
    + '</td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'
    + '</div>'
    + '</body>'
    + '</html>';
  // console.log("Inside send mail " + req.body);
  const mailOptions = {
    to: req.body.adminEmail,
    from: 'ruchika.mittal@athenalogics.com',
    subject: "Confirmation of "+req.body.orgName+" on krow timesheet app",
    html : html
  };

  req.mailOptions = mailOptions;
  // console.log('transpoter');
  email.sendMail(req, res, function (error, info) {
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

/*exports.findCompanyByName = (req, res) => {
  // console.log("findCompanyByName----------------------------------"+req.body.searchText);
  pool.connect((err, client, done) => {
      let queryToExec='SELECT * FROM company WHERE '+req.body.searchField+' like $1';
      // console.log('queryToExec '+queryToExec);

      client.query(queryToExec,[req.body.searchText+'%'], function (err, companies) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, 'Server Error: Error in finding company data');
        }
        else{
            // console.log(JSON.stringify(companies.rows));
            if (companies.rows.length > 0) {
              companies.rows.forEach(function (data) {
                let created_date = dateFormat(data.created_date);
                let modified_date = dateFormat(data.modified_date);
                data["created_date"] = created_date;
                data["modified_date"] = modified_date;
              })
            }
            done();
            handleResponse.sendSuccess(res,'Company searched successfully',{companies: companies.rows});

        }
      });
    })
};*/

exports.findCompanyByCriteria = (req, res) => {
  // console.log("findCompanyByCriteria----------------------------------"+req.body.searchField);
  pool.connect((err, client, done) => {
      let searchCriteriaVal=[];
      let whereClause='';
      if(req.body.searchField.length>0){
        let searchField=req.body.searchField;
        searchField.forEach((search,index)=>{
            if(index==0){
              whereClause+='WHERE '+search.fieldName+' $'+(index+1)+' ';
            }else{
              whereClause+='AND '+search.fieldName+' $'+(index+1)+' ';
            }
            searchCriteriaVal.push(search.fieldValue);
        });
        /*let queryToExec='SELECT * FROM account WHERE '+req.body.searchField+' like $1 AND company_id=$2';*/
      }
      let offset=0;
      if(req.body.offset){
        offset=req.body.offset;
      }
      let queryToExec='SELECT c.*,(SELECT count(*) from company '+whereClause+') as searchcount FROM company c '+whereClause+' ORDER BY created_date DESC,name,domain OFFSET '+offset+' LIMIT '+process.env.PAGE_RECORD_NO;
      // console.log('queryToExec '+queryToExec);
      client.query(queryToExec,searchCriteriaVal, function (err, companies) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, 'Server Error: Error in finding company data');
        }
        else{
            let searchCount=0;
            // console.log(JSON.stringify(companies.rows));
            if (companies.rows.length > 0) {
              companies.rows.forEach(function (data) {
                let created_date = dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                let modified_date = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                data["created_date"] = created_date;
                data["modified_date"] = modified_date;
              })
              searchCount=companies.rows[0].searchcount;
              // console.log('search count result is: '+companies.rows[0].searchcount);
            }
            done();
            handleResponse.sendSuccess(res,'Companies searched successfully',{companies: companies.rows,count:searchCount});
        }
      });

    })
};

exports.getCompany = (req, res) => {
  setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/org-listing',{compnies: [], totalCount:0,activeCount:0, archivedCount:0,user:req.session.passport.user, error:err},"error"," Error in finding company setting");
        /*handleResponse.handleError(res, err, 'Server Error: error in finding company setting');*/
      }else{

        companyDefaultTimezone=result.timezone;
        // console.log('companyDefaultTimezone');
        // console.log(companyDefaultTimezone);
        // console.log("getCompany----------------------------------");
        pool.connect((err, client, done) => {
          client.query('SELECT c.*,(select count(*) from company) as total,(select count(*) from company where archived=false) as active FROM company c ORDER BY created_date DESC,name,domain  OFFSET 0 LIMIT '+process.env.PAGE_RECORD_NO, function (err, companies) {
            if (err) {
              // console.log(err);
              handleResponse.shouldAbort(err, client, done);
              handleResponse.responseToPage(res,'pages/org-listing',{compnies: [], totalCount:0,activeCount:0, archivedCount:0,user:req.session.passport.user, error:err},"error"," Error in finding company data");
              /*handleResponse.handleError(res, err, 'Server Error: Error in finding company data');*/
            }else{
              // console.log('---------------companies.rows-------------------');
              // console.log(companies.rows);
              let totalCount=0,activeCount=0;
              /*let activeCompany=[];*/
              if (companies.rows.length > 0) {
                companies.rows.forEach(function (data) {
                  data["created_date"] =  dateFormat(moment.tz(data.created_date, companyDefaultTimezone).format());
                  data["modified_date"] = dateFormat(moment.tz(data.modified_date, companyDefaultTimezone).format());
                })
                totalCount=companies.rows[0].total;
                activeCount=companies.rows[0].active;
              }
              /*activeCompany=companies.rows.filter(com => com.archived==false);*/
              done();
              handleResponse.responseToPage(res,'pages/org-listing',{ compnies: companies.rows, totalCount:totalCount ,activeCount:activeCount, archivedCount:(totalCount-activeCount), user: req.session.passport.user },"success","Successfully rendered");
              /*res.render('pages/org-listing', { compnies: companies.rows, user: req.session.passport.user, error: err });*/
            }
          });
        })
      }
    });
};

exports.deleteCompany = (req, res) => {
  // console.log('inside delete company id is ' + req.body.companyId);
  if (req.user) {
    let companyId = req.body.companyId;
    if (companyId == '' || companyId == null || companyId == undefined) {
      handleResponse.handleError(res, 'incorrect company id', 'company id is not correct');
    } else {
      pool.connect((err, client, done) => {
        client.query('SELECT * FROM company WHERE id =$1', [req.body.companyId], function (err, company) {
          if (err) {
            done();
            handleResponse.handleError(res, err, 'Server Error: Error in deleting company');
          } else {
            if(parseInt(company.rows[0].id) == parseInt('999999999999999')) {
              done();
              handleResponse.handleError(res, err, 'You can not delete this company.');
            } else {
              client.query('UPDATE company SET archived=true where id =$1', [req.body.companyId], function (err, company) {
                if (err) {
                  done();
                  handleResponse.handleError(res, err, 'Server Error: Error in deleting company');
                } else {
                  done();
                  handleResponse.sendSuccess(res,'Company deleted successfully',{});
                  /*res.status(200).json({ "success": true, "message": "success" });*/
                }
              });
            }
          }
        });
      })
    }
  } else {
    done();
    res.redirect('/domain');
  }

}



exports.updateCompany = (req, res) => {
  // console.log('inside update company ' + JSON.stringify(req.body));
  if (req.user) {
    req.assert('name', 'Orgnization name cannot be blank').notEmpty();
    req.assert('domain', 'Domain name cannot be blank').notEmpty();

    const err = req.validationErrors();

    if (err) {
      if(errors.length>0){
          // console.log(errors[0].msg);
          handleResponse.handleError(res, errors, "Server Error :"+errors[0].msg);
        }else{
           handleResponse.handleError(res, errors, "Server Error : Error in validating data.");
        }
    } else {
      let newDate=moment.tz(new Date(), companyDefaultTimezone).format();
      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, err);
          } else {
            client.query('UPDATE company set name=$1,domain=$2,street=$3,city=$4,state=$5,country=$6,zip_code=$7,modified_date=$8 where id=$9  RETURNING id, domain', [req.body.name, req.body.domain, req.body.street, req.body.city, req.body.state, req.body.country, req.body.zip_code, newDate, req.body.id], function (err, company) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, 'Server Error: Error in updating company data.');
              } else {
                // console.log("company------------");
                // console.log(company);
                client.query('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction', err.stack)
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, 'Server Error: Error in committing transaction');
                  } else {
                    done();
                    handleResponse.sendSuccess(res,'Company updated successfully',{});
                    /*res.status(200).json({ "success": true, "message": "success" });*/
                  }
                })

              }
            });
          }
        })
      });
    }
  } else {
    done();
    res.redirect('/domain');
  }

};

exports.postActivate = (req,res) =>{
  // console.log('Archived object and its id is-------------' + req.body.id+' '+req.body.object);
  pool.connect((err, client, done) => {
    client.query('UPDATE '+req.body.object+' SET archived = $1 WHERE id=$2',[false, req.body.id], function(err, unarchivedObject) {
        if (err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, 'Server Error: Error in activating object.');
        } else {
          console.error('Affected ID>>>>>>>>>>>>>');
          // console.log(unarchivedObject.rows[0]);
          done();
          handleResponse.sendSuccess(res,'Object activated successfully',{});
        }
      })
    });

}
