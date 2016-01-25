'use strict';

angular.module('copayApp.controllers').controller('appletContainerController', function($rootScope, $scope, $css, themeService) {

  var self = this;

  function setAppletEnvironment() {
		self.appletUsesCompactContainer = false;
		self.appletUsesFullContainer = false;
  	self.appletMainViewUrl = '';
		$css.removeAll();

  	if (themeService.getCurrentSkin().hasApplet()) {
			var applet = themeService.getCurrentSkin().getApplet();

			// Declare the container for the applet.
			// 
			self.appletUsesCompactContainer = (applet.container() == 'compact');
			self.appletUsesFullContainer = (applet.container() == 'full');

			// Set the applet main view.
			// 
	  	self.appletMainViewUrl = applet.mainViewUrl();

	  	// Bind stylesheet(s) for this applet.
	  	// 
	  	applet.stylesheets().forEach(function (stylesheet) {
			  $css.bind({ 
			    href: stylesheet
			  }, $scope);
	  	});
	  };
  };

  $rootScope.$on('Local/CloseApplet', function(event) {
  	setAppletEnvironment();
  });

  setAppletEnvironment();
});
