'use strict';

angular.module('copayApp.services').factory('txStatus', function(lodash, profileService, $timeout, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  root.notify = function(txp) {
    var fc = profileService.focusedClient;
    var status = txp.status;
    var type;
    var INMEDIATE_SECS = 10;

    if (status == 'broadcasted') {
      type = 'broadcasted';
    } else {

      var n = txp.actions.length;
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });

      if (!action) {
        type = 'created';
      } else if (action.type == 'accept') {
        // created and accepted at the same time?
        if (n == 1 && action.createdOn - txp.createdOn < INMEDIATE_SECS) {
          type = 'created';
        } else {
          type = 'accepted';
        }
      } else if (action.type == 'reject') {
        type = 'rejected';
      } else {
        throw new Error('Unknown type:' + type);
      }
    }
    return type;
  };

  return root;
});
