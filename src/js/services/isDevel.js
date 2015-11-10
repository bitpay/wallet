'use strict';

angular.module('copayApp.services').factory('isDevel', function(nodeWebkit, isChromeApp, isMobile) {
  return !isMobile.any() && !isChromeApp && !nodeWebkit.isDefined();
});
