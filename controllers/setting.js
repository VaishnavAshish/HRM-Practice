const pg = require("pg");
var pool = require('./../config/dbconfig');
var handleResponse = require('./page-error-handle');
const formidable = require('formidable');
const util = require('util');
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const gm = require('gm').subClass({imageMagick: true});

exports.postEditSetting = (req, res) => {
  // console.log("Inside edit setting post method") ;
  // console.log(req.body);
  /*let company_address=;*/
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING where company_id=$1',[req.user.company_id], function(err, selectedSetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in getting settings');
          } else {
          		if(selectedSetting.rows.length>0){
                client.query('BEGIN', (err) => {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' error in connecting to database');
                  } else {
              			client.query('UPDATE SETTING set street=$1,city=$2,state=$3,country=$4,zip_code=$5,currency=$6,timezone=$7,weekstartday=$8 where company_id=$9 RETURNING id',[req.body.companyStreet, req.body.companyCity, req.body.companyState, req.body.companyCountry, req.body.companyZip,req.body.companyCurrency,req.body.timezone,req.body.weekstartday ,req.user.company_id], function(err, updatedSetting) {
      			          if (err){
      			            handleResponse.shouldAbort(err, client, done);
      			            handleResponse.handleError(res, err, ' Error in updating settings');
      			          } else {
                        client.query('UPDATE COMPANY set name=$1 where id=$2',[req.body.companyName,req.user.company_id],function(err,updatedCompany){
                          if (err){
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in updating company name');
                          } else {
                            client.query('COMMIT', (err) => {
                              if (err) {
                                // console.log('Error committing transaction', err.stack)
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in committing transaction');
                              } else {
                                done();
                                handleResponse.sendSuccess(res, 'settings updated successfully', {});
                              }
                            })
                          }
                        })

                      }
                    });
                  }
                })
          		}else{
                done();
                handleResponse.handleError(res, err, ' Error in finding company setting');
              }
              /*else{
      				client.query('Insert INTO SETTING (company_id,company_address,currency,expense_category,user_role,timezone) values ($1,$2,$3,$4,$5,$6) RETURNING id',[req.user.company_id,company_address,req.body.companyCurrency,['Food'],['Manager'],req.body.timezone], function(err, updatedSetting) {
			          if (err){
			            handleResponse.shouldAbort(err, client, done);
			            handleResponse.handleError(res, err, ' Error in inserting settings');
			          } else {
			            done();
			            handleResponse.sendSuccess(res,'settings inserting successfully',{});

			          }
			      });
          		}*/

           }
      });
  });

};

exports.postEditSettingUserRole = (req, res) => {
  // console.log("Inside edit setting post method");
  // console.log(req.body);
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING where company_id=$1',[req.user.company_id], function(err, selectedSetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in getting settings');
          } else {
      			if(req.body.userRole.length<=0){
      				req.body.userRole=['Manager'];
      			}
          		if(selectedSetting.rows.length>0){
                client.query('BEGIN', (err) => {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' error in connecting to database');
                  } else {
              			client.query('UPDATE SETTING set user_role=$1 where company_id=$2 RETURNING id',[req.body.userRole, req.user.company_id], function(err, updatedSetting) {
        			          if (err){
        			            handleResponse.shouldAbort(err, client, done);
        			            handleResponse.handleError(res, err, ' Error in updating settings');
        			          } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              // console.log('Error committing transaction', err.stack)
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
            			            done();
            			            handleResponse.sendSuccess(res,'settings updated successfully',{});
                            }
                          })
        			          }
        			      });
                  }
                })
          		}else{
                done();
                handleResponse.handleError(res, err, ' Error in finding company setting');
              }/*else{
      				client.query('Insert INTO SETTING (company_id,user_role,expense_category) values ($1,$2,$3) RETURNING id',[req.user.company_id,req.body.userRole,['Food']], function(err, updatedSetting) {
			          if (err){
			            handleResponse.shouldAbort(err, client, done);
			            handleResponse.handleError(res, err, ' Error in inserting settings');
			          } else {
			            done();
			            handleResponse.sendSuccess(res,'settings inserting successfully',{});

			          }
			      });
          		}*/

           }
      });
  });

};
exports.postEditSettingInvoice = (req, res) => {
  console.log("Inside edit setting post method");
  console.log(req.body.defaultEmailBody);
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING where company_id=$1',[req.user.company_id], function(err, selectedSetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in getting settings');
          } else {
              if(selectedSetting.rows.length>0){
                client.query('BEGIN', (err) => {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' error in connecting to database');
                  } else {
              			client.query('UPDATE SETTING set invoice_note=$1,invoice_timesheet_note=$2,invoice_fixedfee_note=$3,invoice_expense_note=$4,invoice_other_note=$5,invoice_starting_number=$6,invoice_email_subject=$7,invoice_email_body=$8 where company_id=$9 RETURNING id',[req.body.defaultInvoiceNote,req.body.defaultTimesheetNote,req.body.defaultFixedFeeNote,req.body.defaultExpenseNote,req.body.defaultOtherNote,req.body.defaultInvoiceStartNumber,req.body.defaultEmailSubject,req.body.defaultEmailBody,req.user.company_id], function(err, updatedSetting) {
        			          if (err){
                          console.log('error in updating invoice number');
                          console.log(err.where);
                          if(err.where && err.where.includes('change_invoice_sequence_number')){
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Error in updating settings.Invoice start number must be greater then the generated invoice numbers ');
                          }else{
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, 'Error in updating settings');
                          }
        			          } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              // console.log('Error committing transaction', err.stack)
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
            			            done();
            			            handleResponse.sendSuccess(res,'settings updated successfully',{});
                            }
                          })

        			          }
        			      });
                  }
                })
          		}else{
                done();
                handleResponse.handleError(res, err, ' Error in finding company setting');
              }/*else{
      				client.query('Insert INTO SETTING (company_id,invoice_note,expense_category,user_role) values ($1,$2,$3,$4) RETURNING id',[req.user.company_id,req.body.defaultInvoiceNote,['Food'],['Manager']], function(err, updatedSetting) {
			          if (err){
			            handleResponse.shouldAbort(err, client, done);
			            handleResponse.handleError(res, err, ' Error in inserting settings');
			          } else {
			            done();
			            handleResponse.sendSuccess(res,'settings inserting successfully',{});

			          }
			      });
          		}*/

           }
      });
  });

};
exports.fileupload = (req, res) => {
  // console.log('req.files');
  // console.log(req.files.uploadedImageFile+' '+!req.files);
  if (!req.files||req.files.uploadedImageFile==null||req.files.uploadedImageFile==undefined){
    // console.log('No file uploaded');
    /*return res.status(400).send('No files were uploaded.');*/
    return res.status(500).redirect('/org-settings-invoice');
    /*handleResponse.handleError(res, 'No files were uploaded', ' No files were uploaded');*/
  }else{
    pool.connect((err, client, done) => {
      client.query('BEGIN', (err) => {
        if (err){
          handleResponse.shouldAbort(err, client, done);
          // handleResponse.handleError(res, err, ' error in connecting to database');
          return res.status(500).redirect('/org-settings-invoice');
        } else {
          client.query('SELECT * FROM SETTING where company_id=$1',[req.user.company_id], function(err, selectedSetting) {
                if (err){
                  handleResponse.shouldAbort(err, client, done);
                  return res.status(500).redirect('/org-settings-invoice');
                } else {
                    if(selectedSetting.rows.length>0){
                      gm(req.files.uploadedImageFile.data)
                      .identify(function (err, features) {
                        if (err) {
                          done();
                          return res.status(500).redirect('/org-settings-invoice');
                        }else{
                          console.log('information of uploaded file is');
                          console.log(features.Filesize);
                          let featureFileSize = parseFloat(features.Filesize.replace( /^\D+/g, ''));
                          console.log('featureFileSize '+ featureFileSize)
                          if(featureFileSize > 2 && features.Filesize.substring(features.Filesize.length-2) == 'MB'){
                            sharp(req.files.uploadedImageFile.data).resize(200,200).toBuffer()
                            .then( data =>{
                              // console.log('company_logo after resizing :')
                              // console.log(data);
                              client.query('UPDATE SETTING set contenttype=$1,company_logo=$2 where company_id=$3 RETURNING *',[req.files.uploadedImageFile.mimetype,data,req.user.company_id], function(err, updatedSetting) {
                                if (err){
                                  handleResponse.shouldAbort(err, client, done);
                                  return res.status(500).redirect('/org-settings-invoice');
                                } else {
                                  client.query('COMMIT', (err) => {
                                    if (err) {
                                      // console.log('Error committing transaction', err.stack)
                                      handleResponse.shouldAbort(err, client, done);
                                      // handleResponse.handleError(res, err, ' Error in committing transaction');
                                      return res.status(500).redirect('/org-settings-invoice');
                                    } else {
                                      done();
                                      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                      res.header('Expires', '-1');
                                      res.header('Pragma', 'no-cache');
                                      return res.status(200).redirect('/org-settings-invoice');
                                    }
                                  })
                                }
                              });
                            })
                            .catch( err => {
                              done();
                              return res.status(500).redirect('/org-settings-invoice');
                            });
                          }else{
                            client.query('UPDATE SETTING set contenttype=$1,company_logo=$2 where company_id=$3 RETURNING *',[req.files.uploadedImageFile.mimetype,req.files.uploadedImageFile.data,req.user.company_id], function(err, updatedSetting) {
                              if (err){
                                handleResponse.shouldAbort(err, client, done);
                                return res.status(500).redirect('/org-settings-invoice');
                              } else {
                                client.query('COMMIT', (err) => {
                                  if (err) {
                                    // console.log('Error committing transaction', err.stack)
                                    handleResponse.shouldAbort(err, client, done);
                                    // handleResponse.handleError(res, err, ' Error in committing transaction');
                                    return res.status(500).redirect('/org-settings-invoice');
                                  } else {
                                    done();
                                    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                    res.header('Expires', '-1');
                                    res.header('Pragma', 'no-cache');
                                    return res.status(200).redirect('/org-settings-invoice');
                                  }
                                })
                              }
                            });
                          }
                        }
                      });



                    }else{
                      done();
                      return res.status(500).redirect('/org-settings-invoice');
                    }

                 }
            });
          }
        })
    });
  }


};

exports.postEditSettingExpense = (req, res) => {
  // console.log("Inside edit setting post method");
  // console.log(req.body);
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING where company_id=$1',[req.user.company_id], function(err, selectedSetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in getting settings');
          } else {
  				// console.log('Inside expense category '+req.body.expCategory.length);
	  			if(req.body.expCategory.length<=0){
	  				req.body.expCategory=['Food'];
	  			}
          		if(selectedSetting.rows.length>0){
                client.query('BEGIN', (err) => {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' error in connecting to database');
                  } else {
                  			client.query('UPDATE SETTING set expense_category=$1 where company_id=$2 RETURNING id',[req.body.expCategory,req.user.company_id], function(err, updatedSetting) {
        			          if (err){
        			            handleResponse.shouldAbort(err, client, done);
        			            handleResponse.handleError(res, err, ' Error in updating settings');
        			          } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              // console.log('Error committing transaction', err.stack)
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
            			            done();
            			            handleResponse.sendSuccess(res,'settings updated successfully',{});
                            }
                          })

        			          }
        			      });
                  }
                })
          		}else{
                done();
                handleResponse.handleError(res, err, ' Error in finding company setting');
              }/*else{
      				client.query('Insert INTO SETTING (company_id,expense_category,user_role) values ($1,$2,$3) RETURNING id',[req.user.company_id,req.body.expCategory,['Manager']], function(err, updatedSetting) {
			          if (err){
			            handleResponse.shouldAbort(err, client, done);
			            handleResponse.handleError(res, err, ' Error in inserting settings');
			          } else {
			            done();
			            handleResponse.sendSuccess(res,'settings inserting successfully',{});

			          }
			      });
          		}*/

           }
      });
  });

};

exports.postEditSettingTax = (req, res) => {
  // console.log("Inside edit setting post method");
  // console.log(req.body);
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING where company_id=$1',[req.user.company_id], function(err, selectedSetting) {
          if (err){
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in getting settings');
          } else {
  				// console.log('Inside expense category '+req.body.expCategory.length);
	  			if(req.body.taxCategory.length<=0){
	  				req.body.taxCategory=['GST'];
	  			}
          		if(selectedSetting.rows.length>0){
                client.query('BEGIN', (err) => {
                  if (err){
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' error in connecting to database');
                  } else {
                  			client.query('UPDATE SETTING set tax_category=$1 where company_id=$2 RETURNING id',[req.body.taxCategory,req.user.company_id], function(err, updatedSetting) {
        			          if (err){
        			            handleResponse.shouldAbort(err, client, done);
        			            handleResponse.handleError(res, err, ' Error in updating settings');
        			          } else {
                          client.query('COMMIT', (err) => {
                            if (err) {
                              // console.log('Error committing transaction', err.stack)
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in committing transaction');
                            } else {
            			            done();
            			            handleResponse.sendSuccess(res,'settings updated successfully',{});
                            }
                          })

        			          }
        			      });
                  }
                })
          		}else{
                done();
                handleResponse.handleError(res, err, ' Error in finding company setting');
              }/*else{
      				client.query('Insert INTO SETTING (company_id,expense_category,user_role) values ($1,$2,$3) RETURNING id',[req.user.company_id,req.body.expCategory,['Manager']], function(err, updatedSetting) {
			          if (err){
			            handleResponse.shouldAbort(err, client, done);
			            handleResponse.handleError(res, err, ' Error in inserting settings');
			          } else {
			            done();
			            handleResponse.sendSuccess(res,'settings inserting successfully',{});

			          }
			      });
          		}*/

           }
      });
  });

};

exports.getSetting = (req, res) => {
  // console.log(moment.tz.names());
  let timezones=moment.tz.names();
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/org-settings-general',{setting:{},user:req.user, error:err,timezones:timezones,STRIPE_PUBLISH_KEY : process.env.STRIPE_PUBLISH_KEY},"error","  Error in finding setting data");
      } else {
        	if(companySetting.rows.length<0){
			  	    done();
	            handleResponse.responseToPage(res,'pages/org-settings-general',{setting:{},user:req.user,timezones:timezones,stripeCustomerId:null,STRIPE_PUBLISH_KEY : process.env.STRIPE_PUBLISH_KEY},"success","Successfully rendered");
        	}else{
		        done();
		        handleResponse.responseToPage(res,'pages/org-settings-general',{setting:companySetting.rows[0],user:req.user,timezones:timezones,stripeCustomerId:companySetting.rows[0].stripe_customer_id,STRIPE_PUBLISH_KEY : process.env.STRIPE_PUBLISH_KEY},"success","Successfully rendered");
        	}
      }


    });
  })
};

exports.getSettingExport = (req, res) => {
  console.log(moment.tz.names());
  // let timezones=moment.tz.names();
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/org-settings-export',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
      } else {
        	if(companySetting.rows.length<0){
			  	    done();
	            handleResponse.responseToPage(res,'pages/org-settings-export',{setting:{},user:req.user,stripeCustomerId:null},"success","Successfully rendered");
        	}else{
		        done();
		        handleResponse.responseToPage(res,'pages/org-settings-export',{setting:companySetting.rows[0],user:req.user,stripeCustomerId:companySetting.rows[0].stripe_customer_id},"success","Successfully rendered");
        	}
      }


    });
  })
};

exports.getSettingUserRole = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('SELECT user_role,stripe_customer_id FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/org-settings-userrole',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
      } else {
        	if(companySetting.rows.length<0){
			  	done();
	            handleResponse.responseToPage(res,'pages/org-settings-userrole',{setting:{},user:req.user,stripeCustomerId:null},"success","Successfully rendered");
        	}else{
		        done();
		        handleResponse.responseToPage(res,'pages/org-settings-userrole',{setting:companySetting.rows[0],user:req.user,stripeCustomerId:companySetting.rows[0].stripe_customer_id},"success","Successfully rendered");
        	}
      }


    });
  })
};
exports.getSettingInvoice = (req, res) => {
  pool.connect((err, client, done) => {
    client.query("SELECT invoice_note,invoice_timesheet_note,invoice_fixedfee_note,invoice_expense_note,invoice_other_note,invoice_starting_number,invoice_email_subject,invoice_email_body FROM SETTING WHERE company_id=$1", [req.user.company_id], function (err, companySetting) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/org-settings-invoice',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
      } else {
          if(companySetting.rows.length<0){
              done();
              handleResponse.responseToPage(res,'pages/org-settings-invoice',{setting:{},user:req.user},"success","Successfully rendered");
          }else{
            /*companySetting.rows[0].company_logo=companySetting.rows[0].company_logo.toString('base64');*/
            /*// console.log('----------company setting--------')
            // console.log(companySetting.rows[0].company_logo);*/
            done();
            /*res.header('Content-Type','image/jpg' );
            res.render('pages/org-settings-invoice',{setting:companySetting.rows[0],user:req.user,messageType:"success",message:"Successfully rendered"});*/
		        handleResponse.responseToPage(res,'pages/org-settings-invoice',{setting:companySetting.rows[0],user:req.user,stripeCustomerId:companySetting.rows[0].stripe_customer_id},"success","Successfully rendered");
        	}
      }


    });
  })
};

exports.getCompanyLogoForEmail = (req,res) =>{
  console.log('inside getCompanyLogoForEmail')
  console.log(req.params.companyid)
    pool.connect((err, client, done) => {
        client.query("SELECT company_logo,contenttype FROM SETTING WHERE company_id=$1", [req.params.companyid], function (err, companySetting) {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/org-settings-invoice',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
          } else {
                /*companySetting.rows[0].company_logo=companySetting.rows[0].company_logo.toString('base64');*/
                // console.log('--------------------------------AJAY ----------');
                // console.log(companySetting.rows);
                done();
                if(companySetting.rows.length>0){
                  if(companySetting.rows[0].company_logo!=null){
                    let company_logo = new Buffer(companySetting.rows[0].company_logo, 'base64');

                         /*// console.log(company_logo);*/
                          // res.setHeader('Cache-Control', 'public, max-age=10');
                          // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                          // res.setHeader("Pragma", "no-cache");
                          // res.setHeader("Cache-Control", "no-cache, must-revalidate");
                          // res.setDateHeader("Expires", 0);
                          res.writeHead(200, {
                             'Content-Type': companySetting.rows[0].contenttype,
                             'Content-Length': company_logo.length
                           });
                           res.end(companySetting.rows[0].company_logo);


                  }
                  else{
                      if (!process.env.PWD) {
                        process.env.PWD = process.cwd();
                      }
                      fs.readFile(`${process.env.PWD}/public/img/logo-place-holder.jpg`, (err, data)=>{
                            if(err) return res.status(500).send(err);
                            let company_logo = new Buffer(data, 'base64');
                            // res.setHeader('Cache-Control', 'public, max-age=10');
                            // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                  res.writeHead(200, {
                                     'Content-Type': 'image/jpg',
                                     'Content-Length': company_logo.length
                                   });
                                  // console.log(data);
                                  res.end(data);
                        })
                      /*let company_logo = new Buffer('https://multitenant-example-1.herokuapp.com/img/logo-place-holder.jpg', 'base64');
                      done();
                      res.writeHead(200, {
                         'Content-Type': 'image/jpg',
                         'Content-Length': company_logo.length
                       });
                      // console.log(company_logo);
                      res.send(company_logo);*/
                       /*res.sendFile('https://multitenant-example-1.herokuapp.com/img/logo-place-holder.jpg');  */
                  }
                }


          }


        });
      })
}

exports.getCompanyLogo = (req,res) =>{
    pool.connect((err, client, done) => {
        client.query("SELECT company_logo,contenttype FROM SETTING WHERE company_id=$1", [req.user.company_id], function (err, companySetting) {
          if (err) {
            handleResponse.shouldAbort(err, client, done);
            handleResponse.responseToPage(res,'pages/org-settings-invoice',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
          } else {
                /*companySetting.rows[0].company_logo=companySetting.rows[0].company_logo.toString('base64');*/
                // console.log('--------------------------------AJAY ----------');
                // console.log(companySetting.rows);
                done();
                if(companySetting.rows.length>0){
                  if(companySetting.rows[0].company_logo!=null){
                    let company_logo = new Buffer(companySetting.rows[0].company_logo, 'base64');

                         /*// console.log(company_logo);*/
                          // res.setHeader('Cache-Control', 'public, max-age=10');
                          // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                          // res.setHeader("Pragma", "no-cache");
                          // res.setHeader("Cache-Control", "no-cache, must-revalidate");
                          // res.setDateHeader("Expires", 0);
                          res.writeHead(200, {
                             'Content-Type': companySetting.rows[0].contenttype,
                             'Content-Length': company_logo.length
                           });
                           res.end(companySetting.rows[0].company_logo);


                  }
                  else{
                      if (!process.env.PWD) {
                        process.env.PWD = process.cwd();
                      }
                      fs.readFile(`${process.env.PWD}/public/img/logo-place-holder.jpg`, (err, data)=>{
                            if(err) return res.status(500).send(err);
                            let company_logo = new Buffer(data, 'base64');
                            // res.setHeader('Cache-Control', 'public, max-age=10');
                            // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                  res.writeHead(200, {
                                     'Content-Type': 'image/jpg',
                                     'Content-Length': company_logo.length
                                   });
                                  // console.log(data);
                                  res.end(data);
                        })
                      /*let company_logo = new Buffer('https://multitenant-example-1.herokuapp.com/img/logo-place-holder.jpg', 'base64');
                      done();
                      res.writeHead(200, {
                         'Content-Type': 'image/jpg',
                         'Content-Length': company_logo.length
                       });
                      // console.log(company_logo);
                      res.send(company_logo);*/
                       /*res.sendFile('https://multitenant-example-1.herokuapp.com/img/logo-place-holder.jpg');  */
                  }
                }


          }


        });
      })
}

exports.getSettingExpense = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('SELECT expense_category,stripe_customer_id FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/org-settings-expense',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
      } else {
        	if(companySetting.rows.length<0){
			  	done();
            	handleResponse.responseToPage(res,'pages/org-settings-expense',{setting:{},user:req.user,stripeCustomerId:null},"success","Successfully rendered");
        	}else{
		        done();
		        handleResponse.responseToPage(res,'pages/org-settings-expense',{setting:companySetting.rows[0],user:req.user,stripeCustomerId:companySetting.rows[0].stripe_customer_id},"success","Successfully rendered");
        	}
      }


    });
  })
};

exports.getSettingTax = (req, res) => {
  pool.connect((err, client, done) => {
    client.query('SELECT tax_category,stripe_customer_id FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, companySetting) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.responseToPage(res,'pages/org-settings-tax',{setting:{},user:req.user, error:err},"error","  Error in finding setting data");
      } else {
        	if(companySetting.rows.length<0){
			  	done();
            	handleResponse.responseToPage(res,'pages/org-settings-tax',{setting:{},user:req.user,stripeCustomerId:null},"success","Successfully rendered");
        	}else{
		        done();
		        handleResponse.responseToPage(res,'pages/org-settings-tax',{setting:companySetting.rows[0],user:req.user,stripeCustomerId:companySetting.rows[0].stripe_customer_id},"success","Successfully rendered");
        	}
      }
    });
  })
};

exports.checkUserRoleAssignment = (req,res) => {
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM USERS WHERE company_id=$1 AND archived=$2 AND role=$3', [req.user.company_id,false,req.body.role], function (err, assignedUserRole) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in getting user roles');
      } else {
          if(assignedUserRole.rows.length>0){
              done();
              handleResponse.sendSuccess(res,'User role is assigned to company users.',{result:false});
          }else{
            client.query('SELECT * FROM project_assignment WHERE company_id=$1 AND user_role=$2', [req.user.company_id,req.body.role], function (err, assignedUserRoleProject) {
              if (err) {
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in getting user roles');
              } else {
                if(assignedUserRoleProject.rows.length>0){
                      done();
                      handleResponse.sendSuccess(res,'User role is assigned to company users in project assignement.',{result:false});
                  }else{
                      done();
                      handleResponse.sendSuccess(res,'User role is not assigned to company users.',{result:true});
                  }
              }
          });
        }
      }
    });
  })


}
exports.checkExpenseCategoryAssign = (req,res) => {
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM EXPENSE WHERE company_id=$1 AND archived=$2 AND category=$3', [req.user.company_id,false,req.body.expenseCat], function (err, assignedExpCat) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in getting expense catgory');
      } else {
          if(assignedExpCat.rows.length>0){
              done();
              handleResponse.sendSuccess(res,'Expense Category is assigned to existing expense.',{result:false});
          }else{
              done();
              handleResponse.sendSuccess(res,'Expense Category is not assigned to expense.',{result:true});
        }
      }
    });
  })
}

exports.checkTaxCategoryAssign = (req,res) => {
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM invoice WHERE company_id=$1 AND archived=$2 AND tax_category=$3', [req.user.company_id,false,req.body.taxCat], function (err, assignedTaxCat) {
      if (err) {
        handleResponse.shouldAbort(err, client, done);
        handleResponse.handleError(res, err, ' Error in getting Tax catgory');
      } else {
          if(assignedTaxCat.rows.length>0){
              done();
              handleResponse.sendSuccess(res,'Tax Category is assigned to existing invoice.',{result:false});
          }else{
              done();
              handleResponse.sendSuccess(res,'Tax Category is not assigned to invoice.',{result:true});
        }
      }
    });
  })


}
