'use strict';

angular.module('copayApp.services').factory('go', function($window, $rootScope, $location) {
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
    var rightbarActive = angular.element(document.getElementsByClassName('move-left')).length;
    
    if (invert) {
      if (rightbarActive) {
        hideSidebars();
      }
      else {
        elem.addClass('move-right');
      }
    }
    else { 
      if (leftbarActive) {
        hideSidebars();
      }
      else {
        elem.addClass('move-left');
      }
    }
  };

  root.openExternalLink = function(url) {
    var ref = window.open(url, '_blank', 'location=no');
  };

  root.path = function(path) {
    var parts = path.split('#');
    $location.path(parts[0]);
    if (parts[1])
      $location.hash(parts[1]);
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
        root.path('selectWalletForPayment');
      } else {
        root.path('homeWallet');
      }
    }
  };

  root.home = function() {
console.log('[go.js.48:home:]'); //TODO
    if ($rootScope.iden)
      root.walletHome();
    else
      root.path('/');
  };


  root.send = function() {

console.log('[go.js.58]'); //TODO
    $location.path('send');
  };

  return root;
});
