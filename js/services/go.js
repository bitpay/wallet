'use strict';

angular.module('copayApp.services').factory('go', function($window, $location) {
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

  root.go = function(path) {
    var parts = path.split('#');
    $location.path(parts[0]);
    if (parts[1])
      $location.hash(parts[1]);
    hideSidebars();
  };

  root.swipe = function(invert) {
    toggleSidebar(invert);
  };

  return root;
});
