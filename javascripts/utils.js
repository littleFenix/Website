window.utils = {};

// Gets a url parameter value by name
window.utils.getUrlParameter = function(p) {
    var pageURL = decodeURIComponent(window.location.search.substring(1)),
        params = pageURL.split('&'),
        paramName,
        i;

    for (i = 0; i < params.length; i++) {
        paramName = params[i].split('=');

        if (paramName[0] === p) {
            return paramName[1] === undefined ? true : paramName[1];
        }
    }
};

// Converts a string into a date object, accounting for the timezone offset
window.utils.toISODate = function(inputDate) {
	// Account for timezone offset
	var actDate = new Date(inputDate);
	actDate.setTime(actDate.getTime() + actDate.getTimezoneOffset() * 60 * 1000);
	actDate.setHours(0);
	return actDate;
}