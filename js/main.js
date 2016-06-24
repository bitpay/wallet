$(document)
  .foundation()
  .ready(function() {
  	if(window.location.hash.match('uri-payment')) { window.location.href = '/in/app' + window.location.hash;}
	$('header').fadeIn('slow');
  });
