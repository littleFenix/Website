// Document ready function
$(document).ready(function() {
    resetAlerts();
});

var resetAlerts = function() {
    $('#CreationSuccess').hide();
    $('#CreationFail').hide();
    $('#AlreadyExists').hide();
    $('#InvalidDate').hide();
}

var createActivity = function() {
    $.get('/api/user', function(user, status) {
        // Use Ajax to submit form data
        
        $.ajax({
            url: '/api/users/' + user._id + '/activities',
            type: 'POST',
            data: {
                'ownerId': user._id,
                'date': $('#inputDate').val(),
                'time': $('#inputTime').val(),
                'minHeartRate': $('#inputMin').val(),
                'maxHeartRate': $('#inputMax').val(),
                'avgHeartRate': $('#inputAvg').val(),
                'steps': $('#inputSteps').val()
            },
            success: function(result) {
                resetAlerts();
                $('#activityForm')[0].reset();
                $('#CreationSuccess').show();

                setTimeout(function(){
                    $('#CreationSuccess').fadeOut();
                }, 1250);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                resetAlerts();
                if(xhr.status == 400) {
                    $('#InvalidDate').show();
                } else if(xhr.status == 409) {
                    $('#AlreadyExists').show();
                } else if(xhr.status == 500) {
                    $('#CreationFail').show();
                }
            }, 
        });
    });
}