var globalTaskId,companyDefaultTimezone,userRoles;
$(document).ready(function(){
    initTimeHHMM();
    activePageLink();
    $(".open-date-pik").flatpickr({
        altInput: true,
        altFormat: "m-d-Y",
        dateFormat: "Y-m-d"
        // ,allowInput:true
    });
    $(".open-time-pik-24").flatpickr(
        {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true
        }
    );

    $('input[type!=hidden]:enabled,select').first().focus();
    /*let tabText=$(".slds-nav-vertical__item.slds-is-active .side-nav-text").text().trim();
    if(tabText!="Timesheet"){
*/
    /*}*/
    /* following two functions help in navigation and loading appropriate views not tested on all browsers.*/
    handleHashLinks();
    bindDataNavigationEvent();
    modifyInputEvent($('[data-modified]'));
});

/* handle navigation when browser back and forward button navigation */
window.onhashchange = function() {
    handleHashLinks();
}



function removeHrefFromLink(targetContainer){
  $("a",targetContainer).removeAttr('href');
}

function modifyInputEvent(ele){
  $('input,select,textarea',ele).on('focus',function(){
    $('[save-btn]',ele).removeAttr('disabled');
  })
  $('input[type=checkbox]',ele).on('change',function(){
    $('[save-btn]',ele).removeAttr('disabled');
  })
}

function exportToCsv(csvEndPoint){
  console.log(`/${csvEndPoint}`);
  window.location.href=`/${csvEndPoint}`;

}
function setDateToFlatpicker(inputId, date) {
    $(date).flatpickr({
        onReady: function (selectedDates, dateStr, instance) {
            $(date).val(
                instance.formatDate(new Date(date), 'Y-m-d')
            )
        },
    });
}
/* call click event on element with matching navigation hash value */
function handleHashLinks(){
    var hash = document.URL.substr(document.URL.indexOf('#')+1);

    var element  = $('[data-navigation="'+hash+'"]');
    if(document.URL.indexOf('#')!=-1 && element.length==0){
      var element  = $('[data-navigation="dayview"]');
      if(element.length >0){
        window.location.href = document.URL.substr(0,document.URL.indexOf('#')+1)+'dayview';
      }else{
        window.location.href = document.URL.substr(0,document.URL.indexOf('#')+1)+'default';
      }
      // element = $('[data-navigation="dayview"]');
    }
    if ( element.is( "button" ) ) {
        element.click();
    } else if(element.is( "li" ) && element.hasClass( "slds-tabs_default__item" )){
        element.click();
    }
}
/* binding a click event on all elements with data navigation attribute.*/
function bindDataNavigationEvent(){
    $("[data-navigation]").on('click', function(){
        var url = window.location.href.split('#')[0];
        url = url + '#' + $(this).data("navigation");
        window.location.href = url;
    });
}

function hmsToSecondsOnly(str,cb) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return cb(s);
}
function secondsToHms(d,cb) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h  : 0;
    var mDisplay = m > 0 ? m  : 0;
    var sDisplay = s > 0 ? s  : 0;
    if(mDisplay<10){
      mDisplay = '0'+mDisplay;
    }
    if(sDisplay<10){
      sDisplay = '0'+sDisplay;
    }
    return cb(hDisplay +':'+ mDisplay +':'+ sDisplay);
}
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
    console.log("Hours: " + typeof(hours));
    console.log("Hours: " + hours);
    if(!hours.includes('.') && !hours.includes(':')){
      hours = hours + '.0'
    }
    console.log(hours);
    var hoursArr = hours.includes('.') ? hours.split('.') : hours.split(':');
    if(hoursArr[1] > 60) {
      hoursArr[1] = Math.round((hoursArr[1] * 60) / 100);
    }
    var minutes = (+hoursArr[0]) * 60 + (+hoursArr[1]);
    console.log(minutes);
    return minutes;
  }
function showLoader(loaderId){
    $(loaderId).removeClass('hide');
}
function hideLoader(loaderId){
    $(loaderId).addClass('hide');
}
function openModal(modalId, isModalReset){
    console.log("inside open modal");
    if(isModalReset) {
        console.log("inside open modal - If");
        resetForm(modalId, true, false);
    } else {
        console.log("inside open modal - Else");
        $('.slds-modal',modalId).addClass('slds-fade-in-open');
        $('.slds-backdrop',modalId).addClass('slds-backdrop_open');
        $('input[type!=hidden]:enabled,select',modalId).first().focus();
    }

}
function closeModal(modalId){
    $('.slds-modal',modalId).removeClass('slds-fade-in-open');
    $('.slds-backdrop',modalId).removeClass('slds-backdrop_open');
}

function collapseSideMenu(){
    var w  = $(window).width();
    if (w > 1190){
        $('.side-nav-outer').toggleClass('collapse');
        $('.main-body-space').toggleClass('take-space');
        $('.top-bar-space').toggleClass('take-space');
    }
    else{
        $('.side-nav-outer').toggleClass('side-nav-show');
        $('#sideMenuBackdrop').addClass('slds-backdrop_open');
    }
}

$("#sideMenuBackdrop").click(function(){
    $('.side-nav-outer').removeClass('side-nav-show');
    $('#sideMenuBackdrop').removeClass('slds-backdrop_open');
});

function openDropdown(ele, e, closeAll){
    e.stopPropagation();
    var itsMenu = $(ele).find(".slds-dropdown");
    if (closeAll ){
        $('.slds-dropdown-trigger_click').removeClass('slds-is-open');
    }
    $(itsMenu).removeClass('slds-dropdown--bottom');
    var itsT = $(ele).offset().top;
    var itsH = $(itsMenu).height();
    var docH = ($(document).height())-60;
    if (itsT + itsH >= docH){
        $(itsMenu).addClass('slds-dropdown--bottom');
    }
    $(ele).addClass('slds-is-open');
}

function openTab(ele, target, scoped){
    var parent = $(ele).closest('.slds-tabs_default');
    var content = '.slds-tabs_default__content'
    if (scoped) {
        parent = $(ele).closest('.slds-tabs_scoped');
        content = '.slds-tabs_scoped__content'
    }
    $(parent).find(content).addClass('hide');
    $(ele).siblings().removeClass('slds-is-active');
    $(parent).find('[target-tab='+target+']').removeClass('hide');
    $(ele).addClass('slds-is-active');
}

function openTabVertical(ele, target){
    var parent = $(ele).closest('.slds-vertical-tabs');
    var content = '.slds-vertical-tabs__content'
    $(parent).find(content).addClass('hide');
    $(ele).siblings().removeClass('slds-is-active');
    $(parent).find('[target-tab='+target+']').removeClass('hide');
    $(ele).addClass('slds-is-active');
}

function btnGroupTabView(ele, wrapperId, view){
    $('[btn-tabview]', wrapperId).addClass('hide');
    $('[btn-tabview="'+view+'"]', wrapperId).removeClass('hide');
    var itsParent = $(ele).closest('.slds-button-group');
    $('button',itsParent).removeClass('btn-is-on');
    $(ele).addClass('btn-is-on');
    $(ele).blur();
}

function showGlobalToast(toastId,type,msg,closetime, noAutoClose,noCloseBtn){
    $('[toast-type]',toastId).removeClass('slds-theme_success slds-theme_error');
    $('[toast-icon]',toastId).attr('class', 'fa text-size-18 fa-info-circle');
    $('[toast-close]',toastId).show();

    if(type=="success"){
        $('[toast-type]',toastId).addClass('slds-theme_success');
        $('[toast-icon]',toastId).attr('class', 'fa text-size-18 fa-check-circle');
    }
    if(type=="error"){
        $('[toast-type]',toastId).addClass('slds-theme_error');
        $('[toast-icon]',toastId).attr('class', 'fa text-size-18 fa-exclamation-circle');
    }

    $('[toast-msg]',toastId).html(msg);

    $('[toast-close]',toastId).attr('onclick', 'closeGlobalToast("'+toastId+'")');

    if(noCloseBtn){
        $('[toast-close]',toastId).hide();
    }

    $(toastId).fadeIn(500);

    if(!noAutoClose){
        setTimeout(function(){
            $(toastId).fadeOut(500);
        }, closetime);
    }
}

function closeGlobalToast(toastId){
    $(toastId).fadeOut(500);
}

$(window).on('click',function(){
    $('.slds-dropdown-trigger_click').removeClass('slds-is-open');
});

$(window).on('click',function(){
    $('.slds-popover').addClass('hide');
});

function activePageLink(){
    var current = location.pathname+'#default';
    $('.side-nav-outer .slds-nav-vertical a').each(function(){
        var $this = $(this);
        if($this.attr('href') == current){
            $this.parent().addClass('slds-is-active');
        }
    });
}

function inlineEditMode(ele){
    var wrapper = $(ele).closest('[editable="wrapper"]');
    $(ele).closest('[editable="read-view"]').addClass('hide');
    $('[editable="edit-view"]', wrapper).removeClass('hide');
}

function showTip(e, ele, position, maxWidth) {
    e.stopPropagation();
    var x = $(ele).offset().left
    var y = $(ele).offset().top
    var h = $('.slds-popover').height();
    y = (y-h);
    x = (x-20);
    x = x+'px';
    y = y+'px';
    $('.slds-popover').css({'position':'fixed', 'top': y, 'left': x})
    $('.slds-popover').removeClass('hide');
}


function dummyAddItem(modalId, msg){
    showLoader('#globalLoader');
    setTimeout(function(){
        hideLoader('#globalLoader');
        closeModal(modalId);
        showGlobalToast('#globalToast', 'success', msg, 4000);
    }, 1500);
}

function dummyLogin(){
    showLoader('#globalLoader');
    setTimeout(function(){
        window.location.href = "/";
    }, 1500);
}

function dummySave(){
    showLoader('#globalLoader');
    setTimeout(function(){
        hideLoader('#globalLoader');
        showGlobalToast('#globalToast', 'success', 'Succssfully Saved', 4000);
    }, 1500);
}

function dummyOpenPage(page){
    showLoader('#globalLoader');
    setTimeout(function(){
        window.location.href = page;
    }, 1500);
}

function dummyEnableImpBtn(ele, btnId){
    var tab = $(ele).closest('[target-tab]');
    if($(ele).val() != ""){
        $(btnId, tab).removeAttr('disabled');
    }
}

function dummyImport(ele, progressId, summaryId, inputId){
    var tab = $(ele).closest('[target-tab]');
    $(ele).addClass('hide');
    $(progressId, tab).removeClass('hide');
    $('[progress-bar]',tab).animate({width: "100%"}, {
        duration:5000,
        step: function(now, fx){
            $( '[record-counts]',tab).add($( '[percent-progress]',tab)).text(Math.ceil(now));
        }
    })
    .promise().done(function(){
       $(inputId, tab).val('');
       $(ele).removeClass('hide').attr('disabled', 'disabled');
       $(progressId, tab).addClass('hide');
       $(summaryId, tab).removeClass('hide');
    });
}

/*-------------kw notification panel  js---------------*/
function showNotification(panelId, loaderId){
    $('body').addClass('scroll-hide');
    $(panelId).addClass('active');
    setTimeout(function(){
        $(loaderId).addClass('hide');
    }, 800);
}

function hideNotification(panelId, loaderId){
    $('body').removeClass('scroll-hide');
    $(panelId).removeClass('active');
    setTimeout(function(){
        $(loaderId).removeClass('hide');
    }, 800);
}


/*-------------timer js---------------*/
function incrementTime() {
    var time = $(kwCounter[0]).text().split(":");
    // if(time[2]==undefined||time[2]==null||time[2]==""){
    //     time[2]="00";
    // }
    time[2] = ("0" + (Number(time[2]) + 1) % 60).slice(-2);
    if (time[2] == "00") {
        time[1] = ("0" + (Number(time[1]) + 1) % 60).slice(-2);
        if (time[1] == "00") {
            time[0] = (Number(time[0]) + 1) % 10;
            if (time[0] == "0") {
                resetClicked();
            }
        }
    }
    kwCounter.text(time.join(":"));
}

function dateFormat(gDate) {
  return(gDate.split(' ')[0].split('T')[0]);
}

// function dateFormat(gDate) {
//     // var today = new Date(gDate);
//     // var dd = today.getDate();
//     // var mm = today.getMonth() + 1; //January is 0!
//     // var yyyy = today.getFullYear();
//     // if (dd < 10) {
//     //     dd = '0' + dd
//     // }
//     // if (mm < 10) {
//     //     mm = '0' + mm
//     // }
//     // formatedDate = yyyy + '-' + mm + '-' + dd;
//     let formatedDate = moment.tz(gDate, companyDefaultTimezone).format('YYYY-MM-DD');
//     return formatedDate;
// }

function addDataToLineItem(lineItemData,next){
    $.ajax({
        type: 'POST',
        url: '/updateTimesheetHours',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(lineItemData),
        success: function (response) {
            console.log(response);
            if (response.success == true) {
                return next(true,null,null);

            } else {
                return next(null,false,null);
            }
        },
        error: function (response) {
            return next(null,null,false);
        }
    });
}
function startKwTimerGlobally(ele,id) {
    // ele= $(ele).find("[start-timer]");
    $("[name=globalStart]").addClass('hide');
    $.ajax({
        type: 'POST',
        url: '/getGlobalProject',
        contentType: 'application/json',
        success: function (response) {
            console.log(response);
            console.log('current timestamp in start timer'+response.currentTimestamp);
            if (response.success == true) {
                globalTaskId = response.task.id;
                $.ajax({
                    type: 'POST',
                    url: '/getTimesheetWithPlay',
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function (res) {
                        console.log(res.timesheetData);
                        if (res.success == true) {
                            if(res.timesheetData.length>0){
                                location.reload();
                            }else{
                                let dayTimeSheetData={'isRunning':true};
                                dayTimeSheetData.project_id = response.project.id;
                                dayTimeSheetData.task_id = globalTaskId;
                                dayTimeSheetData.day_time = '0:00:00';
                                var timesheet_date = response.currentDate;
                                dayTimeSheetData.timesheet_date = timesheet_date;
                                // var timesheet_date=dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
                                // dayTimeSheetData.timesheet_date = timesheet_date;
                                dayTimeSheetData.user_role = 'Manager';
                                //console.log(dayTimeSheetData);
                                $.ajax({
                                    type: 'POST',
                                    url: '/addTimesheet',
                                    contentType: 'application/json',
                                    dataType: 'json',
                                    data: JSON.stringify(dayTimeSheetData),
                                    success: function (response) {
                                        //console.log(response);
                                        if (response.success == true) {
                                            $("[name=globalStart]").addClass('hide');
                                            // $("[name=globalStart]").css('display','none');
                                            $('[name=globalStop]').removeClass('hide');
                                            $($(id)[0]).text('0:00:00');
                                            kwCounter = $(id);
                                            intervalID = NaN;
                                            // $("[timerDiv]").on('click',function(){stopKwTimerGlobally(this, '[name=kwTimer]', '#syncTimer', '#modalAddNewTsheetQuick')});
                                            $("[name=kwTimer]").attr("taskId",response.line_item.id);
                                            $("[name=kwTimer]").attr("lineItemTaskId",response.line_item.task_id);
                                            /*$("[name=kwTimer]").attr("taskId",response.line_item.id);*/
                                            if (isNaN(intervalID)){
                                                intervalID = setInterval(()=>{incrementTime();}, 1000);
                                            }
                                            /*showGlobalToast('#globalToast', 'success', response.message, 4000);
                                            location.reload();*/
                                        } else {
                                            /*$('#addTimesheetLoader').addClass('hide');*/
                                            showGlobalToast('#globalToast', 'error', response.message, 4000);
                                        }
                                    },error: function (response) {
                                        console.log(response);
                                        /*$('#addTimesheetLoader').addClass('hide');*/
                                        showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
                                    }
                                });
                            }
                        } else {
                            /*$('#addTimesheetLoader').addClass('hide');*/
                            showGlobalToast('#globalToast', 'error', response.message, 4000);
                        }
                    },error: function (response) {
                        console.log(response);
                        /*$('#addTimesheetLoader').addClass('hide');*/
                        showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
                    }
                });


            } else {
                showGlobalToast('#globalToast', 'error', response.message, 4000);
            }
        },
        error: function (response) {
            console.log(response);
            showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
        }
    });

}
function renderRole(projectAssignmentList, id) {
    let option = '';
    if (projectAssignmentList.length > 0) {
        // option += '<option value=""> </option>';
        projectAssignmentList.forEach(function (projAssign) {
            option += `<option value="${projAssign.user_role}">${projAssign.user_role}</option>`;
        });

    } else {
        option = '<option value="">No roles found</option>'
    }
    console.log(option);
    console.log("id", id);
    $(id).html(option);
    // if(projectAssignmentList.length ==1 ){
    //     $(id).val(projectAssignmentList[0].user_role);
    // }
}
function renderTask(taskList, id) {
    let option = '';
    if (taskList.length > 0) {
        option += '<option value=""> </option>';
        taskList.forEach(function (task) {
            option += '<option task_billable='+task.billable+' pr_id='+task.project_id+' task_id=' + task.id + ' value="' + task.name + '">' + task.name + '</option>';
        });
    } else {
        option = '<option value="">No task found</option>'
    }
    console.log(option);
    console.log("id", id);
    $(id).html(option);
}
function getTaskBillValue(obj,id){
    $(id).attr('checked','');
    $('span[category-isBillable]').html('Billable');
    let task_billable=$('option:selected', obj).attr('task_billable');
    if(task_billable == "false"||task_billable == ''||task_billable == null){
            $(id).removeAttr('checked');
            $(id).closest('div.slds-m-bottom_large').find('span[category-isBillable]').html('Non Billable');
    }
}

function getProjectTask(val, id, roleInputId) {
    console.log("Iddd:", id);
    if ($('option:selected', val).val() != '' && $('option:selected', val).val() != undefined && $('option:selected', val).val() != null) {
        $('#addTimesheetLoader').removeClass('hide');
        var projectName = $('option:selected', val).val();
        var projectId = $('option:selected', val).attr('pr_id');
        $.ajax({
            type: 'POST',
            url: '/getTaskAndAssignmentList',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ "projectId": projectId }),
            success: function (response) {
                if (response.success == true) {
                    renderTask(response.tasks, id);
                    renderRole(response.projectAssignment,roleInputId);
                    $('#addTimesheetLoader').addClass('hide');
                } else {
                    $('#addTimesheetLoader').addClass('hide');
                    showGlobalToast('#globalToast', 'error', 'Something went wrong.', 4000);
                }
            },
            error: function (response) {
                console.log(response);
                $('#addTimesheetLoader').addClass('hide');
                showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
            }
        });
    } else {
        $(id).html('<option value=""> </option>');
    }
}
function addRowToTimesheet(timesheetData){
    let timsheetBillable='';
    if(timesheetData.billable){
      timsheetBillable=`<li class="slds-item" id="billableLineItem">
                      Billable
                  </li>`;
    }
    let timesheetNotSubmittedPlay='';
    let timesheetNotSubmitted='';
    if(!timesheetData.submitted){
      timesheetNotSubmittedPlay=`<div class="slds-no-flex" remove-on-other-user>
                                    <button class="slds-button slds-button_icon slds-button_icon-border-filled" title="start" start line_item_id="${timesheetData.id}"    onclick="startTimer(this);">
                                        <span class="slds-button__icon">
                                            <i class=" fa fa-play text-blue" aria-hidden="true"></i>
                                        </span>
                                    </button>
                                    <button class="slds-button slds-button_icon slds-button_icon-border-filled hide" title="stop" stop line_item_id="${timesheetData.id}" onclick="stopTimer(this);">
                                         <span class="slds-button__icon">
                                            <i class=" fa fa-stop text-red" aria-hidden="true"></i>
                                        </span>
                                    </button>
                                </div>`;
      timesheetNotSubmitted=`<div class="slds-size_5-of-12  slds-p-horizontal_small">
                                  <div class="text-right" remove-on-other-user>
                                      <button class="slds-button slds-button_icon slds-m-right_small" title="edit"  onclick="updateDayTimesheet('${timesheetData.id}');">
                                          <span class="slds-button__icon">
                                              <i class=" fa fa-pen text-blue" aria-hidden="true"></i>
                                          </span>
                                      </button>
                                      <button class="slds-button slds-button_icon" title="delete" ts_li_id="${timesheetData.id}" onclick="deleteDayTimesheet(this);">
                                          <span class="slds-button__icon">
                                              <i class=" fa fa-trash text-red" aria-hidden="true"></i>
                                          </span>
                                      </button>
                                  </div>
                              </div>`;
    }
    let timsheetSubmitted='';
    if(timesheetData.submitted){
      timsheetSubmitted=`<li class="slds-item text-green">Submitted</li>`;
    }

    let timesheetSubmitDiv=(timesheetData.submitted)?
      '<div class="line-around slds-p-around_x-small slds-m-bottom_small" id="'+timesheetData.id+'" submitted>':
      '<div class="line-around slds-p-around_x-small slds-m-bottom_small" id="'+timesheetData.id+'" saved>';
    // let timesheetDataHtml='<div class="line-around slds-p-around_x-small slds-m-bottom_small">'+
    //                     '<div class="slds-grid slds-wrap">'+
    //                         '<div class="slds-size_1-of-1 slds-medium-size_1-of-2">'+
    //                             '<div class="text-gray">'+
    //                                 '<i class="fa fa-folder-open"></i>'+
    //                                 '<span class="text-uppercase text-size-11">'+
    //                                     timesheetData.project_name+
    //                                 '</span>'+
    //                             '</div>'+
    //                             '<div class="slds-p-left_small">'+
    //                                 '<div class="text-size-16 text-thick">'+
    //                                     timesheetData.task_name+
    //                                 '</div>'+
    //                                 '<div class=" text-size-11 text-dull sm-vpd-8">'+
    //                                     timesheetData.description+
    //                                 '</div>'+
    //                             '</div>'+
    //                         '</div>'+
    //                         '<div class="slds-size_1-of-1 slds-medium-size_1-of-2">'+
    //
    //                             '<div class="slds-grid slds-grid_align-end slds-grid_vertical-align-center">'+
    //                                 '<div>'+
    //                                     '<button class="slds-button slds-button_icon slds-button_icon-border-filled" title="start" start line_item_id="'+ timesheetData.id +'"    onclick="startTimer(this);">'+
    //                                     '<span class="slds-button__icon">'+
    //                                         '<i class=" fa fa-play text-blue" aria-hidden="true"></i>'+
    //                                     '</span>'+
    //                                     '</button>'+
    //                                     '<button class="slds-button slds-button_icon slds-button_icon-border-filled hide" title="stop" stop line_item_id="'+ timesheetData.id +'" onclick="stopTimer(this);">'+
    //                                     '<span class="slds-button__icon">'+
    //                                         '<i class=" fa fa-stop text-red" aria-hidden="true"></i>'+
    //                                     '</span>'+
    //                                     '</button>'+
    //                                 '</div>'+
    //                                 '<div class="line-left slds-p-horizontal_small slds-m-left_small">'+
    //                                     '<time class="text-size-21">'+ minuteToHours(timesheetData.total_work_hours)+'</time>'+
    //                                 '</div>'+
    //                                 '<div>'+
    //
    //                                     '<ul class="slds-list_horizontal slds-has-dividers_left">'+
    //                                         '<li class="slds-item">Consultant</li>'+
    //                                         '<li class="slds-item">'+
    //                                             billable+
    //                                         '</li>'+
    //                                     '</ul>'+
    //                                 '</div>'+
    //                             '</div>'+
    //                             '<div class="text-right">'+
    //                                 '<button class="slds-button slds-button_icon slds-button_icon-border-filled" title="edit"  onclick="updateDayTimesheet('+timesheetData.id+');">'+
    //                                 '<span class="slds-button__icon">'+
    //                                     '<i class=" fa fa-pen text-blue" aria-hidden="true"></i>'+
    //                                 '</span>'+
    //                                 '</button>'+
    //                                 '<button class="slds-button slds-button_icon slds-button_icon-border-filled" title="delete" onclick="deleteDayTimesheet('+timesheetData.id+', '+timesheetData.timesheet_id+');">'+
    //                                 '<span class="slds-button__icon">'+
    //                                     '<i class=" fa fa-trash text-red" aria-hidden="true"></i>'+
    //                                 '</span>'+
    //                                 '</button>'+
    //                             '</div>'+
    //                         '</div>'+
    //                     '</div>'+
    //                 '</div>';
    let timesheetRowHtml=` ${timesheetSubmitDiv}
                            <div class="slds-grid slds-wrap">
                          <div class="slds-size_1-of-1 slds-medium-size_6-of-12">
                              <div class="text-gray">
                                  <i class="fa fa-folder-open"></i>
                                  <span class="text-uppercase text-size-11" id="projectLineItem" pr_id="${timesheetData.project_id}">${timesheetData.project_name}</span>
                              </div>

                              <div class="text-size-16 text-thick" id="taskLineItem" tk_id="${timesheetData.task_id}">${timesheetData.task_name}</div>

                              <div class=" text-size-11 text-dull sm-vpd-8" id="noteLineItem"> ${timesheetData.description}</div>
                          </div>
                          <div class="slds-size_1-of-1 slds-medium-size_3-of-12">
                              <div class=" slds-truncate" >Role: <span id="userRoleLineItem">${timesheetData.user_role}</span></div>
                          </div>
                          <div class="slds-size_1-of-1 slds-medium-size_3-of-12">
                              <div class="slds-grid slds-wrap slds-grid_pull-padded sm-tpd-10">
                                  <div class="slds-size_7-of-12  slds-p-horizontal_small">
                                      <div class="slds-grid">
                                          ${timesheetNotSubmittedPlay}
                                          <div class="line-left slds-p-horizontal_small slds-m-left_small slds-has-flexi-truncate">
                                              <time class="text-size-21">${minuteToHours(timesheetData.total_work_hours)}</time>
                                              <ul class="slds-list_horizontal slds-has-dividers_left">
                                                  ${timsheetBillable}
                                                  ${timsheetSubmitted}
                                              </ul>
                                          </div>
                                      </div>
                                  </div>
                                  ${timesheetNotSubmitted}
                              </div>
                          </div>
                      </div>
                  </div>`
    if($('#day-tabs').find('.slds-tabs_default__content:not(.hide)').find('.slds-p-around_x-small:last').length > 0){
      $('#day-tabs').find('.slds-tabs_default__content:not(.hide)').find('.slds-p-around_x-small:last').after(timesheetRowHtml);
    }else{
      $('#day-tabs').find('.slds-tabs_default__content').not('.hide').append(timesheetRowHtml);
    }
}

function addTimeLogEntry(modalId,formId){
        let lineItemData = createJSONForFormData(formId);
        if ($('#globalProjectForTimesheet option:selected').val() == '' || $('#globalProjectForTimesheet option:selected').val() == null || $('#globalProjectForTimesheet option:selected').val() == undefined) {
            addError('#globalProjectForTimesheet', "Please select any project");
        } else {
            if ($('#globalUserRole option:selected').val() == '' || $('#globalUserRole option:selected').val() == null || $('#globalUserRole option:selected').val() == undefined) {
                clearError('#globalProjectForTimesheet');
                addError('#globalUserRole', "Please select any task");
            } else {
                showLoader('#globalLoader');
                lineItemData.task_id = $('#globalTaskForTimesheet option:selected').attr('task_id');
                lineItemData.project_id = $('#globalProjectForTimesheet option:selected').attr('pr_id');
                lineItemData.user_role = $('#globalUserRole option:selected').val();
                // lineItemData.bill_rate = $('#globalUserRole option:selected').attr('bill_rate');
                // lineItemData.cost_rate = $('#globalUserRole option:selected').val('cost_rate');
                lineItemData.day_category = $('#globalTaskBill').is(':checked');
                // let line_item_date = dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
                //let line_item_date=$("#logSubmittedDate").text();
                let line_item_date=$("#logSubmittedDate").attr('date');
                // let line_item_date = dateFormat(moment.tz(new Date(), 'America/Los_Angeles').format());
                lineItemData.timesheet_date = line_item_date;
                console.log(lineItemData);
                $.ajax({
                    type: 'GET',
                    url: '/currentTimestamp',
                    contentType: 'application/json',
                    success: function (res) {
                        // console.log(response);
                        console.log('current timestamp for addTimeLogEntry'+res.currentTimestamp);
                        let currentDate = res.currentTimestamp;
                          $.ajax({
                              type: 'POST',
                              url: '/addTimesheet',
                              contentType: 'application/json',
                              dataType: 'json',
                              data: JSON.stringify(lineItemData),
                              success: function (response) {
                                  console.log(response);
                                  hideLoader('#globalLoader');
                                  if (response.success == true) {
                                      $('#addTimesheetLoader').addClass('hide');
                                      closeModal(modalId);
                                      let eleToStart=$("#day-tabs");
                                      if(eleToStart.length>0){
                                          let currentDiv=$("#day-tabs > div").not('.hide');
                                          if(currentDiv.length == 0) {
                                              let day = moment.tz(res.currentDate, companyDefaultTimezone).format('d');
                                              let dayFull = moment.tz(res.currentDate, companyDefaultTimezone).format('dddd');
                                              let date = moment.tz(res.currentDate, companyDefaultTimezone).format('YYYY-MM-DD');
                                              divHTML = `<div class="slds-tabs_default__content" day=${day} target-tab=' ${dayFull}' date='${date}' >
                                                            <div class=" slds-p-bottom_medium ">
                                                            </div>
                                                          </div>`;
                                              $("#day-tabs").append(divHTML);
                                              currentDiv=$("#day-tabs > div").not('.hide');
                                          }
                                          if(currentDiv.attr('date')== dateFormat(moment.tz(res.currentDate, companyDefaultTimezone).format())){
                                              addRowToTimesheet(response.line_item);
                                              if(selectedEle!=null&&selectedEle!=undefined){
                                                  // intervalID = NaN;
                                                  let currentLineItemId=$(selectedEle).attr('line_item_id');
                                                  let updatedLineItem={"line_item_id":currentLineItemId,"isRunning":true};
                                                  updateCurrentLineItem(updatedLineItem,(success,nores,err)=>{
                                                      if(success==true){
                                                          $(selectedEle).addClass('hide');
                                                          $(selectedEle).next('[stop]').removeClass('hide');
                                                          // $(selectedEle).closest('.slds-grid').find('svg').removeClass('slds-hide');
                                                          $("[name=globalStop]").removeClass('hide');
                                                          if (isNaN(intervalID)){
                                                              intervalID = setInterval(function(){incrementTimeOfCount()}, 1000);
                                                          }
                                                          startKwTimerGlobal($("[name=globalStart]"));
                                                      }else if(nores==true){
                                                          $('#addTimesheetLoader').addClass('hide');
                                                          showGlobalToast('#globalToast', 'error', response.message, 4000);
                                                      }else{
                                                          console.log(response);
                                                          $('#addTimesheetLoader').addClass('hide');
                                                          showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
                                                      }
                                                  });
                                              }
                                                setTimeout(function(){location.reload()},1000);
                                          }else{
                                              if(selectedEle!=null&&selectedEle!=undefined){

                                                  intervalID = NaN;
                                                  let timesheetRowData={};
                                                  let ele=selectedEle;
                                                  timesheetRowDataid=$(ele).attr('line_item_id');
                                                  let currentSelectedRow=$(ele).closest('div[id='+timesheetRowDataid+']');
                                                  timesheetRowData.project_id=currentSelectedRow.find('#projectLineItem').attr('pr_id');
                                                  timesheetRowData.day_project=currentSelectedRow.find('#projectLineItem').text();
                                                  timesheetRowData.task_id=currentSelectedRow.find('#taskLineItem').attr('tk_id');
                                                  timesheetRowData.day_task=currentSelectedRow.find('#taskLineItem').text();
                                                  timesheetRowData.user_role=currentSelectedRow.find('#userRoleLineItem').text();
                                                  timesheetRowData.day_note=(currentSelectedRow.find('#noteLineItem').text()=="")?' ':currentSelectedRow.find('#noteLineItem').text();
                                                  timesheetRowData.day_category=(currentSelectedRow.find('#billableLineItem').text()=="Billable")?true:false;
                                                  // timesheetRowData.lastruntime=res.currentTime;
                                                  timesheetRowData.timesheet_date=dateFormat(moment.tz(res.currentDate, companyDefaultTimezone).format());
                                                  timesheetRowData.isRunning=true;
                                                  timesheetRowData.day_time="0:00";
                                                  console.log(timesheetRowData);
                                                  /*addRowToTimesheet(timesheetRowData);*/
                                                  $.ajax({
                                                      type: 'POST',
                                                      url: '/addTimesheet',
                                                      contentType: 'application/json',
                                                      dataType: 'json',
                                                      data: JSON.stringify(timesheetRowData),
                                                      success: function (response) {
                                                          console.log(response);
                                                          if (response.success == true) {
                                                              $('#addTimesheetLoader').addClass('hide');
                                                              let reqUserId = response.userId;
                                                              console.log(reqUserId);
                                                              /*showGlobalToast('#globalToast', 'success', response.message, 4000);*/
                                                              window.location.href='/timesheet/'+reqUserId+'#'+moment.tz(res.currentDate, companyDefaultTimezone).format('dddd').toLowerCase();
                                                              location.reload();
                                                          } else {
                                                              $('#addTimesheetLoader').addClass('hide');
                                                              showGlobalToast('#globalToast', 'error', response.message, 4000);
                                                          }
                                                      },
                                                      error: function (response) {
                                                          console.log(response);
                                                          $('#addTimesheetLoader').addClass('hide');
                                                          showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
                                                      }
                                                  });
                                              }
                                          }
                                      }

                                  } else {
                                      $('#addTimesheetLoader').addClass('hide');
                                      showGlobalToast('#globalToast', 'error', response.message, 4000);
                                  }
                              },
                              error: function (response) {
                                  console.log(response);
                                  hideLoader('#globalLoader');
                                  $('#addTimesheetLoader').addClass('hide');
                                  showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
                              }
                          });
                        },error: function (response) {
                            console.log(response);
                            hideLoader('#globalLoader');
                            showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
                        }
                    });

                }
            }

    }

function stopKwTimerWithLogEntry(lineItemId,ele, id, inputId, modalId,currentDate){
  showLoader('#globalLoader');
  $.ajax({
      type: 'POST',
      url: '/deleteTimesheetRow',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({"timesheet_lineitem_id":lineItemId}),
      success: function (response) {
          console.log(response);
          if (response.success == true) {
              hideLoader('#globalLoader');
              if(typeof intervalID!="undefined"){
                clearInterval(intervalID);
              }
              intervalID = NaN;
              let logSubmittedDate=$("[name=kwTimer]").attr("lineItemDate");
              if(typeof logSubmittedDate=="undefined"){
                logSubmittedDate=moment.tz(currentDate, companyDefaultTimezone).format('MM-DD-YYYY');
              }
              $("#logSubmittedDate").text(logSubmittedDate);
              $("#logSubmittedDate").attr('date',currentDate);
              // $(inputId).val($($(id)[0]).text());
              $(inputId).val(response.total_work_hours);
              $("[name=globalStop]").addClass('hide');
              // $("[name=globalStop]").css('display','none');
              $('[name=globalStart]').removeClass('hide');
              // $(id).text('Start');
              openModal(modalId,true);
          } else {
              hideLoader('#globalLoader');
              showGlobalToast('#globalToast', 'error', response.message, 4000);
          }
      },
      error: function (response) {
          console.log(response);
          hideLoader('#globalLoader');
          showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
          setTimeout(function(){location.reload()},1000);
      }
  });
}
function stopTimerForElement(ele, id, inputId, modalId,lineItemId){
  // let updatedHours=$("[name=kwTimer]").text();
  let lineItemData={"line_item_id":lineItemId,"updateTimer":'stopTimer',"isRunning":false};
  addDataToLineItem(lineItemData,(success,nodata,error)=>{
      if(success==true){
          /*$(ele).addClass('hide');
          $(ele).siblings('button').removeClass('hide');
          $(ele).closest('.slds-grid').find('time').text(updatedHours.substr(0,updatedHours.lastIndexOf(':')));
          stopKwTimerGlobal($("[name=globalStop]"));*/
          $("[name=globalStop]").addClass('hide');
          // $("[name=globalStop]").css('display','none');
          $('[name=globalStart]').removeClass('hide');
          $(id).text('Start');
          if(typeof intervalID!="undefined"){
            clearInterval(intervalID);
          }
          intervalID = NaN;
          location.reload();
      }else if(nodata==true){
          showGlobalToast('#globalToast', 'error', response.message, 4000);
      }else{
          console.log(response);
          showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
      }

  });
}
function stopKwTimerGlobally(ele, id, inputId, modalId,currentDate) {
    // ele=$(ele).find("[stop-timer]");
    let eleToStart=$("#day-tabs");
    $.ajax({
        type: 'POST',
        url: '/getGlobalProject',
        contentType: 'application/json',
        success: function (response) {
            // console.log(response);
            console.log('current timestamp '+response.currentTimestamp);
            if (response.success == true) {
                hideLoader('#globalLoader');
                // $("[timerDiv]").on('click',function(){startKwTimerGlobally(this,'[name=kwTimer]')});
                globalTaskId = response.task.id;
                let lineItemTaskId=$("[name=kwTimer]").attr("lineItemTaskId");
                let lineItemId=$("[name=kwTimer]").attr("taskId");
                if(eleToStart.length>0){

                    if(lineItemTaskId==globalTaskId){
                        stopKwTimerWithLogEntry(lineItemId,ele, id, inputId, modalId,response.currentTimestamp);

                    }else{
                        if(selectedEle!=undefined&&selectedEle!=null){
                        // $("[name=kwTimer]").text('Start');
                        // selectedEle=$("#day-tabs #"+lineItemId+" button[title=start]")
                          stopTimer($(selectedEle).next('[stop]'));
                        }else{
                          stopTimerForElement(ele, id, inputId, modalId,lineItemId);
                        }
                    }
                }else{
                    if(lineItemTaskId==globalTaskId){
                      stopKwTimerWithLogEntry(lineItemId,ele, id, inputId, modalId,response.currentTimestamp);

                }else{
                  stopTimerForElement(ele, id, inputId, modalId,lineItemId);
                }
          }
        }else {
            hideLoader('#globalLoader');
                showGlobalToast('#globalToast', 'error', response.message, 4000);
        }
      },error: function (response) {
          console.log(response);
          hideLoader('#globalLoader');
          showGlobalToast('#globalToast', 'error', response.responseJSON.message, 4000);
      }
    });

}

function resetForm(elementID, isModalOpen, isTabOpen) {
    console.log("reset form");
    var modal = $(elementID);

    $("[reset='errorclass']", modal).removeClass('slds-has-error');
    $("[reset='errmsg']", modal).html('');
    $("[reset='value']", modal).val('');
    $("[reset='number']", modal).val('0');
    $("[reset-disabled='true']", modal).attr('disabled', 'disabled');
    $("[reset-disabled='false']", modal).removeAttr('disabled');
    $("[reset-checked='true']", modal).prop("checked",true);
    $("[reset-unchecked='true']", modal).prop("checked",false);
    $("[reset='default']", modal).val($("[reset='default']", modal).attr('default-val'));

    if (isModalOpen) {
        console.log("returned to open modal")
        openModal(elementID);
    }
    if (isTabOpen) {
        console.log("returned to open tab")
    }
 }

 /*------------Time formate HH:MM js------------ */
 function initTimeHHMM() {
    $(".time-hhmm").attr('maxlength', '5');
    $(".time-hhmm").attr('placeholder', 'HH:MM');
    $(".time-hhmm").bind({
        keydown: CheckNum,
        blur: formateHHMM,
        keypress:separateTime
    });
}

function CheckNum(e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13]) !== -1 ||
         // Allow: Ctrl+A, Command+A
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
         // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
             // let it happen, don't do anything
             return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
    }
};
function unformateHHMM(e) {
    $(this).val($(this).val().replace(':', ''));
}

function separateTime(e) {
    var str  = $(this).val();
    if(str.length > 1 && str.length < 3) {
        $(this).val(str+':');
    }
}

function formateHHMM(e) {
    var str  = $(this).val();
    if(str.trim().length > 0) {
        if (str.length > 2) {
            str = (str).slice(-5);
        }
        else{
            str = (str + ':00').slice(-5);
        }
        var mm = parseInt(str.substr(3, 2));
        var hh = parseInt(str.slice(0,2));
        if (mm > 59){
            mm = mm-60;
        }

        if (hh > 23){
            hh = hh % 24;
        }
        mm = ('0' + mm).slice(-2);
        hh = ('0' + hh).slice(-2);
        var formate = hh + ':' + mm;
        $(this).val(formate);
    } else {
        $(this).val('00:00');
    }
}
function closeGlobalTimesheet(modalId){
  $('[name=globalStop]').addClass('hide');
  // $('[name=globalStart] time').text('Start');
  $('[name=globalStart]').removeClass('hide');
  closeModal(modalId);
}
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}
/*------------Time formate HH:MM js END------------ */

/*////////////////////////////////////////////////////////////drap drop js start///////////////////////////////////////////////// */
/* ===================================================
 *  jquery-sortable.js v0.9.13
 *  http://johnny.github.com/jquery-sortable/


 * ========================================================== */


!function ( $, window, pluginName, undefined){
  var containerDefaults = {
    // If true, items can be dragged from this container
    drag: true,
    // If true, items can be droped onto this container
    drop: true,
    // Exclude items from being draggable, if the
    // selector matches the item
    exclude: "",
    // If true, search for nested containers within an item.If you nest containers,
    // either the original selector with which you call the plugin must only match the top containers,
    // or you need to specify a group (see the bootstrap nav example)
    nested: true,
    // If true, the items are assumed to be arranged vertically
    vertical: true
  }, // end container defaults
  groupDefaults = {
    // This is executed after the placeholder has been moved.
    // $closestItemOrContainer contains the closest item, the placeholder
    // has been put at or the closest empty Container, the placeholder has
    // been appended to.
    afterMove: function ($placeholder, container, $closestItemOrContainer) {
    },
    // The exact css path between the container and its items, e.g. "> tbody"
    containerPath: "",
    // The css selector of the containers
    containerSelector: "ol, ul",
    // Distance the mouse has to travel to start dragging
    distance: 0,
    // Time in milliseconds after mousedown until dragging should start.
    // This option can be used to prevent unwanted drags when clicking on an element.
    delay: 0,
    // The css selector of the drag handle
    handle: "",
    // The exact css path between the item and its subcontainers.
    // It should only match the immediate items of a container.
    // No item of a subcontainer should be matched. E.g. for ol>div>li the itemPath is "> div"
    itemPath: "",
    // The css selector of the items
    itemSelector: "li",
    // The class given to "body" while an item is being dragged
    bodyClass: "dragging",
    // The class giving to an item while being dragged
    draggedClass: "dragged",
    // Check if the dragged item may be inside the container.
    // Use with care, since the search for a valid container entails a depth first search
    // and may be quite expensive.
    isValidTarget: function ($item, container) {
      return true
    },
    // Executed before onDrop if placeholder is detached.
    // This happens if pullPlaceholder is set to false and the drop occurs outside a container.
    onCancel: function ($item, container, _super, event) {
    },
    // Executed at the beginning of a mouse move event.
    // The Placeholder has not been moved yet.
    onDrag: function ($item, position, _super, event) {
      $item.css(position)
    },
    // Called after the drag has been started,
    // that is the mouse button is being held down and
    // the mouse is moving.
    // The container is the closest initialized container.
    // Therefore it might not be the container, that actually contains the item.
    onDragStart: function ($item, container, _super, event) {
      $item.css({
        height: $item.outerHeight(),
        width: $item.outerWidth()
      })
      $item.addClass(container.group.options.draggedClass)
      $("body").addClass(container.group.options.bodyClass)
    },
    // Called when the mouse button is being released
    onDrop: function ($item, container, _super, event) {
      $item.removeClass(container.group.options.draggedClass).removeAttr("style")
      $("body").removeClass(container.group.options.bodyClass)
    },
    // Called on mousedown. If falsy value is returned, the dragging will not start.
    // Ignore if element clicked is input, select or textarea
    onMousedown: function ($item, _super, event) {
      if (!event.target.nodeName.match(/^(input|select|textarea)$/i)) {
        event.preventDefault()
        return true
      }
    },
    // The class of the placeholder (must match placeholder option markup)
    placeholderClass: "placeholder",
    // Template for the placeholder. Can be any valid jQuery input
    // e.g. a string, a DOM element.
    // The placeholder must have the class "placeholder"
    placeholder: '<li class="placeholder"></li>',
    // If true, the position of the placeholder is calculated on every mousemove.
    // If false, it is only calculated when the mouse is above a container.
    pullPlaceholder: true,
    // Specifies serialization of the container group.
    // The pair $parent/$children is either container/items or item/subcontainers.
    serialize: function ($parent, $children, parentIsContainer) {
      var result = $.extend({}, $parent.data())

      if(parentIsContainer)
        return [$children]
      else if ($children[0]){
        result.children = $children
      }

      delete result.subContainers
      delete result.sortable

      return result
    },
    // Set tolerance while dragging. Positive values decrease sensitivity,
    // negative values increase it.
    tolerance: 0
  }, // end group defaults
  containerGroups = {},
  groupCounter = 0,
  emptyBox = {
    left: 0,
    top: 0,
    bottom: 0,
    right:0
  },
  eventNames = {
    start: "touchstart.sortable mousedown.sortable",
    drop: "touchend.sortable touchcancel.sortable mouseup.sortable",
    drag: "touchmove.sortable mousemove.sortable",
    scroll: "scroll.sortable"
  },
  subContainerKey = "subContainers"

  /*
   * a is Array [left, right, top, bottom]
   * b is array [left, top]
   */
  function d(a,b) {
    var x = Math.max(0, a[0] - b[0], b[0] - a[1]),
    y = Math.max(0, a[2] - b[1], b[1] - a[3])
    return x+y;
  }

  function setDimensions(array, dimensions, tolerance, useOffset) {
    var i = array.length,
    offsetMethod = useOffset ? "offset" : "position"
    tolerance = tolerance || 0

    while(i--){
      var el = array[i].el ? array[i].el : $(array[i]),
      // use fitting method
      pos = el[offsetMethod]()
      pos.left += parseInt(el.css('margin-left'), 10)
      pos.top += parseInt(el.css('margin-top'),10)
      dimensions[i] = [
        pos.left - tolerance,
        pos.left + el.outerWidth() + tolerance,
        pos.top - tolerance,
        pos.top + el.outerHeight() + tolerance
      ]
    }
  }

  function getRelativePosition(pointer, element) {
    var offset = element.offset()
    return {
      left: pointer.left - offset.left,
      top: pointer.top - offset.top
    }
  }

  function sortByDistanceDesc(dimensions, pointer, lastPointer) {
    pointer = [pointer.left, pointer.top]
    lastPointer = lastPointer && [lastPointer.left, lastPointer.top]

    var dim,
    i = dimensions.length,
    distances = []

    while(i--){
      dim = dimensions[i]
      distances[i] = [i,d(dim,pointer), lastPointer && d(dim, lastPointer)]
    }
    distances = distances.sort(function  (a,b) {
      return b[1] - a[1] || b[2] - a[2] || b[0] - a[0]
    })

    // last entry is the closest
    return distances
  }

  function ContainerGroup(options) {
    this.options = $.extend({}, groupDefaults, options)
    this.containers = []

    if(!this.options.rootGroup){
      this.scrollProxy = $.proxy(this.scroll, this)
      this.dragProxy = $.proxy(this.drag, this)
      this.dropProxy = $.proxy(this.drop, this)
      this.placeholder = $(this.options.placeholder)

      if(!options.isValidTarget)
        this.options.isValidTarget = undefined
    }
  }

  ContainerGroup.get = function  (options) {
    if(!containerGroups[options.group]) {
      if(options.group === undefined)
        options.group = groupCounter ++

      containerGroups[options.group] = new ContainerGroup(options)
    }

    return containerGroups[options.group]
  }

  ContainerGroup.prototype = {
    dragInit: function  (e, itemContainer) {
      this.$document = $(itemContainer.el[0].ownerDocument)

      // get item to drag
      var closestItem = $(e.target).closest(this.options.itemSelector);
      // using the length of this item, prevents the plugin from being started if there is no handle being clicked on.
      // this may also be helpful in instantiating multidrag.
      if (closestItem.length) {
        this.item = closestItem;
        this.itemContainer = itemContainer;
        if (this.item.is(this.options.exclude) || !this.options.onMousedown(this.item, groupDefaults.onMousedown, e)) {
            return;
        }
        this.setPointer(e);
        this.toggleListeners('on');
        this.setupDelayTimer();
        this.dragInitDone = true;
      }
    },
    drag: function  (e) {
      if(!this.dragging){
        if(!this.distanceMet(e) || !this.delayMet)
          return

        this.options.onDragStart(this.item, this.itemContainer, groupDefaults.onDragStart, e)
        this.item.before(this.placeholder)
        this.dragging = true
      }

      this.setPointer(e)
      // place item under the cursor
      this.options.onDrag(this.item,
                          getRelativePosition(this.pointer, this.item.offsetParent()),
                          groupDefaults.onDrag,
                          e)

      var p = this.getPointer(e),
      box = this.sameResultBox,
      t = this.options.tolerance

      if(!box || box.top - t > p.top || box.bottom + t < p.top || box.left - t > p.left || box.right + t < p.left)
        if(!this.searchValidTarget()){
          this.placeholder.detach()
          this.lastAppendedItem = undefined
        }
    },
    drop: function  (e) {
      this.toggleListeners('off')

      this.dragInitDone = false

      if(this.dragging){
        // processing Drop, check if placeholder is detached
        if(this.placeholder.closest("html")[0]){
          this.placeholder.before(this.item).detach()
        } else {
          this.options.onCancel(this.item, this.itemContainer, groupDefaults.onCancel, e)
        }
        this.options.onDrop(this.item, this.getContainer(this.item), groupDefaults.onDrop, e)

        // cleanup
        this.clearDimensions()
        this.clearOffsetParent()
        this.lastAppendedItem = this.sameResultBox = undefined
        this.dragging = false
      }
    },
    searchValidTarget: function  (pointer, lastPointer) {
      if(!pointer){
        pointer = this.relativePointer || this.pointer
        lastPointer = this.lastRelativePointer || this.lastPointer
      }

      var distances = sortByDistanceDesc(this.getContainerDimensions(),
                                         pointer,
                                         lastPointer),
      i = distances.length

      while(i--){
        var index = distances[i][0],
        distance = distances[i][1]

        if(!distance || this.options.pullPlaceholder){
          var container = this.containers[index]
          if(!container.disabled){
            if(!this.$getOffsetParent()){
              var offsetParent = container.getItemOffsetParent()
              pointer = getRelativePosition(pointer, offsetParent)
              lastPointer = getRelativePosition(lastPointer, offsetParent)
            }
            if(container.searchValidTarget(pointer, lastPointer))
              return true
          }
        }
      }
      if(this.sameResultBox)
        this.sameResultBox = undefined
    },
    movePlaceholder: function  (container, item, method, sameResultBox) {
      var lastAppendedItem = this.lastAppendedItem
      if(!sameResultBox && lastAppendedItem && lastAppendedItem[0] === item[0])
        return;

      item[method](this.placeholder)
      this.lastAppendedItem = item
      this.sameResultBox = sameResultBox
      this.options.afterMove(this.placeholder, container, item)
    },
    getContainerDimensions: function  () {
      if(!this.containerDimensions)
        setDimensions(this.containers, this.containerDimensions = [], this.options.tolerance, !this.$getOffsetParent())
      return this.containerDimensions
    },
    getContainer: function  (element) {
      return element.closest(this.options.containerSelector).data(pluginName)
    },
    $getOffsetParent: function  () {
      if(this.offsetParent === undefined){
        var i = this.containers.length - 1,
        offsetParent = this.containers[i].getItemOffsetParent()

        if(!this.options.rootGroup){
          while(i--){
            if(offsetParent[0] != this.containers[i].getItemOffsetParent()[0]){
              // If every container has the same offset parent,
              // use position() which is relative to this parent,
              // otherwise use offset()
              // compare #setDimensions
              offsetParent = false
              break;
            }
          }
        }

        this.offsetParent = offsetParent
      }
      return this.offsetParent
    },
    setPointer: function (e) {
      var pointer = this.getPointer(e)

      if(this.$getOffsetParent()){
        var relativePointer = getRelativePosition(pointer, this.$getOffsetParent())
        this.lastRelativePointer = this.relativePointer
        this.relativePointer = relativePointer
      }

      this.lastPointer = this.pointer
      this.pointer = pointer
    },
    distanceMet: function (e) {
      var currentPointer = this.getPointer(e)
      return (Math.max(
        Math.abs(this.pointer.left - currentPointer.left),
        Math.abs(this.pointer.top - currentPointer.top)
      ) >= this.options.distance)
    },
    getPointer: function(e) {
      var o = e.originalEvent || e.originalEvent.touches && e.originalEvent.touches[0]
      return {
        left: e.pageX || o.pageX,
        top: e.pageY || o.pageY
      }
    },
    setupDelayTimer: function () {
      var that = this
      this.delayMet = !this.options.delay

      // init delay timer if needed
      if (!this.delayMet) {
        clearTimeout(this._mouseDelayTimer);
        this._mouseDelayTimer = setTimeout(function() {
          that.delayMet = true
        }, this.options.delay)
      }
    },
    scroll: function  (e) {
      this.clearDimensions()
      this.clearOffsetParent() // TODO is this needed?
    },
    toggleListeners: function (method) {
      var that = this,
      events = ['drag','drop','scroll']

      $.each(events,function  (i,event) {
        that.$document[method](eventNames[event], that[event + 'Proxy'])
      })
    },
    clearOffsetParent: function () {
      this.offsetParent = undefined
    },
    // Recursively clear container and item dimensions
    clearDimensions: function  () {
      this.traverse(function(object){
        object._clearDimensions()
      })
    },
    traverse: function(callback) {
      callback(this)
      var i = this.containers.length
      while(i--){
        this.containers[i].traverse(callback)
      }
    },
    _clearDimensions: function(){
      this.containerDimensions = undefined
    },
    _destroy: function () {
      containerGroups[this.options.group] = undefined
    }
  }

  function Container(element, options) {
    this.el = element
    this.options = $.extend( {}, containerDefaults, options)

    this.group = ContainerGroup.get(this.options)
    this.rootGroup = this.options.rootGroup || this.group
    this.handle = this.rootGroup.options.handle || this.rootGroup.options.itemSelector

    var itemPath = this.rootGroup.options.itemPath
    this.target = itemPath ? this.el.find(itemPath) : this.el

    this.target.on(eventNames.start, this.handle, $.proxy(this.dragInit, this))

    if(this.options.drop)
      this.group.containers.push(this)
  }

  Container.prototype = {
    dragInit: function  (e) {
      var rootGroup = this.rootGroup

      if( !this.disabled &&
          !rootGroup.dragInitDone &&
          this.options.drag &&
          this.isValidDrag(e)) {
        rootGroup.dragInit(e, this)
      }
    },
    isValidDrag: function(e) {
      return e.which == 1 ||
        e.type == "touchstart" && e.originalEvent.touches.length == 1
    },
    searchValidTarget: function  (pointer, lastPointer) {
      var distances = sortByDistanceDesc(this.getItemDimensions(),
                                         pointer,
                                         lastPointer),
      i = distances.length,
      rootGroup = this.rootGroup,
      validTarget = !rootGroup.options.isValidTarget ||
        rootGroup.options.isValidTarget(rootGroup.item, this)

      if(!i && validTarget){
        rootGroup.movePlaceholder(this, this.target, "append")
        return true
      } else
        while(i--){
          var index = distances[i][0],
          distance = distances[i][1]
          if(!distance && this.hasChildGroup(index)){
            var found = this.getContainerGroup(index).searchValidTarget(pointer, lastPointer)
            if(found)
              return true
          }
          else if(validTarget){
            this.movePlaceholder(index, pointer)
            return true
          }
        }
    },
    movePlaceholder: function  (index, pointer) {
      var item = $(this.items[index]),
      dim = this.itemDimensions[index],
      method = "after",
      width = item.outerWidth(),
      height = item.outerHeight(),
      offset = item.offset(),
      sameResultBox = {
        left: offset.left,
        right: offset.left + width,
        top: offset.top,
        bottom: offset.top + height
      }
      if(this.options.vertical){
        var yCenter = (dim[2] + dim[3]) / 2,
        inUpperHalf = pointer.top <= yCenter
        if(inUpperHalf){
          method = "before"
          sameResultBox.bottom -= height / 2
        } else
          sameResultBox.top += height / 2
      } else {
        var xCenter = (dim[0] + dim[1]) / 2,
        inLeftHalf = pointer.left <= xCenter
        if(inLeftHalf){
          method = "before"
          sameResultBox.right -= width / 2
        } else
          sameResultBox.left += width / 2
      }
      if(this.hasChildGroup(index))
        sameResultBox = emptyBox
      this.rootGroup.movePlaceholder(this, item, method, sameResultBox)
    },
    getItemDimensions: function  () {
      if(!this.itemDimensions){
        this.items = this.$getChildren(this.el, "item").filter(
          ":not(." + this.group.options.placeholderClass + ", ." + this.group.options.draggedClass + ")"
        ).get()
        setDimensions(this.items, this.itemDimensions = [], this.options.tolerance)
      }
      return this.itemDimensions
    },
    getItemOffsetParent: function  () {
      var offsetParent,
      el = this.el
      // Since el might be empty we have to check el itself and
      // can not do something like el.children().first().offsetParent()
      if(el.css("position") === "relative" || el.css("position") === "absolute"  || el.css("position") === "fixed")
        offsetParent = el
      else
        offsetParent = el.offsetParent()
      return offsetParent
    },
    hasChildGroup: function (index) {
      return this.options.nested && this.getContainerGroup(index)
    },
    getContainerGroup: function  (index) {
      var childGroup = $.data(this.items[index], subContainerKey)
      if( childGroup === undefined){
        var childContainers = this.$getChildren(this.items[index], "container")
        childGroup = false

        if(childContainers[0]){
          var options = $.extend({}, this.options, {
            rootGroup: this.rootGroup,
            group: groupCounter ++
          })
          childGroup = childContainers[pluginName](options).data(pluginName).group
        }
        $.data(this.items[index], subContainerKey, childGroup)
      }
      return childGroup
    },
    $getChildren: function (parent, type) {
      var options = this.rootGroup.options,
      path = options[type + "Path"],
      selector = options[type + "Selector"]

      parent = $(parent)
      if(path)
        parent = parent.find(path)

      return parent.children(selector)
    },
    _serialize: function (parent, isContainer) {
      var that = this,
      childType = isContainer ? "item" : "container",

      children = this.$getChildren(parent, childType).not(this.options.exclude).map(function () {
        return that._serialize($(this), !isContainer)
      }).get()

      return this.rootGroup.options.serialize(parent, children, isContainer)
    },
    traverse: function(callback) {
      $.each(this.items || [], function(item){
        var group = $.data(this, subContainerKey)
        if(group)
          group.traverse(callback)
      });

      callback(this)
    },
    _clearDimensions: function  () {
      this.itemDimensions = undefined
    },
    _destroy: function() {
      var that = this;

      this.target.off(eventNames.start, this.handle);
      this.el.removeData(pluginName)

      if(this.options.drop)
        this.group.containers = $.grep(this.group.containers, function(val){
          return val != that
        })

      $.each(this.items || [], function(){
        $.removeData(this, subContainerKey)
      })
    }
  }

  var API = {
    enable: function() {
      this.traverse(function(object){
        object.disabled = false
      })
    },
    disable: function (){
      this.traverse(function(object){
        object.disabled = true
      })
    },
    serialize: function () {
      return this._serialize(this.el, true)
    },
    refresh: function() {
      this.traverse(function(object){
        object._clearDimensions()
      })
    },
    destroy: function () {
      this.traverse(function(object){
        object._destroy();
      })
    }
  }

  $.extend(Container.prototype, API)

  /**
   * jQuery API
   *
   * Parameters are
   *   either options on init
   *   or a method name followed by arguments to pass to the method
   */
  $.fn[pluginName] = function(methodOrOptions) {
    var args = Array.prototype.slice.call(arguments, 1)

    return this.map(function(){
      var $t = $(this),
      object = $t.data(pluginName)

      if(object && API[methodOrOptions])
        return API[methodOrOptions].apply(object, args) || this
      else if(!object && (methodOrOptions === undefined ||
                          typeof methodOrOptions === "object"))
        $t.data(pluginName, new Container($t, methodOrOptions))

      return this
    });
  };

}(jQuery, window, 'sortable');
/*////////////////////////////////////////////////////////////drap drop js END///////////////////////////////////////////////// */
