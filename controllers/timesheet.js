const pg = require("pg");
var pool = require('./../config/dbconfig');
const commonController = require('./common-functions');
const handleResponse = require('./page-error-handle');
const moment = require('moment-timezone');
var setting = require('./company-setting');
let companyDefaultTimezone,companyWeekStartDay;
/*handleError=(res, reason, message, code) =>{
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
      done();
    })F
  }
  return !!err
}
*/
function dateFormat(gDate) {
  return(gDate.split(' ')[0].split('T')[0]);
}
// function dateFormat(gDate) {
  // var today = new Date(gDate);
  // var dd = today.getDate();
  // var mm = today.getMonth()+1; //January is 0!
  // var yyyy = today.getFullYear();
  // if(dd<10) {
  //     dd = '0'+dd
  // }
  // if(mm<10) {
  //     mm = '0'+mm
  // }
  // formatedDate = yyyy+'-'+mm+'-'+dd;
//   let formatedDate = moment.tz(gDate, companyDefaultTimezone).format('YYYY-MM-DD');
//   return formatedDate;
// }

function calculateWeekEndDate(start_date) {
  //console.log('calculateWeekEndDate called');
  // var dat = new Date(start_date);
  // console.log('calculateWeekEndDate start_date'+start_date);
  let dat = moment.tz(dateFormat(start_date).split('T')[0]+' 23:59:59', companyDefaultTimezone).valueOf();
  dat = moment.tz(dat, companyDefaultTimezone).add(6,'d');
  // dat = dat +  (6 * 24 * 60 * 60 * 1000);
  // dat.setTime(dat.getTime() +  (6 * 24 * 60 * 60 * 1000));
  // console.log('week end date is '+dat);
  dat = moment(dat).tz(companyDefaultTimezone).format();
  return dat;
}

function calculateWeekStartDate(current_date,TIMESHEET_WEEK_START_DAY) {
  // console.log('calculateWeekStartDate called');
  let days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  // let today = new Date().getDay();
  // console.log(current_date+' '+TIMESHEET_WEEK_START_DAY)
  // console.log('current_date'+moment.tz(current_date, companyDefaultTimezone).format());
  let today = parseInt(moment.tz(current_date, companyDefaultTimezone).format('d'));
  let weekStartDayValue=days.indexOf(TIMESHEET_WEEK_START_DAY);
  // console.log('weekStartDayValue '+weekStartDayValue)
  let diffInDays=today-weekStartDayValue;
  let weekStartDate =0;
  if(diffInDays<0){
      weekStartDate = adjustDaysForDate(current_date,'SUB',7+diffInDays);
  }else{
      weekStartDate = adjustDaysForDate(current_date,'SUB',diffInDays);
  }
  return(weekStartDate);
}

// function adjustDays (dateToAdjust,days) {
//   var dat = moment.tz(dateToAdjust, companyDefaultTimezone).valueOf();
//   // dat = dat - (days * 24 * 60 * 60 * 1000);
//   dat = moment.tz(dat, companyDefaultTimezone).subtract(days,'d');
//   // dat.setTime(dat.getTime() -  (days * 24 * 60 * 60 * 1000));
//   dat = moment(dat).tz(companyDefaultTimezone).format();
//   return dat;
// }

function adjustDaysForDate (date, type, days) {
    var dat = moment.tz(date, companyDefaultTimezone).valueOf();
    if(type == "ADD"){
        dat = moment.tz(dat, companyDefaultTimezone).add(days,'d');
    }
    else{
        dat = moment.tz(dat, companyDefaultTimezone).subtract(days,'d')
    }
    dat = moment(dat).tz(companyDefaultTimezone).format();
    return dat;
}

function createTimesheetWeekObj(timesheetObj,previousTaskId,currentTaskId,timesheetList,week_start_date){
  // console.log('inside createTimesheetWeekObj');
  // console.log(timesheetObj);
      // console.log('week_start_date ' +week_start_date);
      timesheetObj={};
      timesheetObj.totalTime=0;
      // timesheetObj.timesheetObjData=['0.00','0.00','0.00','0.00','0.00','0.00','0.00'];
      timesheetObj.timesheetObjData=[];
      for(let i=0;i<7;i++){
        timesheetObj.timesheetObjData.push({'date':dateFormat(moment.tz(week_start_date, companyDefaultTimezone).add(i,'d').format()),'day':moment.tz(week_start_date, companyDefaultTimezone).add(i,'d').format('d'),'twh':'0:00'})
      }
      timesheetObj.task_id=currentTaskId;
      timesheetObj.project_id=timesheetList.project_id;
      timesheetObj.week_start_date = week_start_date;
      // timesheetObj.created_date = adjustDaysForDate(week_start_date,'ADD',timesheetList.week_day);
      // timesheetObj.created_date=timesheetList.created_date;
      timesheetObj.task_name=timesheetList.task_name;
      timesheetObj.user_role=timesheetList.user_role;
      timesheetObj.project_name=timesheetList.project_name;
      timesheetObj.submitted=timesheetList.submitted;
      timesheetObj.totalTime+=parseInt(timesheetList.twh);
      timesheetList.twh=minuteToHours(timesheetList.twh);
      // timesheetObj.timesheetObjData[timesheetList.week_day]=timesheetList.twh;
      // console.log('date of timesheet line item'+dateFormat(moment.tz(timesheetList.created_date, companyDefaultTimezone).format()));
      // console.log(timesheetObj.timesheetObjData.filter(timeArr => timeArr.date == dateFormat(moment.tz(timesheetList.created_date, companyDefaultTimezone).format())));
      timesheetObj.timesheetObjData.filter(timeArr => timeArr.date == dateFormat(moment.tz(timesheetList.created_date, companyDefaultTimezone).format()))
      .map(resultedData => {
          // console.log(JSON.stringify(resultedData));
          resultedData.twh = timesheetList.twh;
          // console.log(JSON.stringify(resultedData));
          return resultedData;
        });
      // console.log(timesheetObj.timesheetObjData);
      previousTaskId=currentTaskId;
      return({
        timesheetObj:timesheetObj,
        previousTaskId:previousTaskId
      })
}

function getTimesheetForWeek(timesheetListArray, week_start_date) {
  let taskListsWeekArr=[];
  let currentTaskId,previousTaskId=-1;
  let timesheetObj={};
  timesheetObj.timesheetObjData=[];
  for(let i=0;i<7;i++){
    timesheetObj.timesheetObjData.push({'date':dateFormat(moment.tz(week_start_date, companyDefaultTimezone).add(i,'d').format()),'day':moment.tz(week_start_date, companyDefaultTimezone).add(i,'d').format('d'),'twh':'0:00'})
  }
  timesheetObj.totalTime=0;
  // timesheetObj.timesheetObjData=['0.00','0.00','0.00','0.00','0.00','0.00','0.00'];
  console.log('timesheetListArray');
  console.log(timesheetListArray);
  timesheetListArray.forEach(function(timesheetList,index){
    currentTaskId=timesheetList.task_id;

    if(currentTaskId==previousTaskId){
        // console.log('matching task id '+currentTaskId+' '+previousTaskId);
        if(timesheetList.user_role.trim()==timesheetObj.user_role.trim()){

                // console.log('matching user_role '+timesheetList.user_role+' '+timesheetObj.user_role);
                timesheetObj.totalTime+=parseInt(timesheetList.twh);
                // console.log(timesheetObj.timesheetObjData[timesheetList.week_day]!='0.00');
                // console.log(timesheetObj);
                let filteredData = timesheetObj.timesheetObjData.filter(timeArr => timeArr.date == dateFormat(moment.tz(timesheetList.created_date, companyDefaultTimezone).format()))
                // console.log('filteredData '+JSON.stringify(filteredData));
                // console.log(filteredData[0].twh)
                if(filteredData[0].twh !='0:00'){
                  let timesheetObjHours = hoursToMinutes(filteredData[0].twh);
                  // console.log('timesheetObjHours');
                  // console.log(timesheetObjHours);
                  // console.log(timesheetList.twh+timesheetObjHours);
                  timesheetList.twh=minuteToHours(parseInt(timesheetList.twh)+parseInt(timesheetObjHours));
                }else{
                  timesheetList.twh=minuteToHours(timesheetList.twh);
                }
                // console.log(timesheetList.twh);
                timesheetObj.timesheetObjData.filter(timeArr => timeArr.date == dateFormat(moment.tz(timesheetList.created_date, companyDefaultTimezone).format()))
                .map(resultedData => {
                    // console.log(JSON.stringify(resultedData));
                    resultedData.twh = timesheetList.twh;
                    return resultedData;
                  });
                // timesheetObj.timesheetObjData[timesheetList.week_day]=timesheetList.twh;

        }else{
          // console.log('Inside not matching user role '+timesheetList.user_role+' '+timesheetObj.user_role);
          timesheetObj.totalTime=minuteToHours(timesheetObj.totalTime);
          taskListsWeekArr.push(timesheetObj);
          var result=createTimesheetWeekObj(timesheetObj,previousTaskId,currentTaskId,timesheetList,week_start_date);

          timesheetObj=result.timesheetObj;
          previousTaskId=result.previousTaskId;

        }
    }else{
        // console.log('Inside not matching task id '+currentTaskId+' '+previousTaskId);
        if(index!=0){
          timesheetObj.totalTime=minuteToHours(timesheetObj.totalTime);
          taskListsWeekArr.push(timesheetObj);
        }
        var result=createTimesheetWeekObj(timesheetObj,previousTaskId,currentTaskId,timesheetList,week_start_date);

        timesheetObj=result.timesheetObj;
        previousTaskId=result.previousTaskId;

        // console.log(timesheetListArray.length+" "+index);
    }


  });
  if(timesheetListArray.length > 0) {
    timesheetObj.totalTime=minuteToHours(timesheetObj.totalTime);
    taskListsWeekArr.push(timesheetObj);
    // console.log(taskListsWeekArr);
  }
  return taskListsWeekArr;
}

function getTimesheetForDay(timesheetList,currentDateTime) {
  console.log('inside get timesheet for day');
  var taskListsDayArr = [];
  var tsData = timesheetList.rows;
  for(var i=0; i<tsData.length; i++) {
    var currentDate, previousDate;
    if(i==0) {
      currentDate = dateFormat(tsData[i].created_date);
      previousDate = null;
    } else {
      currentDate = dateFormat(tsData[i].created_date);
      previousDate = dateFormat(tsData[i-1].created_date);
    }

    subObjDay = {};

    if(currentDate == previousDate) {

      objDay.total_hours += parseFloat(tsData[i].total_work_hours);
      subObjDay.id = tsData[i].id;
      // console.log('isrunning');
      // console.log(tsData[i].isrunning);
      if(tsData[i].isrunning){
          // console.log('timesheet time for row having same date');
          // console.log(moment.tz(currentDateTime, companyDefaultTimezone).format());
          // console.log(moment.tz(tsData[i].lastruntime, companyDefaultTimezone).format());
          let currentTime = moment.tz(currentDateTime, companyDefaultTimezone).format('hh:mm');
          let lastruntime = moment.tz(tsData[i].lastruntime, companyDefaultTimezone).format('hh:mm')
          let differenceOfTime = hoursToMinutes(currentTime) - hoursToMinutes(lastruntime);
          // console.log('differenceOfTime before update');
          // console.log(tsData[i].total_work_hours+' '+differenceOfTime);
          tsData[i].total_work_hours += differenceOfTime;
          // console.log(tsData[i].total_work_hours+' '+differenceOfTime);
      }
      subObjDay.total_work_hours = minuteToHours(tsData[i].total_work_hours);
      subObjDay.project_id = tsData[i].project_id;
      subObjDay.project_name = tsData[i].project_name;
      subObjDay.description = tsData[i].description;
      subObjDay.invoiced = tsData[i].invoiced;
      subObjDay.user_role = tsData[i].user_role;
      subObjDay.category = tsData[i].category;
      subObjDay.billable = tsData[i].billable;
      subObjDay.task_id = tsData[i].task_id;
      subObjDay.task_name = tsData[i].task_name;
      subObjDay.submitted = tsData[i].submitted;
      subObjDay.created_date = dateFormat(tsData[i].created_date);
      subObjDay.timesheet_id = tsData[i].timesheet_id;
      taskListsDayArr[(taskListsDayArr.length)-1].data.push(subObjDay);
    } else {
      objDay = {};
      dataDay = [];
      objDay.date = dateFormat(tsData[i].created_date);
      objDay.day = tsData[i].week_day;
      objDay.total_hours = 0.0;
      objDay.submitted = tsData[i].submitted;
      objDay.total_hours += parseFloat(tsData[i].total_work_hours);
      subObjDay.id = tsData[i].id;
      // console.log('isrunning');
      // console.log(subObjDay.isrunning);
      if(tsData[i].isrunning){
          // console.log('timesheet time for row having different and new date');
          // console.log(moment.tz(currentDateTime, companyDefaultTimezone).format());
          // console.log(moment.tz(tsData[i].lastruntime, companyDefaultTimezone).format());
          let currentTime = moment.tz(currentDateTime, companyDefaultTimezone).format('hh:mm');
          let lastruntime = moment.tz(tsData[i].lastruntime, companyDefaultTimezone).format('hh:mm')
          let differenceOfTime = hoursToMinutes(currentTime) - hoursToMinutes(lastruntime);
          // console.log('differenceOfTime before update');
          // console.log(tsData[i].total_work_hours+' '+differenceOfTime);
          tsData[i].total_work_hours += differenceOfTime;
          //console.log(tsData[i].total_work_hours+' '+differenceOfTime);
      }
      subObjDay.total_work_hours = minuteToHours(tsData[i].total_work_hours);
      subObjDay.project_id = tsData[i].project_id;
      subObjDay.project_name = tsData[i].project_name;
      subObjDay.description = tsData[i].description;
      subObjDay.invoiced = tsData[i].invoiced;
      subObjDay.user_role = tsData[i].user_role;
      subObjDay.category = tsData[i].category;
      subObjDay.billable = tsData[i].billable;
      subObjDay.task_id = tsData[i].task_id;
      subObjDay.task_name = tsData[i].task_name;
      subObjDay.submitted = tsData[i].submitted;
      subObjDay.created_date = dateFormat(tsData[i].created_date);
      subObjDay.timesheet_id = tsData[i].timesheet_id;
      dataDay.push(subObjDay);
      objDay.data = dataDay;
      taskListsDayArr.push(objDay);
    }
  }

  return taskListsDayArr;
}
exports.getTimesheetWithPlay = (req,res) =>{
  setting.getCompanySetting(req, res ,(err,result)=>{
    if(err==true){
      // console.log('error in setting');
      // console.log(err);
      handleResponse.handleError(res, err, "Error in finding company setting.Please Restart.");

    }else{
          let userId = req.params.userId;
          companyDefaultTimezone=result.timezone;
          // console.log('companyDefaultTimezone');
          // console.log(companyDefaultTimezone);
          pool.connect((err, client, done) => {
            client.query('SELECT NOW() at time zone \''+companyDefaultTimezone+'\' as currentdate', function(err, currentTimestamp) {
              if(err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding current date and time');
              } else {
                  // currentTimestamp.rows[0].currentdate = JSON.stringify(currentTimestamp.rows[0].currentdate);
                  // let currentTime=moment.tz(new Date(), companyDefaultTimezone).format('hh:mm:ss');
                  // let currentDate=dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
                  let currentDate=moment.tz(currentTimestamp.rows[0].currentdate, companyDefaultTimezone).format('YYYY-MM-DD');
                  let currentTime=moment.tz(currentTimestamp.rows[0].currentdate, companyDefaultTimezone).format('hh:mm:ss');


                  client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\'  as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\'  as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND isRunning=$2 AND resource_id=$3',[req.user.company_id, true,req.user.id], function(err, timesheetData) {
                    if(err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
                    } else {
                      // console.log("selected Timesheet Data which is playing ");
                      // console.log('timesheetData  '+JSON.stringify(timesheetData.rows));
                      done();
                      if(timesheetData.rows.length>0){
                        timesheetData.rows.forEach(function(timesheet,index){
                            console.log('Timesheet with play is');
                            console.log(timesheet.created_date+' '+timesheetData.rows[0].currentdate);
                            // console.log('typeof created_date '+timesheet.created_date+' '+timesheet.created_date.toString());
                            // timesheet.created_date=timesheet.created_date.toString().split('T')[0];
                            // timesheet.created_date=moment.tz(timesheet.created_date, companyDefaultTimezone).format('YYYY-MM-DD');
                            console.log('Timesheet afer conversion is '+timesheet.created_date);
                            if(timesheetData.rows.length==(index+1)){
                              console.log('--------currentTime------');
                              console.log(currentTime+' '+currentDate);
                              handleResponse.sendSuccess(res,'fetched timesheet data which is currently playing successfully',{"timesheetData" : timesheetData.rows,"currentTime":currentTime,"currentDate":currentDate});
                            }
                          })
                      }else{
                        console.log('--------currentTime------');
                        console.log(currentTime+' '+currentDate);
                          handleResponse.sendSuccess(res,'fetched timesheet data which is currently playing successfully',{"timesheetData" : timesheetData.rows,"currentTime":currentTime,"currentDate":currentDate});
                      }
                    }
                  });
                }
              });

            });
          }
        });
}
exports.getTimesheet = (req, res) => {
  if(req.user){
    setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.responseToPage(res,'pages/timesheet',{daysEnum : [], timesheetList : [],timesheetWeekData : [] , projectList:[], userRoles : [], timeheet_users : [],companyDefaultTimezone:'',user:req.session.passport.user,error:err},"error","Error in finding company setting.Please Restart.");

      }else{
            let userId = req.params.userId;
            companyDefaultTimezone=result.timezone;
            companyWeekStartDay = result.weekstartday;
            // console.log('companyDefaultTimezone');
            // console.log(companyDefaultTimezone);
            // console.log(req.params.userId);
            pool.connect((err, client, done) => {
              client.query('SELECT NOW() at time zone \''+companyDefaultTimezone+'\' as currentdate', function(err, currentTimestamp) {
                if(err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding current date and time');
                } else {
                  client.query('SELECT * FROM PROJECT WHERE  company_id=$1 AND account_id IN (SELECT id FROM ACCOUNT WHERE company_id=$1 AND archived=$2) AND archived=$2 AND isGlobal=$3 AND id in (SELECT project_id FROM PROJECT_ASSIGNMENT WHERE company_id=$1 AND user_id=$4)',[req.user.company_id, false, false, userId], function(err, projectList) {
                    if(err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.responseToPage(res,'pages/timesheet',{daysEnum : [], timesheetList : [],timesheetWeekData : [] , projectList:[], userRoles : [], timeheet_users : [],companyDefaultTimezone:'',user:req.session.passport.user,error:err},"error","Error in finding project data.Please Restart.");
                      /*handleResponse.handleError(res, err, ' Error in finding project data');*/
                    } else {
                      // console.log("week_start_date");
                      // console.log(parseInt(req.query.new_date));
                      // console.log( calculateWeekStartDate(dateFormat(currentTimestamp.rows[0].currentdate),companyWeekStartDay));
                      let week_start_date = req.query.new_date != undefined ? moment.tz(moment.tz(parseInt(req.query.new_date),companyDefaultTimezone).format().split('T')[0],companyDefaultTimezone).format() : calculateWeekStartDate(dateFormat(currentTimestamp.rows[0].currentdate),companyWeekStartDay);
                      let week_end_date = calculateWeekEndDate(week_start_date);
                      console.log('week_start_date '+week_start_date);
                      console.log('week_end_date '+week_end_date);

                      // week_start_date=dateFormat(week_start_date);
                      // week_end_date=dateFormat(week_end_date);

                      // console.log('SELECT * FROM TIMESHEET_LINE_ITEM WHERE company_id=$1 AND resource_id=$2 AND created_date BETWEEN $3 AND $4 AND project_id is not null ORDER BY created_date, task_id, user_role');
                      // console.log(req.user.company_id, userId, week_start_date, week_end_date);
                      client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\'  as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category , EXTRACT(DOW FROM created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\'  as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND resource_id=$2 AND created_date at time zone \''+companyDefaultTimezone+'\'  BETWEEN $3 AND $4 AND project_id is not null ORDER BY created_date, task_id, user_role',[req.user.company_id, userId, week_start_date, week_end_date], function(err, timesheetListByDate) {
                        if(err) {
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.responseToPage(res,'pages/timesheet',{daysEnum : [], timesheetList : [],timesheetWeekData : [] , projectList:[], userRoles : [], timeheet_users : [],companyDefaultTimezone:'',user:req.session.passport.user,error:err},"error","Error in finding timesheet detail data.Please Restart.");
                          /*handleResponse.handleError(res, err, ' Error in finding timesheet detail data');*/
                        } else {
                          let taskListsDayArr = getTimesheetForDay(timesheetListByDate,currentTimestamp.rows[0].currentdate);
                          console.log("timesheetListByDate");
                          console.log(JSON.stringify(taskListsDayArr));
                          // console.log(week_start_date +" *************** "+ week_end_date);

                            // let queryToExec= `SELECT DISTINCT T1.task_id, T1.resource_id, T1.project_id, T1.company_id, T1.project_name, T1.task_name, T2.twh, T2.week_day, T2.user_role
                            //                   FROM timesheet_line_item T1
                            //                   JOIN
                            //                   (SELECT task_id, SUM(total_work_hours) as twh, week_day, user_role,resource_id
                            //                   FROM timesheet_line_item
                            //                   WHERE company_id=$1 AND resource_id=$2 AND created_date at time zone '${companyDefaultTimezone}' BETWEEN $3 AND $4 AND project_id is not null AND project_name is not null
                            //                   GROUP BY task_id,resource_id, user_role,week_day) T2
                            //                   ON T1.task_id = T2.task_id AND T1.resource_id = T2.resource_id  AND T1.project_name is not null
                            //                   ORDER BY T1.task_id, T2.user_role`;
                            let queryToExec = `SELECT DISTINCT T1.task_id, T1.resource_id, T1.project_id, T1.company_id, T1.project_name, T1.task_name, T2.twh ,T2.created_date at time zone '${companyDefaultTimezone}' as created_date,T2.user_role , T2.week_day
                                                FROM timesheet_line_item T1
                                                JOIN
                                                (SELECT created_date at time zone '${companyDefaultTimezone}' as created_date,task_id, EXTRACT(DOW FROM created_date at time zone '${companyDefaultTimezone}') as week_day,SUM(total_work_hours) as twh, user_role,resource_id
                                                FROM timesheet_line_item
                                                WHERE company_id=$1 AND resource_id=$2 AND created_date at time zone '${companyDefaultTimezone}' BETWEEN $3 AND $4 AND project_id is not null AND project_name is not null
                                                GROUP BY task_id,resource_id, user_role,created_date,week_day) T2
                                                ON T1.task_id = T2.task_id AND T1.resource_id = T2.resource_id AND T1.project_name is not null
                                                ORDER BY T1.task_id, T2.user_role,created_date`;
                            console.log(req.user.company_id, userId, week_start_date, week_end_date);
                             client.query(queryToExec,[req.user.company_id, userId, week_start_date, week_end_date], function(err, timesheetListByProject) {
                              if (err) {
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.responseToPage(res,'pages/timesheet',{daysEnum : [], timesheetList : [],timesheetWeekData : [] , projectList:[], userRoles : [], timeheet_users : [],companyDefaultTimezone:'',user:req.session.passport.user,error:err},"error","Error in finding timesheet detail data for week.Please Restart.");
                              } else {

                                getCompanyAllRoles(req, client, err, done, res, function(userRoles) {
                                  var timeheet_users = [];
                                  // console.log("*************************** user role ********************** ");
                                  // console.log(req.user.role);
                                  console.log('--------week_start_date------');
                                  console.log(week_start_date+' '+week_end_date);
                                  if(req.user.permissions.includes('timesheetApprover')) {
                                      getAllCompanyUsers(req, client, err, done, res, function (users) {
                                      timeheet_users = users;
                                      let taskListsWeekArr = getTimesheetForWeek(timesheetListByProject.rows, dateFormat(week_start_date));
                                      console.log("Weekly timesheet rows")
                                      console.log(JSON.stringify(taskListsWeekArr));
                                      var daysEnum = {"0":"Sunday","1":"Monday", "2":"Tuesday", "3":"Wednesday","4":"Thursday","5":"Friday","6":"Saturday"};
                                      done();
                                      handleResponse.responseToPage(res,'pages/timesheet',{daysEnum : daysEnum, timesheetList : taskListsDayArr,timesheetWeekData : taskListsWeekArr , user:req.session.passport.user, projectList:projectList.rows, userRoles : userRoles, timeheet_users : timeheet_users, companyDefaultTimezone:companyDefaultTimezone,companyWeekStartDay:companyWeekStartDay , currentTimestamp:currentTimestamp.rows[0].currentdate },"success","Successfully rendered");
                                      });
                                  } else {
                                    done()
                                      let taskListsWeekArr = getTimesheetForWeek(timesheetListByProject.rows, dateFormat(week_start_date));
                                      // console.log("Weekly timesheet rows")
                                      // console.log(JSON.stringify(taskListsWeekArr));
                                      var daysEnum = {"0":"Sunday","1":"Monday", "2":"Tuesday", "3":"Wednesday","4":"Thursday","5":"Friday","6":"Saturday"};
                                      handleResponse.responseToPage(res,'pages/timesheet',{daysEnum : daysEnum, timesheetList : taskListsDayArr,timesheetWeekData : taskListsWeekArr , user:req.session.passport.user, projectList:projectList.rows, userRoles : userRoles, timeheet_users : [],companyDefaultTimezone:companyDefaultTimezone, companyWeekStartDay:companyWeekStartDay, currentTimestamp:currentTimestamp.rows[0].currentdate },"success","Successfully rendered");
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
              });
            }
          });
        } else{
          res.redirect('/domain');
        }
      };

// taskController.checkProjectAssignment(req, client, err, done, taskData, res, function (result) {

// });

function getUserTaksAssignmentRoles(req, client, err, done, res, result) {
  client.query('SELECT DISTINCT user_role, project_id, task_id FROM TASK_ASSIGNMENT WHERE user_id=$1 AND company_id=$2',[req.params.userId, req.user.company_id], function(err, userRoles) {
    if (err) {
      handleResponse.shouldAbort(err, client, done);
      handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
    } else {
      done();
      // console.log("user.rows");
      // console.log(req.user.role);
      if(userRoles.rowCount > 0) {
        return result(userRoles.rows);
      } else {
        return result([]);
      }
    }
  });
}

function getCompanyAllRoles(req, client, err, done, res, callback) {
  client.query('SELECT user_role FROM SETTING WHERE company_id=$1', [req.user.company_id], function (err, userRoleList) {
    if (err) {
      console.error(err);
      handleResponse.shouldAbort(err, client, done);
      return callback(null);
      // handleResponse.responseToPage(res,'pages/resources-listing',{resources: [], userRoleList:[] , totalCount:0,activeCount:0, archivedCount:0,user:req.session.passport.user, error:err},"error"," Error in finding user role for the company");

    } else {
      // console.log("userRoles");
      // console.log(userRoleList.rows[0].user_role);
      return callback(userRoleList.rows[0].user_role);
    }
  });
}

function getUserProjectAssignmentRoles(req, client, err, done, res, result) {
  client.query('SELECT DISTINCT user_role FROM PROJECT_ASSIGNMENT WHERE user_id=$1 AND company_id=$2',[req.user.id, req.user.company_id], function(err, userRoles) {
    if (err) {
      handleResponse.shouldAbort(err, client, done);
      handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
    } else {
      done();
      // console.log("user.rows");
      // console.log(req.user.role);
      if(userRoles.rowCount > 0) {
        return result(userRoles.rows);
      } else {
        return result([{user_role: req.user.role}]);
      }
    }
  });
}

function getAllCompanyUsers(req, client, err, done, res, result) {
  client.query('SELECT id, role, email FROM users WHERE company_id=$1 AND archived=$2',[req.user.company_id, false], function(err, userRoles) {
    if (err) {
      handleResponse.shouldAbort(err, client, done);
      handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
    } else {
      return result(userRoles.rows);
    }
  });
}

module.exports.getAllCompanyUsers = getAllCompanyUsers;

// getDayTimesheetData
exports.getDayTimesheetData = (req, res) => {
  if(req.user){
      console.log('req.body.date '+req.body.date);
      console.log( moment.tz(req.body.date.split('T')[0].split(' ')[0], companyDefaultTimezone).format());
      console.log(moment.tz(req.body.date.split('T')[0].split(' ')[0]+' 23:59:59', companyDefaultTimezone).format())
      pool.connect((err, client, done) => {
        client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND id=$2 AND created_date BETWEEN $3 AND $4',[req.user.company_id, req.body.id, moment.tz(req.body.date.split('T')[0].split(' ')[0], companyDefaultTimezone).format(), moment.tz(req.body.date.split('T')[0].split(' ')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, timesheetData) {
          if(err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
          } else {
            // console.log("Update Timesheet Data");
            // console.log(timesheetData);
            req.body.getTaskList = true;
            req.body.projectId = timesheetData.rows[0].project_id;
            // taskController.getTaskList(req, res);
            // console.log("taksList");
            // taskController.getTaskList(req, res, function (response) {
              done();
              timesheetData.rows[0].total_work_hours_formatted = minuteToHours(timesheetData.rows[0].total_work_hours);
              handleResponse.sendSuccess(res,'fetched timesheet data successfully',{data:{"timesheetData" : timesheetData.rows[0]}});
              /*res.status(200).json({"success": true,"message":"success", data:{"timesheetData" : timesheetData.rows[0], "taskList":response}});*/
            // });
          }
        });
      });
   } else{
    res.redirect('/domain');
  }
};

exports.updateDayTimesheetHours = (req, res) => {
  // console.log(JSON.stringify(req.body));

  if(req.user){
      pool.connect((err, client, done) => {
        client.query('SELECT NOW() at time zone \''+companyDefaultTimezone+'\' as currentTimestamp, tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE id=$1',[req.body.line_item_id], function(err, timesheetData) {
          if(err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
          } else {
            if(timesheetData.rowCount > 0) {
              console.log('req.body.isRunning '+req.body.isRunning);
              if(req.body.isRunning == false){
                if(timesheetData.rows[0].isrunning == false){
                  done();
                  handleResponse.sendSuccess(res,'update timesheet data successfully',{updatedHours:minuteToHours(timesheetData.rows[0].total_work_hours)});
                }else{
                  console.log('inside if')
                  let differenceOfTime ;
                  if(moment.tz(timesheetData.rows[0].currentTimestamp,companyDefaultTimezone).format('YYYY-MM-DD') == moment.tz(timesheetData.rows[0].lastruntime,companyDefaultTimezone).format('YYYY-MM-DD')){
                    differenceOfTime = hoursToMinutes(moment.tz(timesheetData.rows[0].currentTimestamp,companyDefaultTimezone).format('hh:mm')) - hoursToMinutes(moment.tz(timesheetData.rows[0].lastruntime,companyDefaultTimezone).format('hh:mm'))
                  }else{
                    console.log('inside different dates diffrence');
                    differenceOfTime = hoursToMinutes('19:00') - hoursToMinutes(moment.tz(timesheetData.rows[0].lastruntime,companyDefaultTimezone).format('hh:mm'))
                  }
                  // let differenceOfTime = hoursToMinutes(moment.tz(timesheetData.rows[0].currentTimestamp,companyDefaultTimezone).format('hh:mm')) - hoursToMinutes(moment.tz(timesheetData.rows[0].lastruntime,companyDefaultTimezone).format('hh:mm'))
                  console.log('differenceOfTime after element stopped '+minuteToHours(differenceOfTime));
                  console.log(moment.tz(timesheetData.rows[0].currentTimestamp,companyDefaultTimezone).format('hh:mm'));
                  console.log(moment.tz(timesheetData.rows[0].lastruntime,companyDefaultTimezone).format('hh:mm'));
                  differenceOfTime += timesheetData.rows[0].total_work_hours;
                  client.query('UPDATE timesheet_line_item SET total_work_hours=$1,isRunning=$2 WHERE id=$3',[differenceOfTime, req.body.isRunning ,req.body.line_item_id], function(err, updatedTimesheetLiRec) {
                    if (err) {
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
                    } else {
                      done();
                      handleResponse.sendSuccess(res,'update timesheet data successfully',{updatedHours:minuteToHours(differenceOfTime)});
                      /*res.status(200).json({"success": true,"message":"success"});*/
                    }
                  });
                }
              }else{
                client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\'  as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\'  as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND isRunning=$2 AND resource_id=$3',[req.user.company_id, true,req.user.id], function(err, timesheetDataRunning) {
                  if(err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding timesheet which is running');
                  } else {
                    if(timesheetDataRunning.rowCount>0){
                      done();
                      handleResponse.handleError(res, 'Timer for some timesheet is already running .Please reload it. ', 'Timer for some timesheet is already running .Please reload it.');
                    }else{

                        let lastruntime = 'now()';
                        if(timesheetData.rows[0].isrunning ==true){
                          lastruntime = timesheetData.rows[0].lastRunTime;
                        }
                        client.query('UPDATE timesheet_line_item SET lastRunTime=$1,isRunning=$2 WHERE id=$3',[lastruntime, req.body.isRunning ,req.body.line_item_id], function(err, updatedTimesheetLiRec) {
                          if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
                          } else {
                            done();
                            handleResponse.sendSuccess(res,'update timesheet data successfully',{});
                            /*res.status(200).json({"success": true,"message":"success"});*/
                          }
                        });
                      }

                    }
                  });

              }
            } else {
              done();
              handleResponse.handleError(res, 'No record found', 'No record found.');
              /*handleResponse.sendSuccess(res,'No timesheet data found',{});*/
              /*res.status(200).json({"success": false,"message":"No record found."});*/
            }
          }
        });
      });
   } else{
    res.redirect('/domain');
  }
};

exports.updateDayTimesheetData = (req, res) => {
  // console.log("updateDayTimesheetData");
  // console.log('original'+req.body.total_work_hours_formatted);
  // console.log('hoursToMinutes'+hoursToMinutes(req.body.total_work_hours_formatted));
  if(req.user){
      pool.connect((err, client, done) => {
        client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE id=$1',[req.body.timesheet_lineitem_id], function(err, timesheetData) {
          if(err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
          } else {
            if(timesheetData.rowCount > 0) {
              client.query('UPDATE timesheet_line_item SET project_id=$1, task_id=$2, total_work_hours=$3, project_name=$4, task_name=$5, description=$6 WHERE id=$7',[req.body.project_id, req.body.task_id, hoursToMinutes(req.body.total_work_hours_formatted), req.body.project_name, req.body.task_name, req.body.description, req.body.timesheet_lineitem_id], function(err, updatedTimesheetLiRec) {
                if (err) {
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
                } else {
                  done();
                  handleResponse.sendSuccess(res,'update timesheet data successfully',{});
                  /*res.status(200).json({"success": true,"message":"success"});*/
                }
              });
            } else {
              done();
              handleResponse.handleError(res, 'No record found', 'No record found.');
              /*handleResponse.sendSuccess(res,'No timesheet data found',{});*/
              /*res.status(200).json({"success": false,"message":"No record found."});*/
            }
          }
        });
      });
   } else{
    res.redirect('/domain');
  }
};

exports.updateWeeklyTimesheetData = (req, res) => {
  let reqArr = req.body.data;
  console.log("updateWeeklyTimesheetData data");
  console.log(reqArr);
  if(req.user){
    pool.connect((err, client, done) => {
      if(reqArr.length > 0) {
        reqArr.forEach(function (line_item_data, index) {
          client.query('UPDATE timesheet_line_item SET total_work_hours=$1, description=$2, billable=$3 WHERE id=$4',[hoursToMinutes(line_item_data.time), line_item_data.notes, line_item_data.billable, line_item_data.id], function(err, updatedTimesheetLiRec) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
            } else {
              if((index+1) == reqArr.length) {
                done();
                handleResponse.sendSuccess(res,'update timesheet data successfully',{});
              }
              /*res.status(200).json({"success": true,"message":"success"});*/
            }
          });
        })
      }
    });
  } else {
    res.redirect('/domain');
  }
};

  // function timesheetUpdatedArr(req, records) {
  //   let currentId = 0;
  //   let prevId = 0;
  //   let i;
  //   let mainArr = [];
  //   let recArr = [];
  //   let index=0;
  //   for(i=0; i< records.length; i++) {
  //
  //     if(i == 0) {
  //       currentId = records[i].project_id;
  //     } else {
  //       currentId = records[i].project_id;
  //       prevId = records[i-1].project_id;
  //     }
  //
  //     if(currentId == prevId) {
  //       if(records[i].user_role == mainArr[index-1][9]) {
  //         if(records[i].billable) {
  //           bill_hours = parseInt(records[i].hours);
  //           mainArr[index-1][5] = bill_hours;
  //         } else {
  //           nonbill_hours = parseInt(records[i].hours);
  //           mainArr[index-1][6] = nonbill_hours;
  //         }
  //         total_hours = mainArr[index-1][5] + mainArr[index-1][6];
  //         mainArr[index-1][7] = total_hours;
  //       } else {
  //         recArr = [];
  //         index++;
  //
  //         recArr.push(parseInt(req.user.id));
  //         recArr.push(parseInt(req.user.company_id));
  //         recArr.push(parseInt(records[i].project_id));
  //         recArr.push(records[i].project_name);
  //         let recCreatedDate=moment.tz(records[i].created_date.split('T')[0], companyDefaultTimezone).format();
  //         recArr.push(dateFormat(recCreatedDate));
  //
  //         if(records[i].billable) {
  //           bill_hours = parseInt(records[i].hours);
  //           recArr.push(bill_hours);
  //           recArr.push(0);
  //         } else {
  //           nonbill_hours = parseInt(records[i].hours);
  //           recArr.push(0);
  //           recArr.push(nonbill_hours);
  //         }
  //         total_hours = recArr[5] + recArr[6];
  //         recArr.push(total_hours);
  //         recArr.push(dateFormat(moment.tz(new Date(), companyDefaultTimezone).format()));
  //         recArr.push(records[i].user_role);
  //         mainArr.push(recArr);
  //       }
  //     } else {
  //       recArr = [];
  //       index++;
  //
  //       recArr.push(parseInt(req.user.id));
  //       recArr.push(parseInt(req.user.company_id));
  //       recArr.push(parseInt(records[i].project_id));
  //       recArr.push(records[i].project_name);
  //       let recCreatedDate=moment.tz(records[i].created_date.split('T')[0], companyDefaultTimezone).format();
  //       recArr.push(dateFormat(recCreatedDate));
  //
  //       if(records[i].billable) {
  //         bill_hours = parseInt(records[i].hours);
  //         recArr.push(bill_hours);
  //         recArr.push(0);
  //       } else {
  //         nonbill_hours = parseInt(records[i].hours);
  //         recArr.push(0);
  //         recArr.push(nonbill_hours);
  //       }
  //       total_hours = recArr[5] + recArr[6];
  //       recArr.push(total_hours);
  //       recArr.push(dateFormat(moment.tz(new Date(), companyDefaultTimezone).format()));
  //       recArr.push(records[i].user_role);
  //       mainArr.push(recArr);
  //     }
  //   }
  //   // console.log("Final JSON");
  //   // console.log(mainArr);
  //   return mainArr;
  // }
function createTimesheetRows(lineItemRows, result) {
  var mainArr = [];
  lineItemRows.forEach(function (lineRow, index) {
    var lineItemIds = [];
    if(index == 0) {
      createNewObj(lineRow, function (result) {
        lineItemIds.push(result.id);
        result.lineItemIds = lineItemIds
        mainArr.push(result);
      });
    } else {
      if(lineRow.project_id == mainArr[(mainArr.length)-1].project_id) {
        if(lineRow.user_role != mainArr[(mainArr.length)-1].user_role) {
          createNewObj(lineRow, function (result) {
            lineItemIds.push(result.id);
            result.lineItemIds = lineItemIds
            mainArr.push(result);
          });
        } else {
          if(lineRow.billable) {
            mainArr[(mainArr.length)-1].bill_hours = parseInt(mainArr[(mainArr.length)-1].bill_hours) + parseInt(lineRow.total_work_hours);
            mainArr[(mainArr.length)-1].nonbill_hours = mainArr[(mainArr.length)-1].nonbill_hours;
            mainArr[(mainArr.length)-1].total_hours = parseInt(mainArr[(mainArr.length)-1].nonbill_hours) + parseInt(mainArr[(mainArr.length)-1].bill_hours);
          } else {
            mainArr[(mainArr.length)-1].bill_hours = mainArr[(mainArr.length)-1].bill_hours;
            mainArr[(mainArr.length)-1].nonbill_hours = parseInt(mainArr[(mainArr.length)-1].nonbill_hours) + parseInt(lineRow.total_work_hours);
            mainArr[(mainArr.length)-1].total_hours = parseInt(lineRow.bill_hours) + parseInt(lineRow.nonbill_hours);
          }
          if(mainArr[(mainArr.length)-1].timesheet_id == null) {
            mainArr[(mainArr.length)-1].timesheet_id = lineRow.timesheet_id;
          }
          mainArr[(mainArr.length)-1].lineItemIds.push(lineRow.id);
        }
      } else {
        createNewObj(lineRow, function (result) {
          lineItemIds.push(result.id);
          result.lineItemIds = lineItemIds
          mainArr.push(result);
        });
      }
    }
  });
  return result(mainArr);
}

function createNewObj(lineRow, result) {
  var bill_hours = 0;
  var nonbill_hours = 0;
  if(lineRow.billable) {
    bill_hours = lineRow.total_work_hours;
    lineRow.bill_hours =  bill_hours;
    lineRow.nonbill_hours = nonbill_hours;
    lineRow.total_hours = parseInt(lineRow.bill_hours) + parseInt(lineRow.nonbill_hours);
  } else {
    nonbill_hours = lineRow.total_work_hours;
    lineRow.bill_hours =  bill_hours;
    lineRow.nonbill_hours = nonbill_hours;
    lineRow.total_hours = parseInt(lineRow.bill_hours) + parseInt(lineRow.nonbill_hours);
  }
  return result(lineRow);
}
// submitDayTimesheet
exports.submitDayTimesheet = (req, res) => {
  if(req.user){
      pool.connect((err, client, done) => {
        client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND resource_id=$2 AND created_date  at time zone \''+companyDefaultTimezone+'\' BETWEEN $3 AND $4 ORDER BY project_id, user_role, billable',[req.user.company_id, req.user.id, moment.tz(req.body.date.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.date.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, lineItemRows) {
          if(err) {
            console.error(err);
            handleResponse.shouldAbort(err, client, done);
            handleResponse.handleError(res, err, ' Error in finding timesheet detail data 1');
          } else {
            // lineItemRows.rows
            createTimesheetRows(lineItemRows.rows, function (mainArr) {
              // console.log("mainArr");
              // console.log(mainArr);
              mainArr.forEach(function (mergedRow, ind) {
                let lineArr = '';
                mergedRow.lineItemIds.forEach(function (lineId, index) {
                  let line_item = lineId;
                  if((mergedRow.lineItemIds.length-1) == index) {
                    lineArr = lineArr + line_item;
                  } else {
                    lineArr = lineArr + line_item + ', ';
                  }
                });
                lineArr = '(' + lineArr + ')';
                // console.log("lineArr");
                // console.log(lineArr);

                if(mergedRow.timesheet_id != null) {
                  client.query('UPDATE TIMESHEET SET total_billable_hours=$1, total_nonbill_hours=$2, total_hours=$3, last_updated_date=$4  WHERE id=$5',[mergedRow.bill_hours, mergedRow.nonbill_hours, mergedRow.total_hours, 'now()', mergedRow.timesheet_id], function(err, timesheetUpdatedData) {
                    if(err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding timesheet detail data 2');
                    } else {
                      var query = client.query('UPDATE TIMESHEET_LINE_ITEM SET submitted=$1, timesheet_id=$2 WHERE id IN '+lineArr,[true, mergedRow.timesheet_id], function(err, data) {
                        if(err) {
                          // console.log('this.sql');
                          console.error(err.stack);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
                        } else {
                          if(mainArr.length === (ind+1)) {
                            // console.log("Data inserted");
                            done();
                            handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                            /*res.status(200).json({"success": true,"message":"Successfully submitted your timesheet."});*/
                          }
                        }
                      });
                    }
                  });
                } else {
                  client.query('INSERT INTO TIMESHEET (resource_id, company_id, project_id, project_name, created_date, total_billable_hours, total_nonbill_hours, total_hours, last_updated_date, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, project_id, user_role', [mergedRow.resource_id, mergedRow.company_id, mergedRow.project_id, mergedRow.project_name, moment.tz(mergedRow.created_date.split('T')[0], companyDefaultTimezone).format(), mergedRow.bill_hours, mergedRow.nonbill_hours, mergedRow.total_hours, 'now()', mergedRow.user_role], function(err, insertedRec) {
                    if(err) {
                      console.error(err);
                      handleResponse.shouldAbort(err, client, done);
                      handleResponse.handleError(res, err, ' Error in finding timesheet detail data 2');
                    } else {
                      var query = client.query('UPDATE TIMESHEET_LINE_ITEM SET submitted=$1, timesheet_id=$2 WHERE id IN '+lineArr,[true, insertedRec.rows[0].id], function(err, data) {
                        if(err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
                        } else {
                          if(mainArr.length === (ind+1)) {
                            // console.log("Data inserted");
                            done();
                            handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                            /*res.status(200).json({"success": true,"message":"Successfully submitted your timesheet."});*/
                          }
                        }
                      });
                    }
                  });
                }
              })
            });
          }
        });
      });
   } else{
    res.redirect('/domain');
  }
};

exports.submitWeeklyTimesheet = (req, res) => {

    console.log(req.user.company_id+' '+ req.user.id+' '+moment.tz(req.body.weekStartDate.split(' ')[0].split('T')[0], companyDefaultTimezone).format()+' '+moment.tz(req.body.weekEndDate.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format());
    pool.connect((err, client, done) => {
      client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND resource_id=$2 AND created_date at time zone \''+companyDefaultTimezone+'\' BETWEEN $3 AND $4',[req.user.company_id, req.user.id, moment.tz(req.body.weekStartDate.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.weekEndDate.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, timesheetLiRec) {
        if(err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding timesheet detail data for week timesheet submission');
        } else {
          console.log("Selected timesheets");
          console.log(timesheetLiRec.rows);
          if(timesheetLiRec.rowCount > 0) {
            arrangeRecords(timesheetLiRec.rows, function (response) {
              console.log("Final Obj to update");
              console.log(response);
              if(response.timesheetMasterId != null) {
                client.query('UPDATE TIMESHEET SET total_billable_hours=$1, total_nonbill_hours=$2, total_hours=$3, last_updated_date=$4  WHERE id=$5',[response.bill_hours, response.nonbill_hours, response.total_hours, 'now()', response.timesheetMasterId], function(err, timesheetUpdatedData) {
                  if(err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding timesheet detail data 2');
                  } else {
                    client.query('UPDATE TIMESHEET_LINE_ITEM SET submitted=$1, timesheet_id=$2 WHERE company_id=$3 AND resource_id=$4 AND created_date at time zone \''+companyDefaultTimezone+'\' BETWEEN $5 AND $6 RETURNING *', [true, response.timesheetMasterId, req.user.company_id, req.user.id, moment.tz(req.body.weekStartDate.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.weekEndDate.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, data) {
                      if(err) {
                        // console.log('this.sql');
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
                      } else {
                        console.log("Data updated");
                        console.log(data.rows);
                        done();
                        handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                        /*res.status(200).json({"success": true,"message":"Successfully submitted your timesheet."});*/
                      }
                    });
                  }
                });
              } else {
                client.query('INSERT INTO TIMESHEET (resource_id, company_id, project_id, project_name, created_date, total_billable_hours, total_nonbill_hours, total_hours, last_updated_date, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, project_id, user_role', [response.resource_id, response.company_id, response.project_id, response.project_name, moment.tz(response.created_date.split('T')[0], companyDefaultTimezone).format(), response.bill_hours, response.nonbill_hours, response.total_hours, 'now()', response.user_role], function(err, insertedRec) {
                  if(err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding timesheet detail data 2');
                  } else {
                    client.query('UPDATE TIMESHEET_LINE_ITEM SET submitted=$1, timesheet_id=$2 WHERE company_id=$3 AND resource_id=$4 AND created_date at time zone \''+companyDefaultTimezone+'\' BETWEEN $5 AND $6 RETURNING *', [true, insertedRec.rows[0].id, req.user.company_id, req.user.id, moment.tz(req.body.weekStartDate.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.weekEndDate.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, data) {
                      if(err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
                      } else {
                        // console.log("Data inserted");
                        done();
                        handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                        /*res.status(200).json({"success": true,"message":"Successfully submitted your timesheet."});*/
                      }
                    });
                  }
                });
              }
            });

          } else {
            done();
            handleResponse.handleError(res, 'No record found', 'No record found.');
            /*res.status(200).json({"success": false,"message":"No record found."});*/
          }
        }
      });
    });

}

exports.submitWeeklyTimesheetByProjectTaskId = (req, res) => {
  if(req.user) {
    console.log(req.user.company_id+' '+ req.user.id+' '+ req.body.project_id+' '+ req.body.task_id+' '+ req.body.user_role, moment.tz(req.body.created_date.split(' ')[0].split('T')[0], companyDefaultTimezone).format()+' '+moment.tz(req.body.created_date.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format());
    pool.connect((err, client, done) => {
      client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND resource_id=$2 AND project_id=$3 AND task_id=$4 AND user_role=$5 AND created_date at time zone \''+companyDefaultTimezone+'\' BETWEEN $6 AND $7',[req.user.company_id, req.user.id, req.body.project_id, req.body.task_id, req.body.user_role, moment.tz(req.body.created_date.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.created_date.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, timesheetLiRec) {
        if(err) {
          console.error(err);
          handleResponse.shouldAbort(err, client, done);
          handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
        } else {
          // console.log("Selected timesheets");
          // console.log(timesheetLiRec.rows);
          if(timesheetLiRec.rowCount > 0) {
            arrangeRecords(timesheetLiRec.rows, function (response) {
              // console.log("Final Obj to update");
              // console.log(response);
              if(response.timesheetMasterId != null) {
                client.query('UPDATE TIMESHEET SET total_billable_hours=$1, total_nonbill_hours=$2, total_hours=$3, last_updated_date=$4  WHERE id=$5',[response.bill_hours, response.nonbill_hours, response.total_hours, 'now()', response.timesheetMasterId], function(err, timesheetUpdatedData) {
                  if(err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding timesheet detail data 2');
                  } else {
                    client.query('UPDATE TIMESHEET_LINE_ITEM SET submitted=$1, timesheet_id=$2 WHERE company_id=$3 AND resource_id=$4 AND project_id=$5 AND task_id=$6 AND user_role=$7 AND created_date at time zone \''+companyDefaultTimezone+'\' BETWEEN $8 AND $9 RETURNING *', [true, response.timesheetMasterId, req.user.company_id, req.user.id, req.body.project_id, req.body.task_id, req.body.user_role, moment.tz(req.body.created_date.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.created_date.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, data) {
                      if(err) {
                        // console.log('this.sql');
                        console.error(err);
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
                      } else {
                        console.log("Data updated");
                        console.log(data.rows);
                        done();
                        handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                        /*res.status(200).json({"success": true,"message":"Successfully submitted your timesheet."});*/
                      }
                    });
                  }
                });
              } else {
                client.query('INSERT INTO TIMESHEET (resource_id, company_id, project_id, project_name, created_date, total_billable_hours, total_nonbill_hours, total_hours, last_updated_date, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, project_id, user_role', [response.resource_id, response.company_id, response.project_id, response.project_name, moment.tz(response.created_date.split('T')[0], companyDefaultTimezone).format(), response.bill_hours, response.nonbill_hours, response.total_hours, 'now()', response.user_role], function(err, insertedRec) {
                  if(err) {
                    console.error(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding timesheet detail data 2');
                  } else {
                    client.query('UPDATE TIMESHEET_LINE_ITEM SET submitted=$1, timesheet_id=$2 WHERE company_id=$3 AND resource_id=$4 AND project_id=$5 AND task_id=$6 AND user_role=$7 AND created_date at time zone \''+companyDefaultTimezone+'\' BETWEEN $8 AND $9 RETURNING *', [true, insertedRec.rows[0].id, req.user.company_id, req.user.id, req.body.project_id, req.body.task_id, req.body.user_role, moment.tz(req.body.created_date.split(' ')[0].split('T')[0], companyDefaultTimezone).format(),moment.tz(req.body.created_date.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format()], function(err, data) {
                      if(err) {
                        handleResponse.shouldAbort(err, client, done);
                        handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
                      } else {
                        // console.log("Data inserted");
                        done();
                        handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                        /*res.status(200).json({"success": true,"message":"Successfully submitted your timesheet."});*/
                      }
                    });
                  }
                });
              }
            });
            // client.query('UPDATE timesheet_line_item SET project_id=$1, task_id=$2, total_work_hours=$3, project_name=$4, task_name=$5, description=$6, category=$7 WHERE id=$8',[req.body.project_id, req.body.task_id, new_total_hours, req.body.project_name, req.body.task_name, req.body.description, req.body.category, req.body.timesheet_lineitem_id], function(err, updatedTimesheetLiRec) {
            // if(err) {
            //   handleResponse.shouldAbort(err, client, done);
            //   handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
            // } else {
            //     done();
            //     handleResponse.sendSuccess(res,'Timesheet updated successfully',{});
            //     /*res.status(200).json({"success": true,"message":"success"});*/
            //   }
            // });
          } else {
            done();
            handleResponse.handleError(res, 'No record found', 'No record found.');
            /*res.status(200).json({"success": false,"message":"No record found."});*/
          }
        }
      });
    });
  } else{
    res.redirect('/domain');
  }
}

function arrangeRecords(recordsList, callback) {
  var obj = {};
  recordsList.forEach(function (record, index) {
    if(index == 0) {
      obj = record;
      obj.bill_hours = 0;
      obj.nonbill_hours = 0;
      obj.timesheetMasterId = null;
    }
    if(record.billable) {
      obj.bill_hours += record.total_work_hours;
    } else {
      obj.nonbill_hours += record.total_work_hours;
    }
    if(record.timesheet_id) {
      obj.timesheetMasterId = record.timesheet_id;
    }
    obj.total_hours = parseInt(obj.bill_hours) + parseInt(obj.nonbill_hours);
  });
  return callback(obj)
}

exports.submitMultipleTimesheet = (req, res) => {
  if(req.user){
    // console.log("req.body.weekSubmittedDataArr");
    if(req.body.length > 0) {
      req.body.forEach(function (timesheet, index) {
        pool.connect((err, client, done) => {
          client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND resource_id=$2 AND created_date=$3 AND task_id=$4 AND user_role=$5',[req.user.company_id, req.user.id, moment.tz(timesheet.created_date.split('T')[0], companyDefaultTimezone).format(), timesheet.task_id, timesheet.user_role], function(err, timesheetData) {
            if(err) {
              console.error(err);
              handleResponse.shouldAbort(err, client, done);
              handleResponse.handleError(res, err, ' Error in finding timesheet detail data 3');
            } else {
        //       // console.log("Timesheet Arr");
        //       // console.log(timesheetData);
              if(timesheetData.rowCount > 0) {
                client.query('SELECT project_id, billable, created_date at time zone'+companyDefaultTimezone+', project_name, user_role, SUM(total_work_hours) AS hours  FROM TIMESHEET_LINE_ITEM WHERE company_id=$1 AND resource_id=$2 AND created_date=$3 AND task_id=$4 AND user_role=$5 AND submitted=$6 GROUP BY project_id, billable, project_name, created_date, user_role order by project_id, user_role, billable',[req.user.company_id, req.user.id, moment.tz(timesheet.created_date.split('T')[0], companyDefaultTimezone).format(), timesheet.task_id, timesheet.user_role, false], function(err, insertRecord) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in updating timesheet detail data 4');
                  } else {
                    if(insertRecord.rowCount > 0) {
                      createMergedRow(insertRecord.rows, function (insertRow) {
                        // let modifiedDate=(moment.tz(new Date(), companyDefaultTimezone).format());
                        client.query('INSERT INTO TIMESHEET (resource_id, company_id, project_id, project_name, created_date, total_billable_hours, total_nonbill_hours, total_hours, last_updated_date, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, project_id, user_role', [req.user.id, req.user.company_id, insertRow.project_id, insertRow.project_name, insertRow.created_date, insertRow.bill_hours, insertRow.nonbill_hours, insertRow.total_hours, 'now()', insertRow.user_role], function(err, insertedRec) {
                          if (err) {
                            handleResponse.shouldAbort(err, client, done);
                            handleResponse.handleError(res, err, ' Error in updating timesheet detail data 4');
                          } else {
                            client.query('UPDATE TIMESHEET_LINE_ITEM SET timesheet_id=$1, submitted=$2  WHERE company_id=$3 AND resource_id=$4 AND created_date=$5 AND task_id=$6 AND user_role=$7',[insertedRec.rows[0].id, true, req.user.company_id, req.user.id, moment.tz(insertRow.created_date.split('T')[0], companyDefaultTimezone).format(), timesheet.task_id, insertRow.user_role], function(err, timesheetUpdatedData) {
                            if (err) {
                              handleResponse.shouldAbort(err, client, done);
                              handleResponse.handleError(res, err, ' Error in updating timesheet detail data 4');
                            } else {
                              // console.log("After all done");
                              // console.log(req.body.length+" ****** "+(index+1));
                              if(req.body.length == (index+1)) {
                                done();
                                handleResponse.sendSuccess(res,'Successfully submitted your timesheet.',{});
                              }
                            }
                            });
                          }
                        });
                      });
                      // INSERT INTO TIMESHEET (resource_id, company_id, project_id, project_name, created_date, total_billable_hours, total_nonbill_hours, total_hours, last_updated_date, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, project_id, user_role
                    }
                  }
                });
              } else {
                done();
                handleResponse.handleError(res, 'No record found', 'No record found.');
              }
            }
          });
        });
      })
    } else {
      handleResponse.sendSuccess(res,'Nothing to submit.',{});
    }
  } else{
    res.redirect('/domain');
  }
}

function createMergedRow(rowObj, result) {
  let mainObj = {};
  for (let i = 0; i < rowObj.length; i++) {
    if(i == 0) {
      mainObj.project_id = rowObj[i].project_id;
      mainObj.project_name = rowObj[i].project_name;
      mainObj.user_role = rowObj[i].user_role;
      mainObj.created_date = moment.tz(rowObj[i].created_date.split('T')[0], companyDefaultTimezone).format()
      mainObj.bill_hours = 0;
      mainObj.nonbill_hours = 0;
      mainObj.nonbill_hours = rowObj[i].hours;
      mainObj.total_hours = parseInt(mainObj.bill_hours) + parseInt(mainObj.nonbill_hours);
    } else {
      mainObj.bill_hours = rowObj[i].hours;
      mainObj.total_hours = parseInt(mainObj.bill_hours) + parseInt(mainObj.nonbill_hours);
    }

    // console.log(" ************* mainObj *************** ");
    // console.log(mainObj);
    return result(mainObj);

  }
}

exports.updateTimesheet = (req, res) => {
  if(req.user) {
    pool.connect((err, client, done) => {
      /* client.query('SELECT * FROM TIMESHEET WHERE id=$1',[req.body.timesheet_id], function(err, timesheetRec) {
        if(err) {
          console.error(err);
          shouldAbort(err, client, done);
          handleError(res, err, ' Error in finding timesheet data');
        } else {
          if(timesheetRec.rowCount > 0) { */
            client.query('SELECT * FROM TIMESHEET_LINE_ITEM WHERE id=$1',[req.body.timesheet_lineitem_id], function(err, timesheetLiRec) {
              if(err) {
                console.error(err);
                handleResponse.shouldAbort(err, client, done);
                handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
              } else {
                if(timesheetLiRec.rowCount > 0) {
                  client.query('UPDATE timesheet_line_item SET project_id=$1, task_id=$2, total_work_hours=$3, project_name=$4, task_name=$5, description=$6, category=$7 WHERE id=$8',[req.body.project_id, req.body.task_id, new_total_hours, req.body.project_name, req.body.task_name, req.body.description, req.body.category, req.body.timesheet_lineitem_id], function(err, updatedTimesheetLiRec) {
                  if(err) {
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in updating timesheet detail data');
                  } else {
                      /* client.query('UPDATE TIMESHEET SET project_id=$1, total_billable_hours=$2, total_nonbill_hours=$3, total_hours=$4, project_name=$5, last_updated_date=$6 WHERE id=$7;',[req.body.project_id, ], function(err, timesheetRec) {
                        if (err) {
                          shouldAbort(err, client, done);
                          handleError(res, err, ' Error in updating timesheet data');
                        } else {

                        }
                      }); */
                      done();
                      handleResponse.sendSuccess(res,'Timesheet updated successfully',{});
                      /*res.status(200).json({"success": true,"message":"success"});*/
                    }
                  });
                } else {
                  done();
                  handleResponse.handleError(res, 'No record found', 'No record found.');
                  /*res.status(200).json({"success": false,"message":"No record found."});*/
                }
              }
            });
        /*   }
        }
      }); */
    });
 } else{
    res.redirect('/domain');
  }
}

exports.deleteTimesheetRow = (req, res) => {
  if(req.user){
    pool.connect((err, client, done) => {
      /* client.query('BEGIN', (err) => {
        if (err){
          shouldAbort(err, client, done);
          handleError(res, err, ' Error in connecting to the database');
        } else { */
          /* client.query('SELECT * FROM TIMESHEET WHERE id=$1',[req.body.timesheet_id], function(err, timesheetData) {
            if (err) {
              shouldAbort(err, client, done);
              handleError(res, err, ' Error in finding timesheet data');
            } else {
              client.query('SELECT * FROM TIMESHEET_LINE_ITEM WHERE id=$1',[req.body.timesheet_lineitem_id], function(err, timesheetLiData) {
                if(err) {
                  console.error(err);
                  shouldAbort(err, client, done);
                  handleError(res, err, ' Error in finding timeheet detail data');
                } else {
                  let old_bill_hours = timesheetData.rows[0].total_billable_hours;
                  let old_nonbill_hours = timesheetData.rows[0].total_nonbill_hours;
                  let old_total_hours = timesheetData.rows[0].total_hours;

                  let bill_hours = 0;
                  let nonbill_hours = 0;

                  let new_bill_hours = 0;
                  let new_nonbill_hours = 0;
                  let new_total_hours = 0;
                  if(timesheetLiData.rows[0].category == "Billable") {
                    bill_hours = timesheetLiData.rows[0].total_work_hours;
                    nonbill_hours = 0;
                    new_bill_hours = old_bill_hours - bill_hours;
                    new_nonbill_hours = old_nonbill_hours - nonbill_hours;
                    new_total_hours = old_total_hours - bill_hours;
                  } else {
                    bill_hours = 0;
                    nonbill_hours = timesheetLiData.rows[0].total_work_hours;
                    new_bill_hours = old_bill_hours - bill_hours;
                    new_nonbill_hours = old_nonbill_hours - nonbill_hours;
                    new_total_hours = old_total_hours - nonbill_hours;
                  }
                  client.query('UPDATE timesheet SET total_billable_hours=$1, total_nonbill_hours=$2, total_hours=$3 WHERE id=$4',[new_bill_hours, new_nonbill_hours,new_total_hours, req.body.timesheet_id], function(err, timesheetData) {
                    if (err) {
                      shouldAbort(err, client, done);
                      handleError(res, err, ' Error in updating timesheet data');
                    } else { */
                      client.query('SELECT NOW() at time zone \''+companyDefaultTimezone+'\' as currentTimestamp, tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\' as lastruntime ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE id=$1',[req.body.timesheet_lineitem_id], function(err, timesheetLiData) {
                        if (err) {
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in selecting timesheet detail');
                        } else {
                          console.log('timesheetLiData.rowCount '+JSON.stringify(timesheetLiData))
                          console.log('req.body.timesheet_lineitem_id '+req.body.timesheet_lineitem_id);
                          if(timesheetLiData.rowCount > 0) {
                            let differenceOfTime ;
                            if(moment.tz(timesheetLiData.rows[0].currentTimestamp,companyDefaultTimezone).format('YYYY-MM-DD') == moment.tz(timesheetLiData.rows[0].lastruntime,companyDefaultTimezone).format('YYYY-MM-DD')){
                              differenceOfTime = hoursToMinutes(moment.tz(timesheetLiData.rows[0].currentTimestamp,companyDefaultTimezone).format('hh:mm')) - hoursToMinutes(moment.tz(timesheetLiData.rows[0].lastruntime,companyDefaultTimezone).format('hh:mm'))
                            }else{
                              differenceOfTime = hoursToMinutes('19:00') - hoursToMinutes(moment.tz(timesheetLiData.rows[0].lastruntime,companyDefaultTimezone).format('hh:mm'))
                            }
                            console.log('differenceOfTime after deleting element '+minuteToHours(differenceOfTime));
                            console.log(moment.tz(timesheetLiData.rows[0].currentTimestamp,companyDefaultTimezone).format());
                            console.log(moment.tz(timesheetLiData.rows[0].lastruntime,companyDefaultTimezone).format());

                            client.query('DELETE FROM TIMESHEET_LINE_ITEM WHERE id=$1',[req.body.timesheet_lineitem_id], function(err, deletedRow) {
                              if (err) {
                                console.log(' Error in deleting timesheet detail');
                                console.log(err);
                                handleResponse.shouldAbort(err, client, done);
                                handleResponse.handleError(res, err, ' Error in deleting timesheet detail');
                              } else {
                                /* client.query('COMMIT', (err) => {
                                  if (err) {
                                    console.error('Error committing transaction', err.stack);
                                    shouldAbort(err, client, done);
                                    handleError(res, err, ' Error in committing transaction');
                                  } else { */
                                    done();
                                    handleResponse.sendSuccess(res,'Timesheet row deleted successfully',{total_work_hours:minuteToHours(differenceOfTime)});
                                    /*res.status(200).json({"success": true,"message":"success"});*/
                                  /* }
                                }); */
                              }
                            });
                          }else{
                            done();
                            handleResponse.handleError(res,err,'No timesheet with this id exits');
                          }
                        }
                      });
                    /* }
                  });

                }
              });
            }
          });
        }
      }) */
    });
  } else{
    res.redirect('/domain');
  }
};


// addMultipleTimesheet
exports.addMultipleTimesheet = (req, res) => {
  // console.log('addTimesheet '+JSON.stringify(req.body));
  let weekData = req.body;
  if(req.user){
      pool.connect((err, client, done) => {
        // console.log("err");
        // console.log(err);
        /* client.query('BEGIN', (err) => {
          if (err) {
            shouldAbort(err, client, done);
            handleError(res, err, ' Error in connecting to the database.');
          } else { */
            if(req.body.day_task != '' && req.body.day_project != '') {
              // console.log("Inside if");
              weekData.forEach(function(data, index) {
                /* client.query('SELECT id FROM PROJECT WHERE company_id=$1 AND archived=$2',[req.user.company_id, false], function(err, projectList) {
                  if(err) {
                    // console.log(err);
                    handleResponse.shouldAbort(err, client, done);
                    handleResponse.handleError(res, err, ' Error in finding project.');
                  } else { */
                    // console.log("Inside select project");
                    // console.log('inside isRunning');

                    console.log('created_date'+data.created_date);
                    let day_time = hoursToMinutes(data.total_hours);
                    let created_date = moment.tz(data.created_date, companyDefaultTimezone).format();
                    console.log('created_date'+moment.tz(data.created_date, companyDefaultTimezone).format());
                      client.query('INSERT INTO TIMESHEET_LINE_ITEM (resource_id, project_id, task_id, created_date, total_work_hours, company_id, project_name, task_name, billable, isRunning, description, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',[req.user.id, data.project_id, data.task_id, moment.tz(data.created_date, companyDefaultTimezone).format(), day_time, req.user.company_id, data.project_name, data.task_name, data.billable, false, "", data.user_role], function(err, insertedLineItem) {
                        if(err) {
                          // console.log("Inside timesheet_line_item insert");
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in adding timesheet detail to the database.');
                        } else {

                          if(weekData.length == (index + 1)) {
                            done();
                            handleResponse.sendSuccess(res,'Timesheet added successfully',{line_item:insertedLineItem.rows[0]});
                          }
                        }
                    });
                  // }
                // });
              });
            } else {
              // console.log("Inside else");
              done();
              handleResponse.handleError(res, 'Error', 'Error');
            }
          /* }
        }); */
      });
  } else{
    res.redirect('/domain');
  }
};




// addTimesheet
exports.addTimesheet = (req, res) => {
  req.assert('project_id', 'Project Id cannot be blank').notEmpty();
  req.assert('task_id', 'Task id cannot be blank').notEmpty();
  req.assert('timesheet_date', 'Invalid date').notEmpty();
  req.assert('day_time', 'Total hours cannot be blank').notEmpty();
  req.assert('user_role', 'User role cannot be blank').notEmpty();

  if(req.user){
      pool.connect((err, client, done) => {
        // console.log("err");
        // console.log(err);
        /* client.query('BEGIN', (err) => {
          if (err) {
            shouldAbort(err, client, done);
            handleError(res, err, ' Error in connecting to the database.');
          } else { */
            if(req.body.day_task != '' && req.body.day_project != '') {
              // console.log("Inside if");
              client.query('SELECT id FROM PROJECT WHERE company_id=$1 AND archived=$2',[req.user.company_id, false], function(err, projectList) {
                if(err) {
                  // console.log(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding project.');
                } else {
                  projectData = {};
                  projectData.project_id = req.body.project_id;
                  projectData.assigned_user = req.user.id;
                  projectData.user_role = req.body.user_role;
                  commonController.checkProjectAssignment(req, client, err, done, projectData, res, function (response) {
                    // console.log("Inside select project");
                    let day_time = hoursToMinutes(req.body.day_time);
                    let week_day=moment.tz(req.body.timesheet_date.split(' ')[0].split('T')[0], companyDefaultTimezone).format('d');
                    let timesheet_date=moment.tz(req.body.timesheet_date.split(' ')[0].split('T')[0], companyDefaultTimezone).format();
                    console.log('week_day '+week_day+' timesheet_date '+timesheet_date);
                    console.log('timesheet_date '+timesheet_date+' '+req.body.timesheet_date);
                    let extraParam = {};
                    extraParam.day_time = day_time;
                    extraParam.week_day = week_day;
                    extraParam.timesheet_date = timesheet_date;
                    if(!response) {
                      client.query('SELECT account_id FROM PROJECT where id=$1 AND company_id=$2', [req.body.project_id, req.user.company_id], function (err, projectDetail) {
                        if (err) {
                          console.error(err);
                          handleResponse.shouldAbort(err, client, done);
                          handleResponse.handleError(res, err, ' Error in finding task data');
                        } else {
                          extraParams = {};
                          extraParams.assigned_user = req.user.id;
                          extraParams.user_role = req.body.user_role;
                          req.body.projectId = req.body.project_id;
                          if(projectDetail.rows.length>0){
                            req.body.accountId = projectDetail.rows[0].account_id;
                          }
                          let userData = {};
                          userData.userEmail = req.user.email+' ('+req.user.role+')';
                          req.body.userData = userData;
                          commonController.createProjectAssignment (req, client, err, done, extraParams, req.user.bill_rate, req.user.cost_rate, res, function (createProjectResponse) {
                            commonController.createTaskAssignment(req, client, err, done, req.body.task_id, req.user.bill_rate, req.user.cost_rate, extraParams, res, function (response2) {
                              // console.log("Task Assignment created");
                              // console.log(response2);
                              if(response2) {
                                if(req.body.isRunning){
                                  // console.log('inside isRunning');
                                  // console.log(req.body);
                                  createTimesheetLineItem(req, res, client, err, done, extraParam, true, function (response3) {
                                    done();
                                    handleResponse.sendSuccess(res,'Timesheet added successfully',{line_item:response3,userId:req.user.id});
                                  });
                                } else {
                                  // console.log('Inside isrunning is not true');
                                  createTimesheetLineItem(req, res, client, err, done, extraParam, false, function (response3) {
                                    done();
                                    // console.log('res object is');
                                    // console.log(res);
                                    handleResponse.sendSuccess(res,'Timesheet added successfully',{line_item:response3,userId:req.user.id});
                                  });
                                }
                              }
                            });
                          });
                        }
                      });
                    } else {
                      if(req.body.isRunning){
                        // console.log('inside isRunning');
                        // console.log(req.body);
                        createTimesheetLineItem(req, res, client, err, done, extraParam, true, function (response3) {

                          done();
                          handleResponse.sendSuccess(res,'Timesheet added successfully',{line_item:response3,userId:req.user.id});
                        });
                      } else {
                        createTimesheetLineItem(req, res, client, err, done, extraParam, false, function (response3) {

                          done();
                          handleResponse.sendSuccess(res,'Timesheet added successfully',{line_item:response3,userId:req.user.id});
                        });
                      }
                    }
                  })
                }
              });
            } else {
              // console.log("Inside else");
              done();
              handleResponse.handleError(res, 'Error', 'Error');
              /*res.status(200).json({"success": false, "msg" : "Error","message":"Error"});*/
            }
         /*  }
        }); */
      });
  } else{
    res.redirect('/domain');
  }
};

function createTimesheetLineItem(req, res, client, err, done, extraParam, isRunning, callback) {
  console.log('inside create new timesheet line item function timesheet date is '+extraParam.timesheet_date)
  console.log(req.params)
  let userId = req.params.userId ? req.params.userId:req.user.id;
  console.log('user id while inserting timesheet is '+userId);
  let queryToExec = 'INSERT INTO TIMESHEET_LINE_ITEM (resource_id, project_id, task_id, created_date, total_work_hours, company_id, project_name, task_name, description, billable, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *';
  let data = [userId, req.body.project_id, req.body.task_id, moment.tz(extraParam.timesheet_date.split('T')[0], companyDefaultTimezone).format(), extraParam.day_time, req.user.company_id, req.body.day_project, req.body.day_task, req.body.day_note,req.body.day_category, req.body.user_role];
  if(isRunning) {
    queryToExec = 'INSERT INTO TIMESHEET_LINE_ITEM (resource_id, project_id, task_id, created_date, total_work_hours, company_id, project_name, task_name, description, billable, isRunning,lastruntime, user_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *';
    data = [req.user.id, req.body.project_id, req.body.task_id, moment.tz(extraParam.timesheet_date.split('T')[0], companyDefaultTimezone).format(), extraParam.day_time, req.user.company_id, req.body.day_project, req.body.day_task, req.body.day_note,req.body.day_category, req.body.isRunning,'now()', req.body.user_role];
  }
  client.query(queryToExec, data, function(err, insertedLineItem) {
    if(err) {
      // console.log("Inside timesheet_line_item insert");
      console.error(err);
      handleResponse.shouldAbort(err, client, done);
      handleResponse.handleError(res, err, ' Error in adding exports.add detail to the database.');
    } else {
      return callback(insertedLineItem.rows[0]);
    }
  });
}


// getDayTimesheetWithTaskId
exports.getDayTimesheetWithTaskId = (req, res) => {

    // console.log("Update Timesheet Data");
    // console.log("1 "+req.user.company_id);
    // console.log("2 "+req.body.user_id);
    // console.log("3 "+req.body.project_id);
    // console.log("4 "+req.body.task_id);
    // console.log("5 "+req.body.created_date);
    setting.getCompanySetting(req, res ,(err,result)=>{
      if(err==true){
        // console.log('error in setting');
        // console.log(err);
        handleResponse.handleError(res, err, "Error in finding company setting.Please Restart.");

      }else{
            companyDefaultTimezone=result.timezone;
            console.log('Inside getDayTimesheetWithTaskId '+JSON.stringify(req.body));
            console.log('created_date '+moment.tz(req.body.created_date.split(' ')[0].split('T')[0]+' 23:59:59', companyDefaultTimezone).format() );
            if(req.body.user_id==undefined){
              req.body.user_id=req.user.id;
            }
            // console.log(req.user.company_id+' '+req.body.user_id+' '+req.body.project_id+' '+req.body.task_id+' '+moment.tz(req.body.created_date.split('T')[0], companyDefaultTimezone).format()+' '+moment.tz(req.body.created_date.split('T')[0]+' 23:59:59', companyDefaultTimezone).format()+' '+req.body.user_role);
            pool.connect((err, client, done) => {
              client.query('SELECT tl.id ,tl.resource_name ,tl.resource_id ,tl.project_id ,tl.task_id ,tl.created_date at time zone \''+companyDefaultTimezone+'\' as created_date ,tl.start_time at time zone \''+companyDefaultTimezone+'\' as start_time ,tl.end_time at time zone \''+companyDefaultTimezone+'\' as end_time ,tl.total_work_hours ,tl.company_id ,tl.project_name ,tl.task_name ,tl.description ,tl.category ,EXTRACT(DOW FROM tl.created_date at time zone \''+companyDefaultTimezone+'\') as week_day ,tl.timesheet_id ,tl.billable ,tl.submitted ,tl.isrunning ,tl.lastruntime at time zone \''+companyDefaultTimezone+'\'  as lastruntime  ,tl.user_role ,tl.invoiced ,tl.record_id ,tl.invoice_id FROM TIMESHEET_LINE_ITEM tl WHERE company_id=$1 AND resource_id=$2 AND project_id=$3 AND task_id=$4 AND created_date at time zone \''+companyDefaultTimezone+'\'  BETWEEN $5 AND $6 AND user_role=$7',[req.user.company_id, req.body.user_id, req.body.project_id, req.body.task_id, moment.tz(req.body.created_date.split('T')[0], companyDefaultTimezone).format(), moment.tz(req.body.created_date.split('T')[0]+' 23:59:59', companyDefaultTimezone).format(), req.body.user_role], function(err, dayData) {
                if(err) {
                  console.error(err);
                  handleResponse.shouldAbort(err, client, done);
                  handleResponse.handleError(res, err, ' Error in finding timesheet detail data');
                } else {
                  // console.log("Update Timesheet Data");
                  // console.log(dayData.rows);
                  done();

                  // console.log("taksList");
                  handleResponse.sendSuccess(res,'fetched timesheet data successfully',{data:{"timesheetData" : dayData.rows}});

                }
              });
            });
        }
    });
};

function minuteToHours(min) {
  var num = min;
  var hours = (num / 60);
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
  rminutes = rminutes < 10 ? '0'+rminutes : rminutes;
  return rhours + ":" + rminutes;
  }

  function hoursToMinutes(hours) {
    // console.log("Hours: " + typeof(hours));
    // console.log("Hours: " + hours);
    if(!hours.includes('.') && !hours.includes(':')){
      hours = hours + '.0'
    }
    // console.log(hours);
    var hoursArr = hours.includes('.') ? hours.split('.') : hours.split(':');
    if(hoursArr[1] > 60) {
      hoursArr[1] = Math.round((hoursArr[1] * 60) / 100);
    }
    var minutes = (+hoursArr[0]) * 60 + (+hoursArr[1]);
    // console.log(minutes);
    return minutes;
  }
