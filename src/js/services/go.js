'use strict';

angular.module('copayApp.services').factory('go', function($window, $rootScope, $location, $state) {
  var root = {};

  var hideSidebars = function() {
    if (typeof document === 'undefined')
      return;

    // hack to hide sidebars and use ng-click (no href=)
    var win = angular.element($window);
    var elem = angular.element(document.querySelector('#off-canvas-wrap'))
    elem.removeClass('move-right');
    elem.removeClass('move-left');
  };

  var toggleSidebar = function(invert) {
    if (typeof document === 'undefined')
      return;

    var elem = angular.element(document.querySelector('#off-canvas-wrap'));
    var leftbarActive = angular.element(document.getElementsByClassName('move-right')).length;
    
    if (invert) {
      elem.addClass('move-right');
    }
    else { 
      if (leftbarActive) {
        hideSidebars();
      }
    }
  };

  root.openExternalLink = function(url) {
    var ref = window.open(url, '_blank', 'location=no');
  };

  root.path = function(path) {
    $state.go(path);
    hideSidebars();
  };

  root.swipe = function(invert) {
    toggleSidebar(invert);
  };

  root.walletHome = function() {
    var w = $rootScope.wallet;
    preconditions.checkState(w);
    $rootScope.starting = false;

    if (!w.isComplete()) {
      root.path('copayers');
    } else {
      if ($rootScope.pendingPayment) {
        if ($rootScope.walletForPaymentSet) {
          root.path('send');
        } else {
          root.path('selectWalletForPayment');
        }
      } else {
        root.path('home');
      }
    }
  };

  root.home = function() {
    if ($rootScope.iden)
      root.walletHome();
    else
      root.path('signin');
  };


  root.send = function() {
    $state.go('send');
  };


  // Global go. This should be in a better place TODO
  // We dont do a 'go' directive, to use the benefits of ng-touch with ng-click
  $rootScope.go = function (path) {
    root.path(path);
  };

  $rootScope.openExternalLink = function (url) {
    root.openExternalLink(url);
  };



  return root;
});
