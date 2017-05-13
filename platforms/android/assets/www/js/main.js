// JavaScript Document


//set a key value array for data transfer between Div pages
var home_del = 0;
var home_alarm_record = "";
var home_list_li_id = 0;
var alarmPhoneNo = "";
var alarm_action = "";
var alarm_pin = "";
var toastMsg = "";
var saveCodeFlg = "no";
var saveCodeObj = {};
var expectAlarmConfirmFlg = "no";
var expectAlarmConfirmObj = {};
var waitForSMSTimeOut
var smsSentFlg = "no";


$(window).width()

var db = new Dexie("HomeAlarms");


// $(window).load(function() {
//   	if(! window.device) {
//    		onDeviceReady();
// 	} else {
		document.addEventListener('deviceready', onDeviceReady, false);
// 	}
// });




	
function onDeviceReady() {



// if (!SMS) { 
// 	alert( 'SMS plugin not ready' ); 
// } else {
// 	alert( 'We have SMS' );
// }

	//Using InexedDB

	db.version(1).stores({
		homes: "++id, home",
		settings: "++id, param_name"
	});

	//setting parameter/s for the first time (if needed)
	var settingParam = new SettingParam();
	settingParam.initiateParams();

	//*********************************************
	//prevent default function of Back button
	document.addEventListener("backbutton", onBackKeyDown, false);

	function onBackKeyDown(e) {
	  e.preventDefault();
	}


	//*********************************************
	//Exit the App
	$(document).off("tap", "#exitApp").on("tap", "#exitApp", function (e) {
		if (navigator.app) {
			navigator.app.exitApp();
		}
		else if (navigator.device) {
		  	navigator.device.exitApp();
		}
		else {
		    window.close();
		}
	});
	//*********************************************

//***********************************************************************************************
//***********  Alarms  **************************************************************


	//Check if SMS was sent to Alarm and wiat (or not) for a confirmation SMS
	$(document).off("pagebeforeshow", "#mainPage").on("pagebeforeshow", "#mainPage", function() {
		if(smsSentFlg === "yes") {
			if(expectAlarmConfirmFlg == "yes") {
			    SMS.startWatch(function(){}, function(){});
			    window.plugins.spinnerDialog.show("Waiting...","Wait for Alarm Status confirmation", true);
			    waitForSMSTimeOut = setTimeout(function(){
			    	window.plugins.spinnerDialog.hide();
			    	$.alert({
					    title: 'No Response from Alarm System!',
					    content: "There was no response from the Alarm System. " + 
					    	"Your command should have been received but may not be programmed to reply to your mobile number.",
					});
			    }, 15000);
			    //SMS.enableIntercept(true, function(){}, function(){});
			} else {
				$.alert({
				    title: 'Message to Alarm System!',
				    content: alarm_action + " command was sent to the Alarm System.",
				});
			}
		}
		smsSentFlg = "no";
	});

	//*********************************************
	//Wait to receive SMS from Alarm
    document.addEventListener('onSMSArrive', function(e){
    	var data = e.data;
    	//alert(data.address);
    	if (data.address == "+61416236008") {
	    	window.plugins.spinnerDialog.hide(); //Stop Spinner
	    	clearTimeout(waitForSMSTimeOut); // Stop Time out task
	    	$.alert({
			    title: 'Response from Alarm!',
			    content: "SUCCESS from " + data.address + "!!!\n" + 
			    	"Alarm System has been " + data.body,
			});
    	}
    });


	//*********************************************


	//tap to Arm the alarm. Checks for saveCode flag and goes to enter alarm PIN or retrieve PIN
	$(document).off("tap", "#arm_btn").on("tap", "#arm_btn", function (e) {
		alarm_action = $(this).attr("name");
		findAlarmCode();
	});

	//tap to Disarm the alarm. Checks for saveCode flag and goes to enter alarm PIN or retrieve PIN
	$(document).off("tap", "#disarm_btn").on("tap", "#disarm_btn", function (e) {
		alarm_action = $(this).attr("name");
		findAlarmCode();
	});


	//After alarm_action has been determined above, need to find alarm code by directing to 
	//memory retrieve or from keypad entry
	function findAlarmCode() {
		if (saveCodeFlg === "yes") {
			//list available Alarms in memory and select one
			$(':mobile-pagecontainer').pagecontainer("change", "#listAlarms");
		} else {
			//key in the alarm code manually
			toastMsg = "No Alarm codes in memory. Please use keypad to enter your Alarm Code.";
			$(':mobile-pagecontainer').pagecontainer("change", "#enterPin");
		}
	}

	//List available alarms to select which code to retrieve and send to Alarm system
	$(document).off("pagebeforeshow", "#listAlarms").on("pagebeforeshow", "#listAlarms", function() {
		var homeAlarm = new HomeAlarm();
		homeAlarm.listAlarms();
	});

	//Recording the Home Alarm code on Tap of the Alram list name. 
	$(document).off("tap", "#alarms_lst li").on("tap", "#alarms_lst li", function(e) {
		var alarm_id = Number($(this).attr("id").substr(10)); //leave only the DB record ID at the end of the field id string
		//Home alarm data will be stored in home_alarm_record
		db.open();
		db.homes.get(alarm_id, function (result) {
			home_alarm_record = result;
			alarmPhoneNo = home_alarm_record.phone_no;
		}).then(function() {
			if(isNaN(home_alarm_record.alarm_code) || (home_alarm_record.alarm_code == "")) {
				toastMsg = "No code available for this alarm. Please use keypad to enter your Alarm Code.";
				$(':mobile-pagecontainer').pagecontainer("change", "#enterPin");
			} else {
				alarm_pin = home_alarm_record.alarm_code;

				//Construct SMS string and send SMS
			    sendSMS(); 
			}
		});


	});

	function sendSMS() {
	    var sendTo = alarmPhoneNo.trim();
	    var textMsg = alarm_pin.trim() + alarm_action.trim();
	    //if(SMS)SMS.sendSMS(sendTo, textMsg, function(){}, function(str){alert(str);});
	    alert(sendTo +  " - "  + textMsg);
		clearSMSData()
		smsSentFlg = "yes";
		$(':mobile-pagecontainer').pagecontainer("change", "#mainPage");
	}

	function clearSMSData() {
	    alarmPhoneNo = "";
	    alarm_pin = "";
	    alarm_action = "";
	}

//***************** check all above new code
//*************************************************************************
//*************************************************************************



	$(document).off("pagebeforeshow", "#alarm_settings").on("pagebeforeshow", "#alarm_settings", function() {	
		if(saveCodeFlg === "yes") {
			$("#code_save_radio_yes").attr("checked",true).checkboxradio("refresh");
			$("#code_save_radio_no").attr("checked",false).checkboxradio("refresh");
		} else {
			$("#code_save_radio_yes").attr("checked",false).checkboxradio("refresh");
			$("#code_save_radio_no").attr("checked",true).checkboxradio("refresh");
		}
		
		if(expectAlarmConfirmFlg === "yes") {
			$("#expect_alarm_confirm_yes").attr("checked",true).checkboxradio("refresh");
			$("#expect_alarm_confirm_no").attr("checked",false).checkboxradio("refresh");
		} else {
			$("#expect_alarm_confirm_yes").attr("checked",false).checkboxradio("refresh");
			$("#expect_alarm_confirm_no").attr("checked",true).checkboxradio("refresh");
		}
		toast(toastMsg);
		toastMsg = "";
	});


	
	//Create List View to show existing Home Alarms
	$(document).off("pagebeforeshow", "#manageAlarms").on("pagebeforeshow", "#manageAlarms", function() {
		var homeAlarm = new HomeAlarm();
		homeAlarm.listHomeAlarms();
		home_alarm_record = "";
		toast(toastMsg);
		toastMsg = "";
	});

	
	//Change of SaveCodeFlg status
	$("input[name='code_save_radio']").bind('change', function() {
		if(saveCodeFlg != $(this).val()) {
		 	var homeAlarm = new HomeAlarm();
			var storeCodeSliderParam = new SettingParam(saveCodeObj.id, "save_code", $(this).val(), saveCodeObj.text);
		    storeCodeSliderParam.saveSettingData("update", storeCodeSliderParam);
		    saveCodeFlg = $(this).val();
		    if(saveCodeFlg === "no") {
		    	homeAlarm.DeleteAllAlarmCodes();
			}
		}
	});

	//Change of expectAlarmConfirmFlg status
	$("input[name='expect_alarm_confirm_radio']").bind('change', function() {
		var expectAlarmConfirmSliderParam = new SettingParam(expectAlarmConfirmObj.id, "expect_alarm_confirm", $(this).val(), expectAlarmConfirmObj.text);
	    expectAlarmConfirmSliderParam.saveSettingData("update", expectAlarmConfirmSliderParam);
	    expectAlarmConfirmFlg = $(this).val();
	});

	//Recording the Home Alarm record ID on Tap of a Home Alram list name. 
	//This ID will be used in Vew, Edit or Delete options on the Popup menu
	$(document).off("tap", "#homes_list li").on("tap", "#homes_list li", function(e) {
		home_list_li_id = Number($(this).attr("id").substr(10)); //leave only the DB record ID at the end of the field id string
	});


	//Display the selected Alarm details
	$(document).off("pagebeforeshow", "#home_alarm_settings_view").on("pagebeforeshow", "#home_alarm_settings_view", function() {
		var homeAlarm = new HomeAlarm();
		homeAlarm.displayHomeAlarm(home_list_li_id);
	});




	$(document).off("pagebeforeshow", "#home_alarm_settings_edit").on("pagebeforeshow", "#home_alarm_settings_edit", function() {
		var homeAlarm = new HomeAlarm();
		homeAlarm.populateHomeAlarmEditForm(home_list_li_id);
	});

	//Change on Home Alarm Name field in Add new alarm form
	//Check if name already exist (ignore case)
	$("#home_alarm_form #home").focusout(function() {
	 	//var homeAlarm = new HomeAlarm();
	 	var homeVal = $("#home_alarm_form #home").val();
	 	if(homeVal!="") {  //Skip if home form field is empty
		 	db.open();
			db.homes.where("home").equalsIgnoreCase(homeVal).toArray(function(sameHomes){
				var sameHomeNoSameId = 0
				if(sameHomes.length > 0){
					for(var i = 0; i< sameHomes.length; i++) {
						if(sameHomes[i].id != Number($("#id").val())) {
							sameHomeNoSameId++; 
						}
					}
				} 
				if(sameHomeNoSameId >0){
					SameNameAlert();
				}
			});
		}
	});

	//Will prevent from focusout from firing when navigating out from Editing
	$(document).off("tap", "#back_btn_edit").on("tap", "#back_btn_edit", function() {
		//Clear Home field in the Form
		$("form[name='home_alarm_form'] input[name='home']").val("");
	});
	

	//Add new Trading business - Tap on Add new button/s to add new trading business (button outside of form itself)
	$(document).off("tap", "#add_new_home1, #add_new_home2").on("tap", "#add_new_home1, #add_new_home2", function (e) {
		home_list_li_id = ""; //New record so no ID exist yet
	});


	//Delete Home Alarm from View screen
	$(document).on("tap", "#home_del", function (e) {
			var homeAlarm = new HomeAlarm();
			homeAlarm.confirmAndDeleteHome(); // Delete confirmation and delete (or Cancel)
	});

	

//**********************************************************
	//Home Alarm Form Validation and Form processing

	$.validator.addMethod('phoneNumber', function (value) { 
	    return /^\+[1-9]{1}[0-9]{6,14}$/.test(value); 
	}, 'Please enter a valid mobile number including (+) and country code.');


	$("#home_alarm_form").validate({
		rules: {
			home: {
				required: true,
				minlength: 3
			},
			phone_no: {
				phoneNumber: true
			},
			alarm_code: {
				required: false,
				number: true,
				minlength: 4,
				maxlength: 4
			}
		},
		messages: {
			home: {
				required: "Please enter Alarm name.",
				minlength: "Must be at least 3 characters."
			},
			phone_no: {
				required: "Please enter the Alarm Phone No (i.e. +61409587458)."
			},
			alarm_code: {
				number: "Must be 4 numbers.",
				minlength: "Must be 4 numbers.",
				maxlength: "Must be 4 numbers."
			}
		},
		//},
		errorPlacement: function (error, element) {
			error.appendTo(element.parent().prev());
		},
		submitHandler: function(form) {
	      	var homeAlarm = new HomeAlarm();
			homeAlarm = homeAlarm.submitProcessHomeAlarmForm(homeAlarm);
			homeAlarm.saveAlarmData(homeAlarm, "#manageAlarms");
	    }
	});



	// off and on is to prevent firing the procedure more than once
	$(document).off("pagebeforeshow", "#initialize_DB").on("pagebeforeshow", "#initialize_DB", function(e){
		dataToTables();
	});


	//*****************************
	//Numeric Pad

    $(document).off("pagebeforeshow", "#enterPin").on("pagebeforeshow", "#enterPin", function() {
      	$('#keypad #n_keypad').show();
      	toast(toastMsg, 1500);
		toastMsg = "";
    });

      $('#keypad .done').off("tap").on("tap", function(evt) {
          	$('#n_keypad').hide('fast');
          	alarm_pin = $('#myInput').val();

          	//Construct SMS string and send SMS
			sendSMS(); 
      });

      $("#keypad .numero").off("tap").on("tap", function(evt) {
        if (!isNaN($('#myInput').val())) {
           if (parseInt($('#myInput').val()) == 0) {
             $('#myInput').val($(this).text());
           } else {
             $('#myInput').val($('#myInput').val() + $(this).text());
           }
        }
      });

      $('#keypad .neg').off("tap").on("tap", function(evt) {
          if (!isNaN($('#myInput').val()) && $('#myInput').val().length > 0) {
            if (parseInt($('#myInput').val()) > 0) {
              $('#myInput').val(parseInt($('#myInput').val()) - 1);
            }
          }
      });

      $('#keypad .pos').off("tap").on("tap", function(evt) {
          if (!isNaN($('#myInput').val()) && $('#myInput').val().length > 0) {
            $('#myInput').val(parseInt($('#myInput').val()) + 1);
          }
      });

      $('#keypad .del').off("tap").on("tap", function(evt) {
          $('#myInput').val($('#myInput').val().substring(0,$('#myInput').val().length - 1));
      });

      $('#keypad .clear').off("tap").on("tap", function(evt) {
          $('#myInput').val('');
      });

      $('#keypad .zero').off("tap").on("tap", function(evt) {
        if (!isNaN($('#myInput').val())) {
          if (parseInt($('#myInput').val()) != 0) {
            $('#myInput').val($('#myInput').val() + $(this).text());
          }
        }
      });
     //End of Numeric Pad
    //*****************************

//******************************************************************************
//***********  End of Home Alarms  **************************************
//******************************************************************************

};


//Prepare the object data to have only data (no methods or etc.)
function objToKeyValue (obj) {
	var object = {};
	for (key in obj) {
		if (typeof obj[key] != "function") {
			if (key == "id") {  // no need for id data when adding new record "add"
				object[key] = Number(obj[key]);
			} else if (key != "id") {
				object[key] = obj[key];
			}
		}
	}
	return object;
}

//***********************************************
//create a toast notification that fades out
function toast(message, delay) {
	this.delay = delay || 400;

	if(message != "") {
	    var $toast = $('<div class="ui-loader ui-overlay-shadow ui-body-e ui-corner-all"><p5>' + message + '</p5></div>');

	    $toast.css({
	        display: 'block',
	        background: '#E5E1DC',
	        opacity: 0.90, 
	        position: 'fixed',
	        padding: '7px',
	        'text-align': 'center',
	        width: '300px',
	        left: ($(window).width() - 284) / 2,
	        top: $(window).height() / 2 - 20
	    });

	    var removeToast = function(){
	        $(this).remove();
	    };

	    $toast.click(removeToast);

	    $toast.appendTo($.mobile.pageContainer).delay(this.delay);
	    $toast.fadeOut(this.delay, removeToast);
	}
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}


SameNameAlert =  function() {
	$("#home_alarm_form #home").focus();
	$.alert({
	    title: 'Duplication Alert!',
	    content: "'" + $("#home_alarm_form #home").val() + "'" + " alarm already exists. Use another name or " + 
	    	" Edit the existing " + "'" + $("#home_alarm_form #home").val() + "'" + " alarm.",
	});
	$("#home_alarm_form #home").val("");
}


