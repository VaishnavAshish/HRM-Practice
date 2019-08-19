const { promisify } = require('util');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const email =require('./email');
const fs = require('fs');
//const User = require('../models/User');
//const bcrypt = require('bcrypt-nodejs');
var pool = require('./../config/dbconfig');
var userrole = require('./../config/user-role');
var handleResponse = require('./page-error-handle');
const sharp = require('sharp');
//const randomBytesAsync = promisify(crypto.randomBytes);

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
      done()
    })
  }
  return !!err
}
*/

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  // console.log(req.user);
  if (req.user) {
    if (req.user.user_role.includes('SUPER_ADMIN')) {
        // console.log('SUPER_ADMIN');
        res.redirect('/org-listing');
      } else if (req.user.user_role.includes('ADMIN')) {
        // console.log('ADMIN');
        res.redirect('/timesheet/'+req.user.id+'#default');
      } else {
        // console.log('user');
        res.redirect('/timesheet/'+req.user.id+'#default');
      }
  } else {
    if(req.query.token != '' || req.query.token != null || req.query.token != undefined) {
      pool.connect((err, client, done) => {
        client.query('BEGIN', (err) => {
          if(err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in connecting to the database");
            /*handleResponse.handleError(res, err, ' Error in connecting to the database');*/
          } else {
            client.query('SELECT * FROM COMPANY where domain ilike $1 AND token=$2', [req.query.domain, req.query.token], function (err, company) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in finding company data");
                /*handleResponse.handleError(res, err, ' Error in finding company data');*/
              } else {
                if(company.rows.length > 0) {
                  client.query('UPDATE COMPANY SET add_status=$1, token=$2 where id=$3', ['Approved', null, company.rows[0].id], function (err) {
                    if(err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in updating company data");
                      /*handleResponse.handleError(res, err, ' Error in updating company data');*/
                    } else {
                      client.query('UPDATE USERS SET add_status=$1, password_reset_token=$2 where company_id=$3 AND password_reset_token=$4', ['Joined', null, company.rows[0].id, req.query.token], function (err) {
                        if(err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in updating user data");
                          /*handleResponse.handleError(res, err, ' Error in updaing user data');*/
                        } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in committing transaction");
                              /*handleResponse.handleError(res, err, ' Error in committing transaction');*/
                            } else {
                              done();
                              handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : true},"success","Successfully rendered");
                              /*res.render('pages/login', {
                                domain: req.query.domain,
                                isAuthenticate : true
                              });*/
                            }
                          });
                        }
                      });
                    }
                  });
                } else {
                  client.query('SELECT * FROM COMPANY where domain ilike $1 AND add_status=$2', [req.query.domain, 'Approved'], function (err, getComp) {
                    if(err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in finding company");
                      /*handleResponse.handleError(res, err, ' Error in finding company');*/
                    } else {
                      if(getComp.rows.length > 0) {
                        done();
                        handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"success","Successfully rendered");
                       /* res.render('pages/login', {
                          domain: req.query.domain,
                          isAuthenticate : false
                        });*/
                      } else {
                        res.redirect('/domain');
                      }
                    }
                  });
                }
              }
            });
          }
        });
      })
    } else {
      handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"success","Successfully rendered");
      /*res.render('pages/login', {
        domain: req.query.domain,
        isAuthenticate : false
      });*/
    }
  }
};


exports.getDomain = (req, res) => {
  console.log('inside get domain')
  if (req.user) {
    if (req.user.user_role.includes('SUPER_ADMIN')) {
      // console.log('SUPER_ADMIN');
      return res.redirect('/org-listing');
    } else if (req.user.user_role.includes('ADMIN')) {
      // console.log('ADMIN');
      return res.redirect('/timesheet/'+req.user.id+'#default');
    } else {
      // console.log('user');
      return res.redirect('/timesheet/'+req.user.id+'#default');
    }
  }
  handleResponse.responseToPage(res,'pages/domain',{},"success","Successfully rendered");
  /*res.render('pages/domain');*/
};

exports.postDomain = (req, res) => {
  // console.log('domain is ' + req.body.domain);
  req.assert('domain', 'Company domain cannot be blank').notEmpty();
  const errors = req.validationErrors();
  if (errors) {
    if(errors.length>0){
        // console.log(errors[0].msg);
        handleResponse.handleError(res, errors, ""+errors[0].msg);
      }else{
         handleResponse.handleError(res, errors, " Error in validating data.");
      }
  } else {
    // console.log('inside');
    pool.connect((err, client, done) => {
      // console.log('error on connecting pool');
      // console.log(err);
      let domainName = req.body.domain+".krow.com";
      console.log('domainName '+domainName);
      client.query('SELECT * FROM company where domain ilike $1 AND archived=$2', [domainName,false], function (err, company) {
        if (err) {
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding company data');
        } else {
          done();
          if (company.rows.length > 0) {
            // console.log("company.rows[0]");
            // console.log(company.rows[0]);
            if(company.rows[0].add_status == 'Approved') {
              handleResponse.sendSuccess(res,'Domain Available',{"domainName": domainName});
              /*res.status(200).json({"success": true, "message":"Domain Available", "domainName": domainName});*/
            } else {
              handleResponse.handleError(res, "Domain not approved", 'Domain not approved yet. Please check your email.');
            }
          } else {
            // handleError(res, err, err);
            handleResponse.sendSuccess(res,'Domain not found',{"domainName": domainName});
            /*res.status(200).json({"success": true, "message":"Domain not found", "domainName": domainName});*/
          }
        }
      });
      /* }
    }) */
    })
  }
};

/**
 * POST /login
 * Sign in using email and password.
 */
 function randomString(len) {
   var buf = []
     , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
     , charlen = chars.length;

   for (var i = 0; i < len; ++i) {
     buf.push(chars[getRandomInt(0, charlen - 1)]);
   }

   return buf.join('');
 };

 function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
 }
function issueToken(user, done) {
  console.log('user in auth');
  console.log(user);
  var token = randomString(64);
  saveRememberMeToken(token, user.id, function(err) {
    if (err) { return done(err); }
    return done(null, token);
  });
}
// var tokens = {}

function saveRememberMeToken(token, uid, fn) {
  console.log('save remember me token in auth');
  tokens[token] = uid;
  console.log('tokens ins ave remember me');
  console.log(tokens);
  return fn();
}

exports.postLogin = (req, res, next) => {
  let domain = req.body.domain;
  req.assert('email', 'Email is not valid').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
     if(errors.length>0){
        // console.log(errors[0].msg);
        handleResponse.handleError(res, errors, ""+errors[0].msg);
      }else{
         handleResponse.handleError(res, errors, " Error in validating data.");
      }
  }
  // else if (req.body.email.indexOf(domain) == -1) {
  //   handleError(res, 'email must belong to same domain ', 'Please enter email id belonging to this domain.');
  //   //res.status(500).json({"error": 'Please enter email id belonging to this domain.'});
  //   /*req.flash('errors',{ msg:'Errors: Please enter email id belonging to this domain.'});*/
  //   /*return res.redirect('/login?domain=' + domain);*/
  // }
  else{
    // console.log("after check domain name");

      passport.authenticate('user', (err, user, info) => {
        // console.log('inside authentication');
        if (err) {
          // console.log("------22222121121---" + JSON.stringify(err));
          /*res.redirect('/login?error=1&domain=' + domain);*/

           handleResponse.handleError(res, err, err);
        } else {
          // console.log('req.body.remember_me '+user.id);
          if (req.body.remember_me) {
            console.log('inside remember_me');
            issueToken(user, function(err, token) {
              // if (err) { return next(err); }
              // console.log(token);
              // res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 604800000 });
              // return next();
              if (err) {
                handleResponse.handleError(res, err, err);
              }else{
                res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 604800000 });
              }
            });
          }
          // console.log("user============================123");
          // console.log(user);
          if (user) {
            let userData = user;

            req.logIn(userData, (err) => {
              userData.domain = domain;
              if (err) {
                 console.debug("--------2222-" + err);

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
                  // console.log('inside login user is ' + JSON.stringify(userData));
                  let pages = userrole.setupPagePermissions(userData, req.user);
                  // console.log("userData=========================");
                  userData.pages = pages;
                  // console.log(userData);
                  handleResponse.sendSuccess(res,'user login successfully',{"userData":userData});
              }
            });
          } else {

            handleResponse.handleError(res, err, ' Error in user authentication');
            /*res.redirect('/login?error=4&domain=' + domain);*/
          }

        }

      })(req, res, next);
  }

};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  let domain = req.user.domain;
  // console.log(domain);
  res.clearCookie('remember_me');
  req.logout();
  req.session.destroy((err) => {
    if (err) // console.log('Error : Failed to destroy the session during logout.', err);
    req.user = null;

    /*window.history.forward();*/
    res.redirect('/login?domain='+domain);
  });
};

// /* *
//  * GET /signup
//  * Signup page.
//  */
// exports.getSignup = (req, res) => {
//   if (req.user) {
//     return res.redirect('/');
//   }
//   res.render('account/signup', {
//     title: 'Create Account'
//   });
// };

// /**
//  * POST /signup
//  * Create a new local account.
//  */
// exports.postSignup = (req, res, next) => {
//   // console.log('inside post signup');
//   req.assert('email', 'Email is not valid').isEmail();
//   req.assert('password', 'Password must be at least 4 characters long').len(4);
//   req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
//   req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', { msg: errors });
//     return res.redirect('/signup?domain=' + req.query.domain);
//   }
//   if (req.body.email.indexOf(req.query.domain) == -1) {
//     req.flash('errors', { msg: 'Errors: Please enter email id belonging to this domain.' });
//     return res.redirect('/signup?domain=' + req.query.domain);
//   }
//   const user = new User({
//     email: req.body.email,
//     password: req.body.password
//   });
//   let domain = req.query.domain;
//   domainWODot = domain.split('.').join("");
//   let queryToExec = 'SELECT * FROM ' + domainWODot + '_users where email = $1';
//   // console.log('queryToExec ' + queryToExec + 'domainWODot ' + queryToExec);
//   client.query(queryToExec, [req.body.email], function (err, existingUser) {
//     // console.log('signed in user with email is ' + JSON.stringify(existingUser) + ' size of existingUser is ' + existingUser.rows.length);
//     if (err) { return next('sign up getting email error ' + err); }
//     if (existingUser.rows.length > 0) {
//       req.flash('errors', { msg: 'Account with that email address already exists.' });
//       return res.redirect('/signup?domain=' + req.query.domain);
//     }
//     //if (!user.isModified('password')) { return next(); }
//     /*bcrypt.genSalt(10, (err, salt) => {
//       if (err) { return next(err); }
//       bcrypt.hash(user.password, salt, null, (err, hash) => {
//         if (err) { return next(err); }
//         user.password = hash;
//         next();
//       });
//     });*/
//     queryToExec = 'Insert into ' + domainWODot + '_users(email,password) values ($1,$2)  RETURNING id,email';
//     client.query(queryToExec, [user.email, user.password], function (err, user) {
//       if (err) { return next('sign up user saving error ' + err); }
//       /*if(user) { return next('user save as '+JSON.stringify(user)); }*/
//       let userData = user.rows[0];
//       req.logIn(userData, (err) => {
//         userData.domain = req.query.domain;
//         if (err) {
//           return next('after sign up login error ' + err);
//         }
//         res.redirect('/');
//       });
//     });

//   });
//   /*User.findOne({ email: req.body.email }, (err, existingUser) => {
//     if (err) { return next(err); }
//     if (existingUser) {
//       req.flash('errors', { msg: 'Account with that email address already exists.' });
//       return res.redirect('/signup');
//     }
//     user.save((err) => {
//       if (err) { return next(err); }
//       req.logIn(user, (err) => {
//         if (err) {
//           return next(err);
//         }
//         res.redirect('/');
//       });
//     });
//   });*/
// };

// /**
//  * GET /account
//  * Profile page.
//  */
// exports.getAccount = (req, res) => {
//   res.render('account/profile', {
//     title: 'Account Management'
//   });
// };

// /**
//  * POST /account/profile
//  * Update profile information.
//  */
// exports.postUpdateProfile = (req, res, next) => {
//   req.assert('email', 'Please enter a valid email address.').isEmail();
//   req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/account');
//   }
//   client.query('SELECT * FROM users where id=' + id, function (err, user) {
//     if (err) { return next(err); }
//     user.email = req.body.email || '';
//     user.profile.name = req.body.name || '';
//     user.profile.gender = req.body.gender || '';
//     user.profile.location = req.body.location || '';
//     user.profile.website = req.body.website || '';
//     user.save((err) => {
//       if (err) {
//         if (err.code === 11000) {
//           req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
//           return res.redirect('/account');
//         }
//         return next(err);
//       }
//       req.flash('success', { msg: 'Profile information has been updated.' });
//       res.redirect('/account');
//     });
//   });
//   /*User.findById(req.user.id, (err, user) => {
//     if (err) { return next(err); }
//     user.email = req.body.email || '';
//     user.profile.name = req.body.name || '';
//     user.profile.gender = req.body.gender || '';
//     user.profile.location = req.body.location || '';
//     user.profile.website = req.body.website || '';
//     user.save((err) => {
//       if (err) {
//         if (err.code === 11000) {
//           req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
//           return res.redirect('/account');
//         }
//         return next(err);
//       }
//       req.flash('success', { msg: 'Profile information has been updated.' });
//       res.redirect('/account');
//     });
//   });*/
// };

// /**
//  * POST /account/password
//  * Update current password.
//  */
// exports.postUpdatePassword = (req, res, next) => {
//   req.assert('password', 'Password must be at least 4 characters long').len(4);
//   req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/account');
//   }
//   client.query('SELECT * FROM users where id=' + id, function (err, user) {
//     if (err) { return next(err); }
//     user.password = req.body.password;
//     user.save((err) => {
//       if (err) { return next(err); }
//       req.flash('success', { msg: 'Password has been changed.' });
//       res.redirect('/account');
//     });
//   });
//   /*User.findById(req.user.id, (err, user) => {
//     if (err) { return next(err); }
//     user.password = req.body.password;
//     user.save((err) => {
//       if (err) { return next(err); }
//       req.flash('success', { msg: 'Password has been changed.' });
//       res.redirect('/account');
//     });
//   });*/
// };

// /**
//  * POST /account/delete
//  * Delete user account.
//  */
// exports.postDeleteAccount = (req, res, next) => {
//   client.query('DELETE FROM users WHERE _id=' + req.user.id, function (err) {
//     if (err) { return next(err); }
//     req.logout();
//     req.flash('info', { msg: 'Your account has been deleted.' });
//     res.redirect('/');
//   });
//   /*User.remove({ _id: req.user.id }, (err) => {
//     if (err) { return next(err); }
//     req.logout();
//     req.flash('info', { msg: 'Your account has been deleted.' });
//     res.redirect('/');
//   });*/
// };

// /**
//  * GET /account/unlink/:provider
//  * Unlink OAuth provider.
//  */
// exports.getOauthUnlink = (req, res, next) => {
//   const { provider } = req.params;
//   client.query('SELECT * FROM users where id=' + req.user.id, function (err, user) {
//     if (err) { return next(err); }
//     user[provider] = undefined;
//     user.tokens = user.tokens.filter(token => token.kind !== provider);
//     client.query("INSERT INTO user values(" + user + ")", function (err, user) {
//       if (err) { return next(err); }
//       req.flash('info', { msg: `${provider} account has been unlinked.` });
//       res.redirect('/account');
//     });
//   });


//   /*User.findById(req.user.id, (err, user) => {
//     if (err) { return next(err); }
//     user[provider] = undefined;
//     user.tokens = user.tokens.filter(token => token.kind !== provider);
//     user.save((err) => {
//       if (err) { return next(err); }
//       req.flash('info', { msg: `${provider} account has been unlinked.` });
//       res.redirect('/account');
//     });
//   });*/
// };

// /**
//  * GET /reset/:token
//  * Reset Password page.
//  */
exports.getReset = (req, res, next) => {
  let token=req.params.token;
  if(token==""||token==null||token==undefined){
    handleResponse.responseToPage(res,'pages/update-password',{ resource:{},error:err},"error","Token is incorrect or not defined.");
    /*handleResponse.handleError(res, err, ' Token is incorrect or not defined');*/
  }else{

    pool.connect((err, client, done) => {
        client.query('SELECT * FROM users where password_reset_token=$1', [req.params.token], function (err, resource) {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/update-password',{ resource:{},error:err},"error","Error in finding user data.");
            /*handleResponse.handleError(res, err, ' Error in finding user data');*/
          } else {
            res.clearCookie('remember_me');
            req.logout();
            req.session.destroy((error) => {
              if (error) {
                // console.log('Error : Failed to destroy the session during logout.', err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.responseToPage(res,'pages/update-password',{resource:{},error:err},"error","Failed to destroy the session during logout.");
                /*handleResponse.handleError(res, error, 'Failed to destroy the session during logout.');*/
              }else{
                req.user = null;
                // console.log('--------resource with token is:------');
                // console.log(resource.rows);
                done();
                  if (resource.rows.length > 0) {
                    // console.log('inside found');
                    handleResponse.responseToPage(res,'pages/update-password',{ resource:resource.rows[0] },"success","Successfully rendered");
                    /*res.render("pages/update-password",{resource:resource.rows[0]});*/
                  } else {
                    // console.log('inside not found');
                    handleResponse.responseToPage(res,'pages/update-password',{ resource:null },"success","Successfully rendered");
                    /*res.render("pages/update-password",{resource:null});*/
                  }
              }
            });

          }
        });

      })
  }

};
exports.getResetPassword = (req, res, next) => {
  // console.log('domain is '+req.query.domain);
  let domain=req.query.domain;
  handleResponse.responseToPage(res,'pages/reset-password',{ domain:domain },"success","Successfully rendered");
  /*res.render('pages/reset-password',{domain:domain});*/
};

exports.postReset = (req, res, next) => {
  let password=req.body.password;
  req.assert('password', 'Password cannot be blank').notEmpty();
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

    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if(err) {
          handleResponse.shouldAbort(err, client, done);
          // handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in connecting to the database");
          handleResponse.handleError(res, err, ' Error in connecting to the database');
        } else {
          // console.log(req.body.password);
          // console.log(req.body.id);
            client.query('UPDATE users set password=$1,password_reset_token=$2,add_status=$3 where id=$4 RETURNING *',[req.body.password,null,"Approved",req.body.id], function (err, resource) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Failed to update user information');
              } else {
                client.query('SELECT domain FROM company WHERE id=$1',[resource.rows[0].company_id], function (err, companyDomain) {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Failed to update user information');
                } else {
                  client.query('COMMIT', (err) => {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      // handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in committing transaction");
                      handleResponse.handleError(res, err, ' Error in committing transaction');
                    } else {
                      // console.log('------updated user after password reset  is --------');
                      // console.log(resource.rows);
                      // console.log(companyDomain);
                        done();
                        handleResponse.sendSuccess(res,'password reset successfully',{domain:companyDomain.rows[0].domain});
                        /*res.status(200).json({ "success": true ,"message":"success"});*/
                      }
                    })
                   }
                });
              }
            });
          }
        });

      })
  }
};

// /**
//  * GET /forgot
//  * Forgot Password page.
//  */
// exports.getForgot = (req, res) => {
//   if (req.isAuthenticated()) {
//     return res.redirect('/');
//   }
//   res.render('account/forgot', {
//     title: 'Forgot Password'
//   });
// };

// /**
//  * POST /forgot
//  * Create a random token, then the send user an email with a reset link.
//  */
// exports.postForgot = (req, res, next) => {
//   req.assert('email', 'Please enter a valid email address.').isEmail();
//   req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/forgot');
//   }

//   const createRandomToken = randomBytesAsync(16)
//     .then(buf => buf.toString('hex'));

//   const setRandomToken = token =>
//     client.query('SELECT * FROM users where email = $1', [req.body.email], function (err, user) {
//       if (!user) {
//         req.flash('errors', { msg: 'Account with that email address does not exist.' });
//       } else {
//         user.passwordResetToken = token;
//         user.passwordResetExpires = Date.now() + 3600000; // 1 hour
//         user = user.save();
//       }
//       return user;
//     });
//   /*User
//     .findOne({ email: req.body.email })
//     .then((user) => {
//       if (!user) {
//         req.flash('errors', { msg: 'Account with that email address does not exist.' });
//       } else {
//         user.passwordResetToken = token;
//         user.passwordResetExpires = Date.now() + 3600000; // 1 hour
//         user = user.save();
//       }
//       return user;
//     });*/

//   const sendForgotPasswordEmail = (user) => {
//     if (!user) { return; }
//     const token = user.passwordResetToken;
//     const transporter = nodemailer.createTransport({
//       service: 'SendGrid',
//       auth: {
//         user: process.env.SENDGRID_USER,
//         pass: process.env.SENDGRID_PASSWORD
//       }
//     });
//     const mailOptions = {
//       to: user.email,
//       from: 'hackathon@starter.com',
//       subject: 'Reset your password on Hackathon Starter',
//       text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
//         Please click on the following link, or paste this into your browser to complete the process:\n\n
//         http://${req.headers.host}/reset/${token}\n\n
//         If you did not request this, please ignore this email and your password will remain unchanged.\n`
//     };
//     return transporter.sendMail(mailOptions)
//       .then(() => {
//         req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
//       });
//   };

//   createRandomToken
//     .then(setRandomToken)
//     .then(sendForgotPasswordEmail)
//     .then(() => res.redirect('/forgot'))
//     .catch(next);
// };



exports.getUserPicture = (req,res) =>{
  // console.log('--------req.params.userid-----------');
  // console.log(req.params.userid);
  let userId=req.params.userid;
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }
  if(userId==null||userId==undefined||userId==''){
    // console.log('user_id is not defined');
    // // console.log(`Present working directory is ${process.env.PWD}`);
    fs.readFile(`${process.env.PWD}/public/img/avatar1.jpg`, (err, data)=>{
      if(err) return res.status(500).send(err);
      let user_img = new Buffer(data, 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/jpg',
        'Content-Length': user_img.length
      });
      // console.log(user_img);
      res.end(user_img);
    })
  }else{
      pool.connect((err, client, done) => {
        client.query("SELECT user_img,contenttype FROM USERS WHERE id=$1", [req.params.userid], function (err, userDetail) {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/user-profile',{userObj: {},user:req.user, error:err},"error"," Error in finding user data");
          }
          else {
            done();
            if(userDetail.rows.length>0){
              if(userDetail.rows[0].user_img!=null){
                let user_img = new Buffer(userDetail.rows[0].user_img, 'base64');
                // console.log('user_img found');
                res.setHeader('Cache-Control', 'public, max-age=10');
                // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                res.writeHead(200, {
                  'Content-Type': userDetail.rows[0].contenttype,
                  'Content-Length': user_img.length
                });
                res.end(user_img);

              }
              else{
                // console.log('user_img  not found');
                // // console.log(`Present working directory is ${process.env.PWD} ${process.cwd()}`);
                fs.readFile(`${process.env.PWD}/public/img/avatar1.jpg`, (err, data)=>{
                  if(err) return res.status(500).send(err);
                  let user_img = new Buffer(data, 'base64');
                  res.setHeader('Cache-Control', 'public, max-age=10');
                  // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                  res.writeHead(200, {
                    'Content-Type': 'image/jpg',
                    'Content-Length': user_img.length
                  });
                  // console.log(user_img);
                  res.end(user_img);
                })
              }
            }
          }


        });
      })

  }
}
exports.fileUserImage = (req, res) => {
  // console.log('req.files');
  // console.log(req.files.userpicture+' '+!req.files);
  if (!req.files||req.files.userpicture==null||req.files.userpicture==undefined){
    // console.log('No file uploaded');
    /*return res.status(400).send('No files were uploaded.');*/
    return res.status(500).redirect('/user-profile');
    /*handleResponse.handleError(res, 'No files were uploaded', ' No files were uploaded');*/
  }else{
    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if(err) {
          handleResponse.shouldAbort(err, client, done);
          // handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in connecting to the database");
          handleResponse.handleError(res, err, ' Error in connecting to the database');
        } else {
            client.query('SELECT * FROM USERS where id=$1',[req.user.id], function(err, selectedUser) {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    return res.status(500).redirect('/user-profile');
                  } else {
                      if(selectedUser.rows.length>0){
                        sharp(req.files.userpicture.data).resize(200,200).toBuffer()
                              .then( data =>{
                                  // console.log('company_logo after resizing :')
                                  // console.log(data);
                                  client.query('UPDATE USERS set contenttype=$1,user_img=$2 where id=$3 RETURNING *',[req.files.userpicture.mimetype,data,req.user.id], function(err, updatedUser) {
                                      if (err){
                                        handleResponse.shouldAbort(err, client, done);
                                        return res.status(500).redirect('/user-profile');
                                      } else {
                                        client.query('COMMIT', (err) => {
                                          if (err) {
                                            handleResponse.shouldAbort(err, client, done);
                                            return res.status(500).redirect('/user-profile');
                                            // handleResponse.responseToPage(res,'pages/login',{domain: req.query.domain,isAuthenticate : false},"error"," Error in committing transaction");
                                            // handleResponse.handleError(res, err, ' Error in committing transaction');
                                          } else {
                                            done();
                                            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                            res.header('Expires', '-1');
                                            res.header('Pragma', 'no-cache');
                                            return res.status(200).redirect('/user-profile');
                                          }
                                        });
                                      }
                                  });
                              })
                              .catch( err => {
                                // console.log('err');
                                // console.log(err);
                              });
                      }else{
                        done();
                        return res.status(500).redirect('/user-profile');
                      }

                   }
              });
            }
          });
    });
  }


};
