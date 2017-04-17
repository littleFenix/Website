// Document ready function
$(function() {
	if(window.utils.getUrlParameter('fail') == 'true') {
		$('#RegisterFail').show();
	}
	
	if(window.utils.getUrlParameter('passwordMismatch') == 'true') {
		$('#PasswordMismatch').show();
	}
	
	if(window.utils.getUrlParameter('userExists') == 'true') {
		$('#UserExists').show();
	}
});