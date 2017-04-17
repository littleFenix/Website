// Global base object, will hold logged in user and maybe more stuff in the future?
window.base = { };

// Document ready function
$(function() {
	$.ajax('/api/user',
		{ type: 'GET',
		  success: function(u) { window.base.user = u; },
		  error: function() { window.location = '/login'; } }
	);
});