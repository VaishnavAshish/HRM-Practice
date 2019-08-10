let role={
	"super_admin":["org-listing","org-details","resource-details"],
	"admin":["accounts-listing","account-details","resources-listing","resource-details","org-settings","org-settings-userrole","org-settings-invoice","org-settings-expense","org-settings-export","integration-dashboard"],
	"user":[]
};
let assignment={
	"timesheetEntry":["timesheet"],
	"projectUser":["projects-listing","project-details","task-details"],
	"expenseManager":["expenses-listing","expense-details"],
	"invoiceManager":["invoices-listing","invoice-details"]
};
exports.nocache = (req, res, next) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.header('Expires', '-1');
	res.header('Pragma', 'no-cache');
	next();
}


exports.setupPagePermissions = (userData, user) => {
	var pages = new Array();
	if (userData.user_role.includes('SUPER_ADMIN')) {
	  pages.push({ label: 'Companies', url: '/org-listing' });
	} else if (userData.user_role.includes('ADMIN')) {
	  pages.push({ label: 'Accounts', url: '/accounts-listing' });
	  pages.push({ label: 'Team', url: '/resources-listing' });


	  if(userData.permissions.includes('projectUser')){
		pages.push({ label: 'Projects', url: '/projects-listing' });
	  }
	  if(userData.permissions.includes('timesheetEntry')){
		pages.push({ label: 'Timesheets', url: '/timesheet/'+user.id });
	  }
	  if(userData.permissions.includes('expenseManager')){
		// pages.push({ label: 'Expenses', url: '/expenses-listing' });
			pages.push({ label: 'Expenses', url: '/expenses-listing/'+user.id });
	  }
	  if(userData.permissions.includes('invoiceManager')){
		pages.push({ label: 'Invoices', url: '/invoices-listing' });
	  }
	  pages.push({ label: 'Settings', url: '/org-settings'});
		pages.push({ label: 'Integrations', url:'/integration-dashboard'});
	} else {
	  if(userData.permissions.includes('projectUser')){
		  pages.push({ label: 'Projects', url: '/projects-listing' });
	  }
	  if(userData.permissions.includes('timesheetEntry')){
		  pages.push({ label: 'Timesheets', url: '/timesheet/'+user.id });
	  }
	  if(userData.permissions.includes('expenseManager')){
		  // pages.push({ label: 'Expenses', url: '/expenses-listing' });
		  pages.push({ label: 'Expenses', url: '/expenses-listing/'+user.id });
	  }
	  if(userData.permissions.includes('invoiceManager')){
		  pages.push({ label: 'Invoices', url: '/invoices-listing' });
	  }
	}
	return pages;
  }

exports.permit = (req, res,next) => {
  const isAllowed = (urole,page) => {
  	// console.log(urole in role);
	// console.log(role[urole]);
	// console.log(page);
  	return ((urole in role)&&(role[urole].includes(page)));
  };

  // console.log('Inside permit');
  	let url=req.url.split("?").shift() ;
  	let page=url.substring(url.indexOf("/")+1);
  	/*// console.log('page is '+page)*/
    if (req.user && req.user.user_role && isAllowed(req.user.user_role[0].toLowerCase(),page)){
    	// console.log('url is '+req.url);
    	// console.log('Inside user checked '+req.user.user_role[0]);
  	    return next();
     }
    else {
    	assigned(req,res,result=>{
        // console.log(result);
    		if(result==true){
          // console.log('inside true condition')
    			return next();
    		}else{
		     	res.redirect('/home');
    		}
    	})
    }

};
assigned = (req, res, done) => {
  const isAssigned = (permissions,page) => {
  	for(let i=0;i<permissions.length;i++){
  		// console.log('index is '+i)
  		// console.log('permission'+permissions[i]+' page'+page);
  		// console.log(assignment[permissions[i]]);
  		/*if(page.indexOf(timesheet)>0){
  			page='timesheet';
  		}*/
  		// console.log(permissions[i] in assignment);
  		/* // console.log(assignment[permissions[i]].includes(page)); */
  		if((permissions[i] in assignment)&&(assignment[permissions[i]].includes(page))){
  			// console.log('inside true condition');
  			return true;
  		}
  	}
  	return false;
  };

  // console.log('Inside assigned');
  	let url=req.url.split("?").shift() ;
  	let page=url.substring(url.indexOf("/")+1);
  	// console.log('Page checked for permission is'+page+' '+page.indexOf('timesheet'));
  	if(page.indexOf('timesheet')>=0){
	  	if(req.user.permissions.includes('timesheetApprover')){
  			assignment['timesheetEntry']=[page];
	  	} else {
	  		assignment['timesheetEntry']=['timesheet/'+req.user.id];
	  	}
  	}
  	if(page.indexOf('expenses-listing')>=0){
			// console.log("req.user.permissions");
			// console.log(req.user.permissions);
	  	if(req.user.permissions.includes('expenseApprover')){
  			assignment['expenseManager']=[page, 'expense-details'];
	  	} else {
	  		assignment['expenseManager']=['expenses-listing/'+req.user.id, 'expense-details'];
	  	}
  	}

  	if (req.user && req.user.permissions && isAssigned(req.user.permissions,page)){
    	  console.log('Inside user checked assignement'+req.user.permissions);
	     return done(true);
    }
    else {
		   console.log('Inside user unchecked assignement');
    	return done(false);
    }


}
