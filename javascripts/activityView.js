$(document).ready(function() {
	resetAlerts();
});

var resetAlerts = function() {
    $('#CreationSuccess').hide();
    $('#CreationFail').hide();
    $('#AlreadyExists').hide();
	$('#EditSuccess').hide();
    $('#EditFail').hide();
	$('#DeleteConfirmDialog').hide();
}

// Variables to reference the charts
var stepsChart;
var stepData;
var heartRateChart;
var heartRateData;
var globalStepAvg;

var dataMap = { };

var stepChartOptions = {
	hAxis: { title: 'Date' },
	vAxis: { title: 'Steps' },
	selectionMode: 'single',
	colors: ['blue', 'black']
};
	
var heartRateChartOptions = {
	hAxis: { title: 'Date' },
	vAxis: { title: 'Heart Rate (bpm)' },
	seriesType: 'bars',
	series: {2: {type: 'line'}},
	selectionMode: 'single'
};

// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(initControls);

// Loads activities for a specified date range for the current user and draws the charts
function loadChartData() {
	// Validate input
	var startDate = $('#StartDate').val();
	var endDate = $('#EndDate').val();
	
	// Grab activity data
	if(startDate != '' && endDate != '') {
		$.ajax({
            url: '/api/users/' + window.base.user._id + '/activities',
            type: 'GET',
            data: {
                'startDate': startDate,
                'endDate': endDate
            },
            success: function(data) {
				// Load up global stats (all user step average)
				$.ajax({
					url: '/api/stats',
					type: 'GET',
					success: function(globalStats) {
						// Create charts
						deleteChartData();
						drawCharts(data, globalStats, window.utils.toISODate(startDate), window.utils.toISODate(endDate));
					}
				});
            }
        });
	}
}

// Clears out the data for the charts
function deleteChartData() {
	$('#StepsChart').empty();
	$('#HeartrateChart').empty();
	$('#MissingDates .buttonsContainer').html('');
	$('#MissingDates').hide();
}

// Loads a single activity for the current user and shows it in a form
function fetchSingleDate() {
	// Validate input
	var queryDate = $('#QueryDate').val();
	// Query for Activity Data
	if(queryDate) {
		$.ajax({
            url: '/api/users/' + window.base.user._id + '/activities',
            type: 'GET',
            data: {
                'date': queryDate
            },
            success: function(result) {
                // Show edit activity view
				deleteChartData();
				setupActivityEdit(result);
            }
        });
	}
}

// Loads up every activity for the current user and draws the charts
function fetchAllDates() {
	$.ajax({
		url: '/api/users/' + window.base.user._id + '/activities',
		type: 'GET',
		success: function(data) {
			// Load up global stats (all user step average)
			$.ajax({
				url: '/api/stats',
				type: 'GET',
				success: function(globalStats) {
					// Create charts and reset missing dates
					deleteChartData();
					drawCharts(data, globalStats);
				}
			});
		}
	});
}

// Finds and returns the index of a datatable element containing a record associated with the specified id
function getTableRowIndexById(id, datatable) {
	for (i = 0; i <= datatable.getNumberOfRows(); i++) {
		if(datatable.getRowProperty(i, 'id') == id) {
			return i;
			break;
		}
	}
}

// Initializes the create form
function setupActivityCreate(date) {
	$('#CreateDateText').text(date.toDateString());
	$('#CreateDate').val(date.toLocaleDateString());
	$('#CreateMinHeartRate').val('');
	$('#CreateMaxHeartRate').val('');
	$('#CreateAvgHeartRate').val('');
	$('#CreateSteps').val('');
	$('#ActivityCreate').fadeIn();
	hideEditView();
}

// Initializes the edit form
function setupActivityEdit(activity) {
	$('#DeleteConfirmDialog').hide();
	$('#ActivityDelete').show();
	
	$('#ActivityId').val(activity._id);
	$('#ActivityDate').text(window.utils.toISODate(activity.date).toDateString());
	$('#ActivityMinHeartRate').val(activity.minHeartRate);
	$('#ActivityMaxHeartRate').val(activity.maxHeartRate);
	$('#ActivityAvgHeartRate').val(activity.avgHeartRate);
	$('#ActivitySteps').val(activity.steps);
	$('#ActivityEdit').fadeIn();
	hideCreateView();
}

// Hides the edit form from view
function hideEditView() {
	$('#ActivityId').val('');
	$('#ActivityDate').text('');
	$('#ActivityMinHeartRate').val('');
	$('#ActivityMaxHeartRate').val('');
	$('#ActivityAvgHeartRate').val('');
	$('#ActivitySteps').val('');
	$('#ActivityEdit').fadeOut();
}

// Hides the create form from view
function hideCreateView() {
	$('#CreateDateText').text('');
	$('#CreateDate').val('');
	$('#CreateMinHeartRate').val('');
	$('#CreateMaxHeartRate').val('');
	$('#CreateAvgHeartRate').val('');
	$('#CreateSteps').val('');
	$('#ActivityCreate').fadeOut();
}

// Creates a new activity using the data currently entered into the create form
function createActivity() {
	var newActivity = { };
	newActivity.date = window.utils.toISODate($('#CreateDate').val());
	newActivity.minHeartRate = Number($('#CreateMinHeartRate').val());
	newActivity.maxHeartRate = Number($('#CreateMaxHeartRate').val());
	newActivity.avgHeartRate = Number($('#CreateAvgHeartRate').val());
	newActivity.steps = Number($('#CreateSteps').val());
	
	$.ajax({
		url: '/api/users/' + window.base.user._id + '/activities',
		type: 'POST',
		data: newActivity,
		success: function(result) {
			// Clear selections and add to datamap
			heartRateChart.setSelection([]);
			stepsChart.setSelection([]);
			dataMap[result._id] = result;
			
			var oDate = window.utils.toISODate(result.date);
			
			// Add data to chart DataTables
			var stepRowIndex = stepData.addRow([oDate, result.steps, globalStepAvg]);
			var heartRateRowIndex = heartRateData.addRow([oDate, result.minHeartRate, result.maxHeartRate, result.avgHeartRate]); 
			
			// Store id with each record
			stepData.setRowProperty(stepRowIndex, 'id', result._id);
			heartRateData.setRowProperty(heartRateRowIndex, 'id', result._id);
			
			// Sort data by date column
			stepData.sort({column: 0, desc: true});
			heartRateData.sort({column: 0, desc: true});
			
			// Redraw charts
			stepsChart.draw(stepData, stepChartOptions);
			heartRateChart.draw(heartRateData, heartRateChartOptions);
			
			// Remove missing date button
			$('.btn-missing-date:contains("' + oDate.toDateString() + '")').remove();
			if($('#MissingDates .buttonsContainer').children().length < 1) {
				$('#MissingDates').hide();
			}

			resetAlerts();
			hideCreateView();
		},
		error: function(xhr, ajaxOptions, thrownError) {
			if(xhr.status == 500) {
				$('#CreationFail').show();
			}
		}
	});
}

// Saves the activity currently loaded into the edit form
function saveActivity() {
	var activityId = $('#ActivityId').val();
	var activity = $.extend( { }, dataMap[activityId] );
	activity.minHeartRate = Number($('#ActivityMinHeartRate').val());
	activity.maxHeartRate = Number($('#ActivityMaxHeartRate').val());
	activity.avgHeartRate = Number($('#ActivityAvgHeartRate').val());
	activity.steps = Number($('#ActivitySteps').val());
	
	$.ajax({
		url: '/api/users/' + window.base.user._id + '/activities/' + activityId,
		type: 'POST',
		data: activity,
		success: function(result) {
			// Clear selections and update datamap
			heartRateChart.setSelection([]);
			stepsChart.setSelection([]);
			dataMap[activityId] = activity;
			
			// Update steps chart
			var stepsRowIndex = getTableRowIndexById(activityId, stepData);
			stepData.setValue(stepsRowIndex, 1, activity.steps);
			stepsChart.draw(stepData, stepChartOptions);
			
			// Update heartrate chart
			var heartRateRowIndex = getTableRowIndexById(activityId, heartRateData);
			heartRateData.setValue(heartRateRowIndex, 1, activity.minHeartRate);
			heartRateData.setValue(heartRateRowIndex, 2, activity.maxHeartRate);
			heartRateData.setValue(heartRateRowIndex, 3, activity.avgHeartRate);
			heartRateChart.draw(heartRateData, heartRateChartOptions);
			
			// Hide edit view
			hideEditView();
		},
		error: function(xhr, ajaxOptions, thrownError) {
			if(xhr.status == 500) {
				$('#EditFail').show();
			}
		}

	});
}

// Deletes the activity currently loaded into the edit form
function deleteActivity() {
	var activityId = $('#ActivityId').val();
	$.ajax({
		url: '/api/users/' + window.base.user._id + '/activities/' + activityId,
		type: 'DELETE',
		success: function(result) {
			// Clear selections and update datamap
			heartRateChart.setSelection([]);
			stepsChart.setSelection([]);
			delete dataMap[activityId];
			
			// Update steps chart
			var stepsRowIndex = getTableRowIndexById(activityId, stepData);
			stepData.removeRow(stepsRowIndex);
			stepsChart.draw(stepData, stepChartOptions);
			
			// Update heartrate chart
			var heartRateRowIndex = getTableRowIndexById(activityId, heartRateData);
			heartRateData.removeRow(heartRateRowIndex);
			heartRateChart.draw(heartRateData, heartRateChartOptions);
			
			// Create missing date button
			createMissingButton(window.utils.toISODate($('#ActivityDate').text()));
			$('#MissingDates').show();
			
			// Hide edit view
			hideEditView();
		}
	});
}

function cancelDeleteActivity() {
	$('#DeleteConfirmDialog').hide();
	$('#ActivityDelete').show();
}

// Called when the document is ready to set up other event handlers
function initControls() {
	$("#ActivityDelete").click(function() {
		$('#ActivityDelete').hide();
		$("#DeleteConfirmDialog").show();
	});
}

// Click event for selecting a datapoint from the steps chart
function stepsSelectHandler() {
	heartRateChart.setSelection([]);
	var sel = stepsChart.getSelection()[0];
	var id = stepData.getRowProperty(sel.row, 'id');
	setupActivityEdit(dataMap[id]);
}

// Click event for selecting a datapoint from the heart rate chart
function heartRateSelectHandler() {
	stepsChart.setSelection([]);
	var sel = heartRateChart.getSelection()[0];
	var id = heartRateData.getRowProperty(sel.row, 'id');
	setupActivityEdit(dataMap[id]);
}

// Creates and adds a "missing activity" button to the DOM for the specified date
function createMissingButton(date) {
	// Create missing date button html
	var mButton = $('<span></span>');
	mButton.addClass('btn btn-xs btn-danger btn-missing-date');
	mButton.text(date.toDateString());
	
	// Add missing date button to the dom
	$('#MissingDates .buttonsContainer').append(mButton);
	
	// Apply click fuction to show create panel
	mButton.click(function() {
		setupActivityCreate(new Date($(this).text()));
	});
}

// Function that creates the charts for steps and heartrate
// The parameters startDate and endDate only contain values when loading data from a specified date range
function drawCharts(data, globalStats, startDate, endDate) {
	// Set global step average
	globalStepAvg = globalStats.stepAverage;
	
	// Create the data tables
	stepData = new google.visualization.DataTable();
	stepData.addColumn('date', 'Day');
	stepData.addColumn('number', 'Steps');
	stepData.addColumn('number', 'Average for all Users');
	
	heartRateData = new google.visualization.DataTable();
	heartRateData.addColumn('date', 'Day');
	heartRateData.addColumn('number', 'Min Heart rate');
	heartRateData.addColumn('number', 'Max Heart rate');
	heartRateData.addColumn('number', 'Avg Heart rate');
	
	var allDates = [];
	
	if(data.length > 0) {
		$.each(data, function(index, obj) {
			// Convert date and remove time component
			var oDate = window.utils.toISODate(obj.date);
			
			allDates.push(oDate);
			
			// Add data to chart DataTables
			var stepRowIndex = stepData.addRow([oDate, obj.steps, globalStepAvg]);
			var heartRateRowIndex = heartRateData.addRow([oDate, obj.minHeartRate, obj.maxHeartRate, obj.avgHeartRate]);
			
			// Store id with each record
			stepData.setRowProperty(stepRowIndex, 'id', obj._id);
			heartRateData.setRowProperty(heartRateRowIndex, 'id', obj._id);
			
			dataMap[obj._id] = obj;
		});
	}
	
	if( (startDate && endDate) || data.length > 0 ) {
		var missingDates = [];
		var curDate;
		var rangeEnd;
		
		// If a date range was passed in use it, otherwise use the first and last dates from the current dataset
		if(startDate) {
			curDate = startDate;
		} else {
			curDate = allDates[0];
		}
		if(endDate) {
			rangeEnd = endDate;
		} else {
			rangeEnd = allDates[allDates.length - 1];
		}
		
		// Convert date objects to numbers so they are easily compared
		allDates = allDates.map(Number);
		
		// Loop over all days in the range, looking for ones that have no activity on that day
		while(curDate <= rangeEnd) {
			if( allDates.indexOf(curDate.getTime()) < 0 ) {
				missingDates.push(curDate);
				createMissingButton(curDate);
			}
			
			// Go ahead 1 day
			var newDate = new Date(curDate.getTime());
			newDate.setDate(newDate.getDate() + 1);
			newDate.setHours(0);
			curDate = newDate;			
		}
		if(missingDates.length > 0) {
			$('#MissingDates').show();
		}
	}
	
	// Create the charts and insert them into the DOM
	stepsChart = new google.visualization.LineChart(document.getElementById('StepsChart'));
	stepsChart.draw(stepData, stepChartOptions);
	
	heartRateChart = new google.visualization.ComboChart(document.getElementById('HeartrateChart'));
	heartRateChart.draw(heartRateData, heartRateChartOptions);
	
	// Set select function handler for the charts
	google.visualization.events.addListener(stepsChart, 'select', stepsSelectHandler);
	google.visualization.events.addListener(heartRateChart, 'select', heartRateSelectHandler);
}