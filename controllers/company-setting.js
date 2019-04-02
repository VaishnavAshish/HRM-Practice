var pool = require('./../config/dbconfig');
var handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');

exports.getCompanySetting=(req,res,cb)=>{
	moment.tz.add("Asia/Calcutta|HMT BURT IST IST|-5R.k -6u -5u -6u|01232|-18LFR.k 1unn.k HB0 7zX0");
	moment.tz.link("Asia/Calcutta|Asia/Kolkata");
  /*// console.log(moment.tz.names());*/
	pool.connect((err, client, done) => {
        client.query('SELECT *, Now() as currentdate  FROM SETTING WHERE company_id=$1',[req.user.company_id], function(err, companySetting) {
          if (err) {
          	console.error('err in getting settings');
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            return cb(true,null);
            /*handleResponse.handleError(res, err, ' Error in finding company setting');*/
          } else {
          	done();
          	// console.log('------company setting----')
          	// console.log(companySetting.rows[0]);
          	return cb(false,companySetting.rows[0]);
          	/*handleResponse.sendSuccess(res,'Company settings fetched',{setting:companySetting.rows[0]});*/
          }
     })
    });
}
