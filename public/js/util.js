var globalTaskId,companyDefaultTimezone,userRoles;
$(document).ready(function(){
    initTimeHHMM();
    activePageLink();
    $(".open-date-pik").flatpickr({
        dateFormat: "Y-m-d"
    });
    $(".open-time-pik-24").flatpickr(
        {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true
        }
    );
    /*let tabText=$(".slds-nav-vertical__item.slds-is-active .side-nav-text").text().trim();
    if(tabText!="Timesheet"){
*/
    /*}*/
    /* following two functions help in navigation and loading appropriate views not tested on all browsers.*/
    handleHashLinks();
    bindDataNavigationEvent();
});

/* handle navigation when browser back and forward button navigation */
window.onhashchange = function() {
    handleHashLinks();
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
    // var today = new Date(gDate);
    // var dd = today.getDate();
    // var mm = today.getMonth() + 1; //January is 0!
    // var yyyy = today.getFullYear();
    // if (dd < 10) {
    //     dd = '0' + dd
    // }
    // if (mm < 10) {
    //     mm = '0' + mm
    // }
    // formatedDate = yyyy + '-' + mm + '-' + dd;
    let formatedDate = moment.tz(gDate, companyDefaultTimezone).format('YYYY-MM-DD');
    return formatedDate;
}

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
                                let dayTimeSheetData={'isRunning':true,'lastruntime':response.currentTime};
                                dayTimeSheetData.project_id = response.project.id;
                                dayTimeSheetData.task_id = globalTaskId;
                                dayTimeSheetData.day_time = '0:00:00';
                                var timesheet_date = response.currentDate;
                                dayTimeSheetData.timesheet_date = timesheet_date;
                                // var timesheet_date=dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
                                // dayTimeSheetData.timesheet_date = timesheet_date;
                                dayTimeSheetData.user_role = 'Manager';
                                console.log(dayTimeSheetData);
                                $.ajax({
                                    type: 'POST',
                                    url: '/addTimesheet',
                                    contentType: 'application/json',
                                    dataType: 'json',
                                    data: JSON.stringify(dayTimeSheetData),
                                    success: function (response) {
                                        console.log(response);
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

function getProjectTask(val, id) {
    console.log("Iddd:", id);
    if ($('option:selected', val).val() != '' && $('option:selected', val).val() != undefined && $('option:selected', val).val() != null) {
        $('#addTimesheetLoader').removeClass('hide');
        var projectName = $('option:selected', val).val();
        var projectId = $('option:selected', val).attr('pr_id');
        $.ajax({
            type: 'POST',
            url: '/getTaskList',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ "projectId": projectId }),
            success: function (response) {
                if (response.success == true) {
                    renderTask(response.tasks, id);
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
    $('#day-tabs').find('.slds-tabs_default__content:not(.hide)').find('.slds-p-around_x-small:last').after(timesheetRowHtml);
    /*$('#day-tabs').find('.slds-tabs_default__content').not('.hide').append(timesheetRowHtml);*/
}

function addTimeLogEntry(modalId,formId){
        let lineItemData = createJSONForFormData(formId);
        if ($('#globalProjectForTimesheet option:selected').val() == '' || $('#globalProjectForTimesheet option:selected').val() == null || $('#globalProjectForTimesheet option:selected').val() == undefined) {
            addError('#globalProjectForTimesheet', "Please select any project");
        } else {
            if ($('#globalTaskForTimesheet option:selected').val() == '' || $('#globalTaskForTimesheet option:selected').val() == null || $('#globalTaskForTimesheet option:selected').val() == undefined) {
                clearError('#globalProjectForTimesheet');
                addError('#globalTaskForTimesheet', "Please select any task");
            } else {
                showLoader('#globalLoader');
                lineItemData.task_id = $('#globalTaskForTimesheet option:selected').attr('task_id');
                lineItemData.project_id = $('#globalProjectForTimesheet option:selected').attr('pr_id');
                lineItemData.user_role = $('#globalUserRole option:selected').val();
                lineItemData.day_category = $('#globalTaskBill').is(':checked');
                // let line_item_date = dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
                let line_item_date=$("#logSubmittedDate").text();
                // let line_item_date = dateFormat(moment.tz(new Date(), 'America/Los_Angeles').format());
                lineItemData.timesheet_date = line_item_date;
                console.log(lineItemData);
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
                                if(currentDiv.attr('date')== dateFormat(moment.tz(new Date(), companyDefaultTimezone).format())){
                                    addRowToTimesheet(response.line_item);
                                    if(selectedEle!=null&&selectedEle!=undefined){
                                        intervalID = NaN;
                                        let currentLineItemId=$(selectedEle).attr('line_item_id');
                                        let updatedLineItem={"line_item_id":currentLineItemId,"lastRunTime":moment.tz(new Date(), companyDefaultTimezone).format('HH:mm:ss'),"isRunning":true};
                                        updateCurrentLineItem(updatedLineItem,(success,nores,err)=>{
                                            if(success==true){
                                                $(selectedEle).addClass('hide');
                                                $(selectedEle).next('[stop]').removeClass('hide');
                                                startKwTimerGlobal($("[name=globalStart]"));
                                                $("[name=globalStop]").removeClass('hide');
                                                if (isNaN(intervalID)){
                                                    intervalID = setInterval(function(){incrementTimeOfCount}, 1000);
                                                }
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
                                        timesheetRowData.lastruntime=((new Date()).toTimeString().split(' ')[0]);
                                        timesheetRowData.timesheet_date=dateFormat(new Date());
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
                                                    window.location.href='/timesheet/'+reqUserId+'#'+moment.tz(new Date(), companyDefaultTimezone).format('dddd').toLowerCase();
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

                }
            }

    }
function stopKwTimerWithLogEntry(lineItemId,ele, id, inputId, modalId){
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
                logSubmittedDate=dateFormat(moment.tz(new Date(), companyDefaultTimezone).format());
              }
              $("#logSubmittedDate").text(logSubmittedDate);
              $(inputId).val($($(id)[0]).text());
              $("[name=globalStop]").addClass('hide');
              // $("[name=globalStop]").css('display','none');
              $('[name=globalStart]').removeClass('hide');
              $(id).text('Start');
              openModal(modalId);
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
  let updatedHours=$("[name=kwTimer]").text();
  let lineItemData={"line_item_id":lineItemId,"updatedHours":updatedHours,"isRunning":false};
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
function stopKwTimerGlobally(ele, id, inputId, modalId) {
    // ele=$(ele).find("[stop-timer]");
    let eleToStart=$("#day-tabs");
    $.ajax({
        type: 'POST',
        url: '/getGlobalProject',
        contentType: 'application/json',
        success: function (response) {
            console.log(response);
            if (response.success == true) {
                hideLoader('#globalLoader');
                // $("[timerDiv]").on('click',function(){startKwTimerGlobally(this,'[name=kwTimer]')});
                globalTaskId = response.task.id;
                let lineItemTaskId=$("[name=kwTimer]").attr("lineItemTaskId");
                let lineItemId=$("[name=kwTimer]").attr("taskId");
                if(eleToStart.length>0){

                    if(lineItemTaskId==globalTaskId){
                        stopKwTimerWithLogEntry(lineItemId,ele, id, inputId, modalId);

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
                      stopKwTimerWithLogEntry(lineItemId,ele, id, inputId, modalId);

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
  $('[name=globalStart]').removeClass('hide');
  closeModal(modalId);
}
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}
/*------------Time formate HH:MM js END------------ */
