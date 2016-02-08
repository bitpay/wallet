'use strict';

angular.module('copayApp.services').factory('go', function($window, $rootScope, $location, $state, $timeout, profileService, nodeWebkit, $ionicSideMenuDelegate) {
  var root = {};

  root.setSideMenusEnabled = function(b) {
    $ionicSideMenuDelegate.canDragContent(b);
  };

  root.toggleLeftMenu = function() {
    $ionicSideMenuDelegate.toggleLeft()
  };

  root.toggleRightMenu = function() {
    $ionicSideMenuDelegate.toggleRight()
  };

  root.openExternalLink = function(url, target) {
    if (nodeWebkit.isDefined()) {
      nodeWebkit.openExternalLink(url);
    } else {
      target = target || '_blank';
      var ref = window.open(url, target, 'location=no');
    }
  };

  root.path = function(path, cb) {
    $state.transitionTo(path)
      .then(function() {
        if (cb) return cb();
      }, function() {
        if (cb) return cb('animation in progress');
      });
  };

  root.disclaimer = function() {
    root.setSideMenusEnabled(false);
    root.path('disclaimer');
  };

  root.walletHome = function(delayed) {
    var fc = profileService.focusedClient;
    if (fc && !fc.isComplete()) {
      root.path('copayers');
    } else {
      root.path('walletHome', function() {
        $rootScope.$emit('Local/SetTab', 'walletHome', true);
        root.setSideMenusEnabled(true);
      });
    }
  };

  root.send = function() {
    root.path('walletHome', function() {
      $rootScope.$emit('Local/SetTab', 'send');
    });
  };

  root.addWallet = function() {
    $state.go('add');
  };

  root.preferences = function() {
    $state.go('preferences');
  };

  root.preferencesGlobal = function() {
    $state.go('preferencesGlobal');
  };

  root.reload = function() {
    $state.reload();
  };

  // Global go. This should be in a better place TODO
  // We dont do a 'go' directive, to use the benefits of ng-touch with ng-click
  $rootScope.go = function(path) {
    root.path(path);
  };

  $rootScope.openExternalLink = function(url, target) {
    root.openExternalLink(url, target);
  };

  return root;
});
