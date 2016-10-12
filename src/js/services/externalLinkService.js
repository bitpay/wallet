'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService, popupService, gettextCatalog, $window, $log, $timeout) {

  this.open = function(url, optIn, title, message, okText, cancelText) {
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
      if (optIn) {
        var message = gettextCatalog.getString(message),
          title = gettextCatalog.getString(title),
          okText = gettextCatalog.getString(okText),
          cancelText = gettextCatalog.getString(cancelText),
          openBrowser = function(res) {
            if (res) window.open(url, '_system');
          };
        popupService.showConfirm(title, message, okText, cancelText, openBrowser);
      } else window.open(url, '_system');
    }
  };

});
