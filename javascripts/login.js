// Document ready function
$(function() {
	if(window.utils.getUrlParameter('fail') == 'true') {
		$('#LoginFail').show();
	}
	
	if(window.utils.getUrlParameter('newUser') == 'true') {
		$('#NewUser').show();
	}
});