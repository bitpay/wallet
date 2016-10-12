'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService, popupService, gettextCatalog) {

  this.open = function(url, desc) {
    if (platformInfo.isNW) {
      nodeWebkitService.openExternalLink(url);
    } else {
      desc = desc || 'this link';
      var message = gettextCatalog.getString('You are leaving to view ' + desc + ''),
        openBrowser = function(res) {
          if (res) window.open(url, '_system');
        };
      popupService.showConfirm('Opening Browser', message, 'Open', 'Cancel', openBrowser);
    }
  };

});
