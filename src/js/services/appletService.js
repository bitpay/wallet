'use strict';

angular.module('copayApp.services').factory('appletService', function($rootScope, $log, $timeout, $css, $ionicModal, themeService, FocusedWallet) {

	var root = {};
	root._userPropertyKeys = [];

  function initAppletEnvironment() {
		var applet = root.getApplet();
		publishAppletProperties(applet);

		// Set the applet main view.
		// 
  	root.appletMainViewUrl = applet.mainViewUrl();

  	// Bind stylesheet(s) for this applet.
  	// 
  	applet.stylesheets().forEach(function(stylesheet) {
		  $css.bind({ 
		    href: stylesheet
		  }, $rootScope);
  	});
  };

  function publishAppletFunctions() {
		$rootScope.applet = {
			close: function() { return root.doCloseApplet(); },
			open: function(name) { return root.doOpenApplet(name); },
			path: function(uri) { return root.appletPath(uri); },
		};
  };

  function publishAppletProperties(applet) {
		$rootScope.applet.header = applet.header;
		$rootScope.applet.model = applet.model;
		$rootScope.applet.view = applet.view;
  };

  function removeAppletProperties() {
		for (var i = 0; i < root._userPropertyKeys.length; i++) {
  		delete $rootScope.applet[root._userPropertyKeys[i]];
		}
  	root._userPropertyKeys = [];
  };

  function showApplet() {
		root.appletModal.show();
  	$log.debug('Opened applet \'' + name + '\'');
  };

  function hideApplet() {
		// Pop the skin containing the applet off the stack (re-apply prior skin).
	  themeService.popSkin();
		$css.removeAll();
		removeAppletProperties();
    root.appletModal.remove();
  	$log.debug('Closed applet');
  };

	root.init = function(callback) {
		// Publish applet functions to $rootScope.
		// 
		publishAppletFunctions();
		callback();
		$log.debug('Applet service initialized');
	};

	root.getApplet = function() {
	  return themeService.getCurrentSkin().getApplet();
	};

	root.appletPath = function(uri) {
		var path = '';
		var applet = root.getApplet();
		if (applet) {
	  	path = root.getApplet().path(uri);
	  }
	  return path;
	};

  root.doOpenApplet = function(name) {
  	// Apply the skin containing the applet.
    themeService.setAppletByNameForWallet(name, FocusedWallet.getWalletId(), function() {
	  	initAppletEnvironment();

	  	// Create the applet modal.
	  	// 
			root.appletModal = $ionicModal.fromTemplate('\
				<ion-modal-view class="applet-modal">\
	 			  <ion-nav-bar class="bar-positive" ng-style="{\'color\': applet.view.navBarTitleColor, \'background\': applet.view.navBarBackground, \'border-bottom\': applet.view.navBarBottomBorder}">\
	 			  <div ng-style="{\'background\': applet.view.navBarBackground}">\
				  	<ion-nav-title>{{applet.title || skin.header.name}}</ion-nav-title>\
				  	<ion-nav-buttons side="right">\
	    				<button class="button button-icon button-applet-header icon ion-close" ng-click="applet.close()" ng-style="{\'color\': applet.view.navBarButtonColor}"></button>\
						</ion-nav-buttons>\
					</div>\
			  	</ion-nav-bar>\
					<ion-content class="has-header" ng-style="{\'background\': applet.view.background}">\
						<div ng-include=\"\'' + root.appletMainViewUrl + '\'\">\
					</ion-content>\
				</ion-modal-view>\
				', {
				scope: $rootScope,
				backdropClickToClose: false,
				hardwareBackButtonClose: false,
	      animation: 'animated zoomIn',
	      hideDelay: 1000
	    });

			// Present the modal, allow some time to render before presentation.
			$timeout(function() {
				showApplet()
	    }, 50);
    });
  };

  root.doCloseApplet = function() {
    root.appletModal.hide();

		$timeout(function() {
			hideApplet();
    }, 300);
  };

	root.setProperty = function(key, value) {
		$rootScope.applet[key] = value;
		root._userPropertyKeys.push(key);
	};

	root.setUserProperty = function(key, value) {
		$rootScope.applet.u[key] = value;
		root._userPropertyKeys.push(key);
	};

  $rootScope.$on('modal.shown', function() {
  	$rootScope.$emit('Local/AppletOpened');
		$rootScope.applet.ready = true;
  });

  $rootScope.$on('modal.hidden', function() {
  	$rootScope.$emit('Local/AppletClosed');
		$rootScope.applet.ready = false;
  });

  return root;
});
