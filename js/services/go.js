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

  var showSidebar = function(invert) {
    if (typeof document === 'undefined')
      return;

    // hack to hide sidebars and use ng-click (no href=)
    var win = angular.element($window);
    var elem = angular.element(document.querySelector('#off-canvas-wrap'))
    if (invert) {
      elem.addClass('move-right');
    }
    else {
      elem.addClass('move-left');
    }
  };

  root.go = function(path) {
    var parts = path.split('#');
    $location.path(parts[0]);
    if (parts[1])
      $location.hash(parts[1]);
    hideSidebars();
  };

  var pages = [
      '/homeWallet',
      '/receive',
      '/send',
      '/history'
    ];

  var sidebarActive = false;

  root.swipe = function(invert) {
    var currentPage = $location.path();
    var pageIndex;
    if (!sidebarActive) {
      pageIndex = invert ? pages.indexOf(currentPage) - 1 : pages.indexOf(currentPage) + 1;
    }
    else {
      pageIndex = pages.indexOf(currentPage);
    }
    var page = pages[pageIndex];
    
    if (pageIndex === -1 || pageIndex === 4) {
      sidebarActive = true;
      showSidebar(invert);
    }
    else if (pageIndex >= 0 && pageIndex <= 3) {
      var goTo = pages[pageIndex];
      sidebarActive = false;
      root.go(goTo);
    }
  };

  return root;
});
