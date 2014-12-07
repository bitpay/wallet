'use strict';

angular.module('copayApp.services').factory('go', function($window, $location) {
  var root = {};

  var hideSidebars = function() {
    if (typeof document === 'undefined')
      return;

    // hack to hide sidebars and use ng-click (no href=)
    var win = angular.element($window);
console.log('[go.js.8:win:]',win); //TODO
    var elem = angular.element(document.querySelector('#off-canvas-wrap'))
console.log('[go.js.10:elem:]',elem); //TODO
    elem.removeClass('move-right');
    elem.removeClass('move-left');
  };

  root.go = function(path) {
    var parts = path.split('#');
console.log('[go.js.15:parts:]',parts); //TODO
    $location.path(parts[0]);
    if (parts[1])
      $location.hash(parts[1]);
    hideSidebars();
  };

  return root;
});
