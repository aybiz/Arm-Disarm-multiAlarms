
//******************************************************************************
//******************************************************************************
//******************************************************************************
// AlarmData Class 
// with related unique methods

function HomeAlarm(id, home, home_location, phone_no, alarm_pin) {
	this.id		  		= id || "";
	this.home  			= home || ""; //nick name
	this.home_location  = home_location  || ""; //No need for full address
	this.phone_no   	= phone_no  || "";
	this.alarm_code  	= alarm_pin || "";




//Save method; 
//Inputs are:
//homeAlarm -  object with data
//navigateTo - destination to goto after save is complete
	this.saveAlarmData =  function(homeAlarm, navigateTo) {
		var homeAlarmKeyValue = objToKeyValue(homeAlarm);
		var id = homeAlarmKeyValue.id;
		delete homeAlarmKeyValue.id;
		var goTo = navigateTo || "#";

	 	db.open();
	 	//Check if name already exist
		db.homes.where("home").equalsIgnoreCase($("#home").val()).toArray(function(sameHomes){
			var sameHomeNoSameId = 0
			if(sameHomes.length > 0){
				for(var i = 0; i< sameHomes.length; i++) {
					if(sameHomes[i].id != Number($("#id").val())) {
						sameHomeNoSameId++; 
					}
				}
			} 
			//Same name already exist. Alert the user
			if(sameHomeNoSameId >0){ 
				SameNameAlert();
			} else {  //New name, proceed with Add or Update
				if(homeAlarm.id == "") {
					//Add
					db.homes.put(homeAlarmKeyValue)
					.then(function() {
						toastMsg = "New Home Alarm '" + homeAlarmKeyValue.home + "' added.";
						$(':mobile-pagecontainer').pagecontainer("change", goTo);
					});
				//Update
				} else if (homeAlarm.id != "" && isInt(homeAlarm.id)) {
					db.homes.update(id, homeAlarmKeyValue)
					.then(function() {
						toastMsg = "'" + homeAlarmKeyValue.home + "' Alarm has been been updated.";
						$(':mobile-pagecontainer').pagecontainer("change", goTo);
					});
				};
			}
		})

	};
	



//*************************************
// Lists for Managing Alarms all available Home Alarms names in the database

	this.listHomeAlarms =  function() {
		$('#homes_list').empty();
		db.open();
		db.homes.count(function(count){
			if(count > 0){
				db.homes.orderBy('home').each(function (alarm) {
					$("#homes_list").append("<li id='homes_list" + alarm.id + "'><a class='ui-btn ui-btn-icon-right ui-icon-carat-r'  data-rel='popup' href='#homes_list_context_menu' >" + alarm.home + "</a></li>");
				});
			} else {
				$("#homes_list").append(
					"<li id='homes_list9998><a class='ui-btn ui-btn-icon-right ui-icon-carat-r' href='#'>No Home Alarms to list.</br>Press the Add New button below to add new Alarm.</a></li>");
			}
		}).finally(function() {
			$('#homes_list').listview('refresh');
		});
	};

//*************************************
// Lists for Arm/Disarm selection all available Alarms names in the database
	this.listAlarms =  function() {
		$('#alarms_lst').empty();
		db.open();
		db.homes.count(function(count){
			if(count > 0){
				db.homes.orderBy('home').each(function (alarm) {
					$("#alarms_lst").append("<li id='alarms_lst" + alarm.id + "'><a class='ui-btn ui-btn-icon-right ui-icon-carat-r'  data-rel='popup' href='#homes_list_context_menu' >" + alarm.home + "</a></li>");
				});
			} else {
				$("#alarms_lst").append(
					"<li id='list_alarms9999><a class='ui-btn ui-btn-icon-right ui-icon-carat-r' href='#'>No Home Alarms to list.</br>Enter code manually or add new Alarm.</a></li>");
			}
		}).finally(function() {
			$('#alarms_lst').listview('refresh');
		});
	};


	//Displays Alarm details - found by id
	this.displayHomeAlarm =  function(id) {
		db.open();
		db.homes.get(id, function (result) {
			home_alarm_record = result;
			$('#home_view').empty();
			$("#home_view").append(
			"<li><p>Home Nick Name:</p><H2>" + result.home + "</h2></li>" +
			"<li><p>Home Location:</p><H2>" + result.home_location + "</h2></li>" +
			"<li><p>Alarm Phone Number:</p><H2>" + result.phone_no + "</h2></li>"
			);
			if(saveCodeFlg === "yes") {
				$("#home_view").append(
					"<li><p id='alarm_code' class='view_labels'>Alarm PIN:</p><H2 id='pin'>****</H2></li>"
				);
			}
		}).finally(function() {
			//db.close(); // Close database before connection goes out of scope.
			$('#home_view').listview('refresh');
		});
	}

	//Populate form with existing Trading Company details
	this.populateHomeAlarmEditForm =  function(id) {
		var homeAlarm = new HomeAlarm();
		//If ID is "" than this is a new record
		if(id == "") { 				
			$("#home_alarm_form_header").html("Home Alarm New");
			$('#home_alarm_del_at_edit a').remove();
			$('#add_new_home3').remove();
			homeAlarm.fillFormFromHomeAlarmObj(new HomeAlarm());
		} else { 					
			//If ID exist than this is a record for editing
			$("#home_alarm_form_header").html("Home Alarm Edit");
			db.open();
			db.homes.get(id, function (result) {
				home_alarm_record = result;
				homeAlarm.fillFormFromHomeAlarmObj(result);
			});
		}
	}


	//function to fill in data from trade business object to the Form
	this.fillFormFromHomeAlarmObj = function(homeAlarm) {
		//enable or disable the alarm_code field based on the saveCode flag
		$("input[name=alarm_code]").prop("disabled", false);
		$("input[name=alarm_code]").attr("placeholder", "");
		if (saveCodeFlg === "no") {
			$("input[name=alarm_code]").prop("disabled", true);
			$("input[name=alarm_code]").attr("placeholder", "Storing Alarm code is Disabled!");
		};

		for (var key in homeAlarm) {
			if(typeof homeAlarm[key] != "function") {
				$("form[name='home_alarm_form'] input[name='" + key + "']").val(homeAlarm[key]);
			}
		}
		$("#home" ).focus();
	}


	//Confirm and Delete Home Alarm
	this.confirmAndDeleteHome = function() {
		$.confirm({
		    title: 'Confirm delete!',
		    content: "Are you sure you want to Delete Home Alarm - '" + home_alarm_record.home + "' ?",
		    buttons: {
		        confirm: function () {
		           	db.open();
					db.homes.delete(home_alarm_record.id, function (result) {
					}).then(function() {
						toastMsg = "'" + home_alarm_record.home + "' Alarm has been Deleted.";
						home_alarm_record= "";
						$(':mobile-pagecontainer').pagecontainer("change", "#manageAlarms");
					});
		        },
		        cancel: function () {
		            //$.alert('Canceled!');
		        },
		    }
		});

	}

	//Fetches all input data from the form and update record if id != "" or add new record if id == ""
	this.submitProcessHomeAlarmForm = function(homeAlarm) {
		//updating object variables with inputs from the Form
		for (var key in homeAlarm){
			if(typeof homeAlarm[key] != "function") {
				var element = $('#'+key);
				if(element.is("select")) {
					homeAlarm[key] = $("form[name='home_alarm_form'] select[name='" + key + "']").val();
				} else {
					homeAlarm[key] = $("form[name='home_alarm_form'] input[name='" + key + "']").val();
				}
			}
		}
		return homeAlarm;
	}

	//Retreive Param Value from "settings" table
	this.getHomeById =  function(id) {
		db.open();
		db.homes.get(id, function (result) {
			home_alarm_record = result;
		});
	}

	//Delete Alarm Codes from table. 
	//Used when user selected NOT to store the codes in the database
	this.DeleteAllAlarmCodes = function() {
		$.confirm({
		    title: 'Confirm Alarm Code delete!',
		    content: "You have selected that Alarm Codes shouldn't be stored on this device." +
		    	"Please press the Confrim button to proceed with deleting all Alarm codes from all recorded homes on this device.",
		    buttons: {
		        confirm: function () {
		           	db.open();
		           	db.homes.where("home").notEqual("").modify({alarm_code: ""})
		           	.then(function() {
						toastMsg = "All Codes were Deleted.";
						$(':mobile-pagecontainer').pagecontainer("change", "#manageAlarms");
					});
		        },
		        cancel: function () {
		            //$.alert('Canceled!');
		        },
		    }
		});
	}

}






//******************************************************************************
//******************************************************************************


//******************************************************************************
//******************************************************************************
//******************************************************************************
// AlarmData Settings 
// with related unique methods

function SettingParam(id, param_name, value, text) {
	this.id		  	= id || "";
	this.param_name = param_name || ""; //Name of parameter
	this.value  	= value  || ""; //Parameter value
	this.text  		= text  || ""; //Parameter text string to be used for messages to user


//initiate parameters
	this.initiateParams =  function() {
		var paramKeyValue = {};

		db.open();
		db.settings.where("param_name").equals("save_code").count(function(count){
			if(count == 0){
				//create "save_flag" parameter - Save? or don't save?
				paramKeyValue["param_name"] =  "save_code";
				paramKeyValue["value"] =  "no";
				paramKeyValue["text"] =  "Save Code option";
				
				db.settings.put(paramKeyValue); //new db record will be created with own id
			} 

			db.settings.where("param_name").equals("save_code").each(function (para) {
				saveCodeFlg = para.value;
				saveCodeObj = para;
			});
		});

		//Alarm Status confirmation flag = Want? or don't want?
		db.settings.where("param_name").equals("expect_alarm_confirm").count(function(count){
			if(count == 0){
				//create "save_flag" parameter
				paramKeyValue["param_name"] =  "expect_alarm_confirm";
				paramKeyValue["value"] =  "no";
				paramKeyValue["text"] =  "Wait for Alarm Status confirmation";
				
				db.settings.put(paramKeyValue); //new db record will be created with own id
			} 
			db.settings.where("param_name").equals("expect_alarm_confirm").each(function (para) {
				expectAlarmConfirmFlg = para.value;
				expectAlarmConfirmObj = para;
			});
		});
	}



	//Save method; 
	//Inputs are:
	//action with "add" or "update"
	//Settings Param -  object with data
	this.saveSettingData =  function(action, param) {
		paramKeyValue = objToKeyValue (param)
		if(action == "add") {
			db.open();
			db.settings.put(paramKeyValue);
		} else if (action == "update") {
			var id = paramKeyValue.id;
			delete paramKeyValue.id;
			db.open();
			db.settings.update(id, paramKeyValue)
			.then(function() {
				toast(paramKeyValue.text + " Updated to '" + paramKeyValue.value + "'");
			});
		};
	};


	//Retreive Param Value from "settings" table
	this.getParamByName =  function(param) {
		db.open();
		db.settings.where("param").equals(param).count(function(count){
			if(count > 0){
				db.settings.where("param").equals(param).each(function (para) {
					saveCodeFlg = para.value;
				});
			} else {
				saveCodeFlg = "no";
			}
		});
	}

}
