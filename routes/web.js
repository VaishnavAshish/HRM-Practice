'use strict';

/**
 * Controllers (route handlers).
 */
const upload = require('./../config/multer');
const adminController = require('./../controllers/admin');
const authController = require('./../controllers/auth');
const projectController = require('./../controllers/project');
const projectResourceController = require('./../controllers/projectResource');
const taskController = require('./../controllers/task');
const timesheetController = require('./../controllers/timesheet');
const resourceController = require('./../controllers/resource');
const accountController = require('./../controllers/account');
const invoiceController = require('./../controllers/invoice');
const expenseController = require('./../controllers/expense');
const settingController = require('./../controllers/setting');
const passport = require('passport');
const roleConfig = require('./../config/user-role');
const passportConfig = require('./../config/passport');

module.exports = function(app) {

    /**
     * Primary app routes.
     */


    /**
     * Public
     */

    app.get('/', function(req, res) {
        res.redirect('/domain');
    });


    app.get('/domain', authController.getDomain);
    app.post('/domain', authController.postDomain);
    app.get('/login', authController.getLogin);
    app.post('/login', authController.postLogin);
    app.post('/postResetPassword', resourceController.postResetPassword);

    /*app.post('/postReset', authController.postReset);*/

    // app.get('/forgot', authController.getForgot);
    // app.post('/forgot', authController.postForgot);
    app.get('/reset/:token', authController.getReset);
    app.post('/reset', authController.postReset);

    app.get('/signup', function(req, res) {
        res.render('pages/signup',{
            messageType:'success',
            message :'Page rendered successfuly'
        });
    });

    app.get('/check-domain', function(req, res) {
        res.render('pages/company-admin-details', {
            domain: req.query.domain,
            messageType:'success',
            message :'Page rendered successfuly'
          });
    });
    // app.post('/signup', authController.postSignup);
    /**
     * secure
     */


    app.get('/home', passportConfig.isAuthenticated, roleConfig.nocache, function(req, res) {
        console.log('--------req.user redirect------');
        console.log(req.session.passport.user);
        res.render('pages/home', {user:req.session.passport.user,
            messageType:'success',
            message :'Page rendered successfuly'
        });
    });

    //searching url
    /*app.post('/findCompanyByName', passportConfig.isAuthenticated,adminController.findCompanyByName);*/
    /*app.post('/findUserByEmail', passportConfig.isAuthenticated,resourceController.findUserByEmail);*/
    /*app.post('/findAccountByName', passportConfig.isAuthenticated,accountController.findAccountByName);*/

    app.post('/activate', passportConfig.isAuthenticated,adminController.postActivate);

    app.get('/currentTimestamp', passportConfig.isAuthenticated,adminController.getCurrentTimestamp);

    app.post('/editCompanySetting', passportConfig.isAuthenticated,settingController.postEditSetting);
    app.post('/editCompanySettingExpense', passportConfig.isAuthenticated,settingController.postEditSettingExpense);
    app.post('/editCompanySettingUserRole', passportConfig.isAuthenticated,settingController.postEditSettingUserRole);
    app.post('/editCompanySettingInvoice', passportConfig.isAuthenticated,upload.single("file"),settingController.postEditSettingInvoice);

    app.post('/checkUserRoleAssignment', passportConfig.isAuthenticated,settingController.checkUserRoleAssignment);
    app.post('/checkExpenseCategoryAssign', passportConfig.isAuthenticated,settingController.checkExpenseCategoryAssign);
    app.get('/getCompanyLogo', passportConfig.isAuthenticated,settingController.getCompanyLogo);
    app.post('/fileupload', passportConfig.isAuthenticated,settingController.fileupload);


    app.get('/getUserPicture/:userid', passportConfig.isAuthenticated,authController.getUserPicture);
    app.post('/fileUserImage', passportConfig.isAuthenticated,authController.fileUserImage);


    app.post('/findProjectByName', passportConfig.isAuthenticated,projectController.findProjectByName);
    app.post('/findTaskByName', passportConfig.isAuthenticated,taskController.findTaskByName);
    app.post('/findExpenseForAccount', passportConfig.isAuthenticated,expenseController.findExpenseForAccount);
    app.post('/findInvoiceForAccount', passportConfig.isAuthenticated,invoiceController.findInvoiceForAccount);

    app.get('/generatePdfFromHtml/:invoiceId', passportConfig.isAuthenticated,invoiceController.generatePdfFromHtml);




    //filter on page url
    app.post('/findAccountByCriteria', passportConfig.isAuthenticated,accountController.findAccountByCriteria);
    app.post('/findResourceByCriteria', passportConfig.isAuthenticated,resourceController.findResourceByCriteria);
    app.post('/findProjectByCriteria', passportConfig.isAuthenticated,projectController.findProjectByCriteria);
    app.post('/findExpenseByCriteria', passportConfig.isAuthenticated,expenseController.findExpenseByCriteria);
    app.post('/findInvoiceByCriteria', passportConfig.isAuthenticated,invoiceController.findInvoiceByCriteria);
    app.post('/findCompanyByCriteria', passportConfig.isAuthenticated,adminController.findCompanyByCriteria);

    app.post('/addAccount', passportConfig.isAuthenticated, accountController.postAddAccount);
    app.post('/deleteAccount', passportConfig.isAuthenticated, accountController.deleteAccount);
    app.post('/editAccount', passportConfig.isAuthenticated, accountController.postEditAccount);

    app.post('/addExpense', passportConfig.isAuthenticated, expenseController.postAddExpense);
    app.post('/deleteExpense', passportConfig.isAuthenticated, expenseController.deleteExpense);
    app.post('/editExpense', passportConfig.isAuthenticated, expenseController.postEditExpense);
    app.post('/submitExpense', passportConfig.isAuthenticated, expenseController.submitExpense);
    app.get('/generateExpenseCsv', passportConfig.isAuthenticated, expenseController.generateExpenseCsv);


    //app.get('/project', passportConfig.isAuthenticated, projectController.getProject);
    app.get('/addProject', passportConfig.isAuthenticated, projectController.getAddProject);
    app.post('/deleteProject', passportConfig.isAuthenticated, projectController.deleteProject);
    app.post('/addProject', passportConfig.isAuthenticated, projectController.postAddProject);
    app.get('/editProject/:projectId', passportConfig.isAuthenticated, projectController.getEditProject);
    app.post('/editProject', passportConfig.isAuthenticated, projectController.postEditProject);
    app.post('/getGlobalProject', passportConfig.isAuthenticated, projectController.getGlobalProject);
    app.post('/checkAndCreateProjectAssignment', passportConfig.isAuthenticated, projectController.checkAndCreateProjectAssignment);
    app.get('/generateProjectCsv', passportConfig.isAuthenticated, projectController.generateProjectCsv);


    app.post('/addProjectResource', passportConfig.isAuthenticated, projectResourceController.postAddProjectRes);
    app.post('/deleteProjectResource', passportConfig.isAuthenticated, projectResourceController.deleteProjectRes);

    // app.get('/users', passportConfig.isAuthenticated, resourceController.getResource);
    app.post('/addResource', passportConfig.isAuthenticated, resourceController.postAddResource);
    app.post('/deleteResource', passportConfig.isAuthenticated, resourceController.deleteResource);
    app.post('/updateResource', passportConfig.isAuthenticated, resourceController.updateResource);

    // app.get('/task', passportConfig.isAuthenticated, taskController.getTask);
    app.post('/deleteTask', passportConfig.isAuthenticated, taskController.deleteTask);
    app.post('/addTask', passportConfig.isAuthenticated, taskController.postAddTask);
    // app.get('/editTask/:taskId', passportConfig.isAuthenticated, taskController.getEditTask);
    app.post('/editTask', passportConfig.isAuthenticated, taskController.postEditTask);
    app.get('/generateTaskCsv/:projectId', passportConfig.isAuthenticated, taskController.generateTaskCsv);


    app.get('/timesheet/:userId',passportConfig.isAuthenticated, roleConfig.permit,roleConfig.nocache, timesheetController.getTimesheet);
    app.post('/addTimesheet', passportConfig.isAuthenticated, timesheetController.addTimesheet);
    app.post('/addMultipleTimesheet', passportConfig.isAuthenticated, timesheetController.addMultipleTimesheet);
    app.post('/submitMultipleTimesheet', passportConfig.isAuthenticated, timesheetController.submitMultipleTimesheet);
    app.post('/getDayTimesheetData', passportConfig.isAuthenticated, timesheetController.getDayTimesheetData);
    app.post('/updateTimesheet', passportConfig.isAuthenticated, timesheetController.updateDayTimesheetData);
    app.post('/updateTimesheetByWeekly', passportConfig.isAuthenticated, timesheetController.updateWeeklyTimesheetData);
    app.post('/deleteTimesheetRow', passportConfig.isAuthenticated, timesheetController.deleteTimesheetRow);
    app.post('/submitDayTimesheet', passportConfig.isAuthenticated, timesheetController.submitDayTimesheet);
    app.post('/updateTimesheetHours', passportConfig.isAuthenticated, timesheetController.updateDayTimesheetHours);
    app.post('/getTimesheetDataWithTaskId', passportConfig.isAuthenticated, timesheetController.getDayTimesheetWithTaskId);
    app.post('/getTimesheetWithPlay', passportConfig.isAuthenticated, timesheetController.getTimesheetWithPlay);
    app.post('/submitWeeklyTimesheetByProjectTaskId', passportConfig.isAuthenticated, timesheetController.submitWeeklyTimesheetByProjectTaskId);
    app.post('/submitWeeklyTimesheet', passportConfig.isAuthenticated, timesheetController.submitWeeklyTimesheet);
    app.get('/timesheet/generateTimesheetCsv/:weekstartdate', passportConfig.isAuthenticated, timesheetController.generateTimesheetCsv);


// /submitWeeklyTimesheetByProjectId

    // submitDayTimesheet
    // app.get('/editTimesheet', passportConfig.isAuthenticated, timesheetController.getEditTimesheet);
    // getDayTimesheetData
    // app.post('/deleteTimesheet', passportConfig.isAuthenticated, timesheetController.deleteTimesheet);
    // app.post('/editTimesheet', passportConfig.isAuthenticated, timesheetController.postEditTimesheet);

    app.get('/company', passportConfig.isAuthenticated, roleConfig.nocache,  adminController.getCompany);
    app.post('/deleteCompany', passportConfig.isAuthenticated, adminController.deleteCompany);
    app.post('/updateCompany', passportConfig.isAuthenticated, adminController.updateCompany);
    app.post('/addCompany', adminController.postAddCompany);


    app.get('/logout', passportConfig.isAuthenticated, authController.logout);


    // app.get('/account', passportConfig.isAuthenticated, authController.getAccount);
    // app.post('/account/profile', passportConfig.isAuthenticated, authController.postUpdateProfile);
    // app.post('/account/password', passportConfig.isAuthenticated, authController.postUpdatePassword);
    // app.post('/account/delete', passportConfig.isAuthenticated, authController.postDeleteAccount);
    // app.get('/account/unlink/:provider', passportConfig.isAuthenticated, authController.getOauthUnlink);
    app.get('/expenses-listing/:userId', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        expenseController.getExpense(req, res);
    });

    app.get('/expense-details', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        expenseController.getExpenseDetail(req, res);
    });

    app.get('/projects-listing', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        //res.render('pages/projects-listing',{user:req.session.passport.user});
        projectController.getProject(req, res)
    });
    app.get('/org-listing', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        adminController.getCompany(req, res);
    });
    app.get('/resources-listing', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        adminController.getAllCompanyResources(req, res);
    });
    app.get('/resource-details', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache,function(req, res) {
        adminController.getResourceDetail(req, res);
    });

    app.get('/user-profile', passportConfig.isAuthenticated, roleConfig.nocache, function(req, res) {
        adminController.getUserProfile(req, res);
    });

    app.get('/company-profile', passportConfig.isAuthenticated, roleConfig.nocache, function(req, res) {
        adminController.getCompanyProfile(req, res);
    });

    app.get('/reset-password', roleConfig.nocache,  function (req, res) {
        /*res.render('pages/reset-password',{user:req.session.passport.user});*/
        authController.getResetPassword(req, res);
    });
    app.get('/admin-login', passportConfig.isAuthenticated, roleConfig.nocache, function (req, res) {
        res.render('pages/admin-login',{user:req.session.passport.user});
    });

    app.get('/org-details', passportConfig.isAuthenticated,roleConfig.permit,roleConfig.nocache, function(req, res) {
        adminController.getCompanyDetail(req, res);
    });

    app.get('/org-settings', passportConfig.isAuthenticated,roleConfig.permit,roleConfig.nocache, function (req, res) {
        settingController.getSetting(req, res);
    });

    app.get('/org-settings-userrole', passportConfig.isAuthenticated,roleConfig.permit,roleConfig.nocache, function (req, res) {
        settingController.getSettingUserRole(req, res);
    });
    app.get('/org-settings-expense', passportConfig.isAuthenticated,roleConfig.permit,roleConfig.nocache, function (req, res) {
        settingController.getSettingExpense(req, res);
    });
    app.get('/org-settings-invoice', passportConfig.isAuthenticated,roleConfig.permit,roleConfig.nocache, function (req, res) {
        settingController.getSettingInvoice(req, res);
    });


    app.get('/org-settings-timesheet', passportConfig.isAuthenticated,roleConfig.nocache,  function (req, res) {

        res.render('pages/org-settings-timesheet',{user:req.session.passport.user,
            messageType:'success',
            message :'Page rendered successfuly'
        });
    });
    app.get('/org-import-data', passportConfig.isAuthenticated,roleConfig.nocache,  function (req, res) {
        res.render('pages/org-import-data',{user:req.session.passport.user,
            messageType:'success',
            message :'Page rendered successfuly'
        });
    });

    app.get('/project-details', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        projectController.getProjectDetail(req, res);
    });

    app.get('/accounts-listing', passportConfig.isAuthenticated,roleConfig.permit, roleConfig.nocache, function(req, res) {
        /*res.render('pages/accounts-listing',{user:req.session.passport.user});*/
        accountController.getAccount(req, res)
    });

    app.get('/account-details', passportConfig.isAuthenticated, roleConfig.permit,roleConfig.nocache, function(req, res) {
        /*res.render('pages/account-details',{user:req.session.passport.user});*/
        accountController.getAccountDetail(req, res);
    });

    app.get('/invoice-html-view/:invoiceId', passportConfig.isAuthenticated, invoiceController.generateInvoiceHTML);
    // res.render('pages/invoice-html-view');


    app.get('/invoices-listing', passportConfig.isAuthenticated, roleConfig.permit,roleConfig.nocache, invoiceController.getInvoice);
    app.get('/invoice-details', passportConfig.isAuthenticated, roleConfig.permit, roleConfig.nocache, invoiceController.getInvoiceDetails);

    app.post('/deleteInvoice', passportConfig.isAuthenticated, invoiceController.deleteInvoice);
    app.post('/addInvoice', passportConfig.isAuthenticated, invoiceController.postAddInvoice);
    app.post('/editInvoice', passportConfig.isAuthenticated, invoiceController.postInvoiceDetails);
    app.post('/deleteInvoiceItem', passportConfig.isAuthenticated, invoiceController.deleteInvoiceItem);
    app.post('/addInvoiceItem', passportConfig.isAuthenticated, invoiceController.postAddInvoiceItem);
    app.post('/editInvoiceItem', passportConfig.isAuthenticated, invoiceController.postInvoiceItemDetail);
    app.post('/insertExpenseInvoiceItem', passportConfig.isAuthenticated, invoiceController.insertExpenseInvoiceItem);
    app.post('/insertTimesheetInvoiceItem', passportConfig.isAuthenticated, invoiceController.insertTimesheetInvoiceItem);
    app.post('/insertNewInvoiceItem', passportConfig.isAuthenticated, invoiceController.insertNewInvoiceItem);
    app.get('/generateInvoiceCsv', passportConfig.isAuthenticated, invoiceController.generateInvoiceCsv);


    app.get('/task-details', passportConfig.isAuthenticated, roleConfig.permit,roleConfig.nocache, function(req, res) {
        // res.render('pages/task-details',{user:req.session.passport.user});
        taskController.getTaskDetails(req, res);
    });

    app.post('/getTaskAndAssignmentList', passportConfig.isAuthenticated, taskController.getTaskAndAssignmentList);
    app.post('/getProjectList', passportConfig.isAuthenticated, projectController.getProjectList);
    app.get('/getProjectListForCompany', passportConfig.isAuthenticated, projectController.getProjectListForCompany);

    app.get('*',function(req, res) {
        res.redirect('/domain');
    });

};
