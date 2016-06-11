'use strict';

angular.module('copayApp.services').factory('go', function($window, $ionicSideMenuDelegate, $rootScope, $location, $state, $timeout, $log, profileService, platformInfo, nodeWebkit) {
  var root = {};

  root.openExternalLink = function(url, target) {
    if (platformInfo.isNW) {
      nodeWebkit.openExternalLink(url);
    } else {
      target = target || '_blank';
      var ref = window.open(url, target, 'location=no');
    }
  };

  root.is = function(name) {
    return $state.is(name);
  };

  root.path = function(path, cb) {
    $state.transitionTo(path)
      .then(function() {
        if (cb) return cb();
      }, function() {
        if (cb) return cb('animation in progress');
      });
  };

  root.toggleLeftMenu = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

  root.walletHome = function() {
    var fc = profileService.focusedClient;
    if (fc && !fc.isComplete()) {
      $log.debug("Wallet not complete at startup... redirecting")
      root.path('copayers');
    } else {
      root.path('walletHome', function() {
        $rootScope.$emit('Local/SetTab', 'walletHome', true);
      });
    }
  };

  root.send = function() {
    root.path('walletHome', function() {
      $rootScope.$emit('Local/SetTab', 'send');
    });
  };

  root.addWallet = function() {
    $state.transitionTo('add');
  };

  root.preferences = function() {
    $state.transitionTo('preferences');
  };

  root.preferencesGlobal = function() {
    $state.transitionTo('preferencesGlobal');
  };

  root.reload = function() {
    $state.reload();
  };


  // Global go. This should be in a better place TODO
  // We don't do a 'go' directive, to use the benefits of ng-touch with ng-click
  $rootScope.go = function(path) {
    root.path(path);
  };

  $rootScope.openExternalLink = function(url, target) {
    root.openExternalLink(url, target);
  };



  return root;
});
