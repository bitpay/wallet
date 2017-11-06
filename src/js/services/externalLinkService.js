'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService, popupService, gettextCatalog, $window, $log, $timeout) {

  var _restoreHandleOpenURL = function(old) {
    $timeout(function() {
      $window.handleOpenURL = old;
    }, 500);
  };

  this.open = function(url, optIn, title, message, okText, cancelText, cb) {
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
        var openBrowser = function(res) {
          if (res) window.open(url, '_system');
          if (cb) return cb();
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
