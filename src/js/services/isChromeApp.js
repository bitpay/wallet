'use strict';

angular.module('copayApp.services').factory('isChromeApp', function(nodeWebkit) {
  return !!(window.chrome && chrome.runtime && chrome.runtime.id && !nodeWebkit.isDefined());
});
