
'use strict';

angular.module('copayApp.services').factory('confirmDialog', function($log, profileService, configService, gettextCatalog, isCordova, isChromeApp) {
  var root = {};


  var acceptMsg = gettextCatalog.getString('Accept');
  var cancelMsg = gettextCatalog.getString('Cancel');
  var confirmMsg = gettextCatalog.getString('Confirm');

  root.show = function(msg, cb) {
    if (isCordova) { 
      navigator.notification.confirm(
        msg,
        function(buttonIndex) {
          if (buttonIndex == 1) {
            $timeout(function() {
              return cb(true);
            }, 1);
          } else {
            return cb(false);
          }
        },
        confirmMsg, [acceptMsg, cancelMsg]
      );
    } else if (isChromeApp) {
      // No feedback, alert/confirm not supported.
      return cb(true);
    } else {
      return cb(confirm(msg));
    }
  };

  return root;
});

