'use strict';

angular.module('copayApp.services').service('externalLinkService', function($window, $timeout, $log, platformInfo, nodeWebkitService) {

  this.open = function(url, target) {
    var old = $window.handleOpenURL;

    $window.handleOpenURL = function(url) {
      // Ignore external URLs
      $log.debug('Skip: ' + url);
    };

    $timeout(function() {
      $window.handleOpenURL = old;
    }, 500);

    if (platformInfo.isNW) {
      nodeWebkitService.openExternalLink(url);
    } else {
      target = target || '_blank';
      var ref = window.open(url, target, 'location=no');
    }
  };

});
