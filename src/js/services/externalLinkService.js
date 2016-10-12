'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService, popupService, gettextCatalog) {

  this.open = function(url, optIn, title, desc, okText, cancelText) {
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
      var message = gettextCatalog.getString(desc),
        title = gettextCatalog.getString(title),
        openBrowser = function(res) {
          if (res) window.open(url, '_system');
        };
      popupService.showConfirm(title, message, 'Open', 'Cancel', openBrowser);
    }
  };

});
