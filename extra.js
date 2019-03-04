li.nav-item(class=(title === 'Home') ? 'active' : undefined)
          a.nav-link(href='/') Home
        li.nav-item(class=(title === 'API Examples') ? 'active' : undefined)
          a.nav-link(href='/api') API Examples
        li.nav-item(class=(title === 'Contact') ? 'active' : undefined)
          a.nav-link(href='/contact') Contact
        li.nav-item(class=(title === 'Status') ? 'active' : undefined)
          a.nav-link(href='/status') Status

 .row
    .col-md-6
      a.btn.btn-raised(href='/addCompany', role='button') Add company »
    .col-md-6
      a.btn.btn-raised(href='/updateCompany', role='button') Update company »
    .col-md-6
      a.btn.btn-raised(href='/deleteCompany', role='button') Delete company »
    .col-md-6
      a.btn.btn-raised(href='/viewCompany', role='button') View company details »


       .pb-2.mt-2.mb-4.border-bottom
    h3 Add company
  form(method='POST')
    input(type='hidden', name='_csrf', value=_csrf)
    .form-group.row
      label.col-md-3.col-form-label.font-weight-bold.text-right(for='name') Name
      .col-md-7
        input.form-control(type='text', name='name', id='name', placeholder='Enter Name', autofocus, required)
    .form-group.row
      label.col-md-3.col-form-label.font-weight-bold.text-right(for='password') Password
      .col-md-7
        input.form-control(type='text', name='domain', id='domain', placeholder='Enter domain name', required)
    .form-group
      button.col-md-3.btn.btn-primary(type='submit')
          i.far.fa-user.fa-sm
          | Add Company

form(method='post' action='/deleteCompany?id=#{company.id}')
                  
                  input(type='submit' value='Delete')


deleteTenantDB = (req,res,domainWODot) =>{
  let queryToExec='DROP TABLE '+domainWODot+'_users';
      client.query(queryToExec, function(err, user) {
        if (err) { 
          req.flash('errors', { msg: 'error in deleting user table for company'+err });
            return res.redirect('/company');
        }
        queryToExec='DROP TABLE '+domainWODot+'_project'
        client.query(queryToExec,function(err, product){
          if (err) { 
            req.flash('errors', { msg: 'error in deleting product table for company '+err });
                return res.redirect('/company');
          }
          queryToExec='DROP TABLE '+domainWODot+'_timesheet'
          client.query(queryToExec,function(err, timesheet){
            if (err) {
              req.flash('errors', { msg: 'error in deleting timesheet table for company '+err });
                  return res.redirect('/company');
            }
              queryToExec='DROP TABLE '+domainWODot+'_timesheet_entry'
              client.query(queryToExec,function(err, timesheet){
                if (err) {
                  req.flash('errors', { msg: 'error in deleting timesheet entry table for company '+err });
                      return res.redirect('/company');
                }
                  
              });
              
           });
        });
       
    });
}