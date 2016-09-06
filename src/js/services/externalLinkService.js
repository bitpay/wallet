'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService) {

  this.open = function(url, target) {
    if (platformInfo.isNW) {
      nodeWebkitService.openExternalLink(url);
    } else {
      target = target || '_blank';
      var ref = window.open(url, target, 'location=no');
    }
  };

});
