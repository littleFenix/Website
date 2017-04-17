// Document ready function
$(function() {
    $('#user-inactive').hide();
    $('#user-active').hide();
	$.ajax('/api/user',
		{ type: 'GET',
		  success: function() { $('#user-inactive').hide(); $('#user-active').show(); },
		  error: function() { $('#user-inactive').show(); $('#user-active').hide(); } }
	);
});