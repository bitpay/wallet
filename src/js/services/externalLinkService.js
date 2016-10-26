'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService, popupService, gettextCatalog, $window, $log, $timeout) {

  var _restoreHandleOpenURL = function(old) {
    $timeout(function() {
      $window.handleOpenURL = old;
    }, 500);
  };

  this.open = function(url, optIn, title, message, okText, cancelText) {
    var old = $window.handleOpenURL;

    $window.handleOpenURL = function(url) {
      // Ignore external URLs
      $log.debug('Skip: ' + url);
    };

    if (platformInfo.isNW) {
      nodeWebkitService.openExternalLink(url);
      _restoreHandleOpenURL(old);
    } else {
      if (optIn) {
        var message = gettextCatalog.getString(message),
          title = gettextCatalog.getString(title),
          okText = gettextCatalog.getString(okText),
          cancelText = gettextCatalog.getString(cancelText),
          openBrowser = function(res) {
            if (res) window.open(url, '_system');
            _restoreHandleOpenURL(old);
          };
        popupService.showConfirm(title, message, okText, cancelText, openBrowser);
      } else {
        window.open(url, '_system');
        _restoreHandleOpenURL(old);
      }
    }
  };

});
