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

  root.go = function(path) {
    var parts = path.split('#');
    $location.path(parts[0]);
    if (parts[1])
      $location.hash(parts[1]);
    hideSidebars();
  };

  return root;
});
