'use strict';
angular.module('copayApp.services').factory('copayAppletService', function($rootScope, Applet, themeService) {

  var root = {};

	// Return the applet from the skin.
	// 
	root.getApplet = function() {
	  return themeService.getCurrentSkin().getApplet();
	};

	// Close the applet and return to the prior skin.
	// 
	root.closeApplet = function() {
	  themeService.popSkin();
		$rootScope.$emit('Local/CloseApplet');
	};

	// Return true if the applet can close, false otherwise.
	// 
	root.canCloseApplet = function() {
	  return themeService.hasSkinHistory();
	};

	// Root scope access to applet services.
	// Suitable for call from views, example:
	// 
	//   <div ng-click="applet.close()"></div>
	// 
	$rootScope.applet = {
		canClose: function() { return root.canCloseApplet(); },
		close: function() { return root.closeApplet(); }
	};

  return root;
});