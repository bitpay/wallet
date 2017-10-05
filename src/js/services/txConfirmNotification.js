'use strict';
angular.module('copayApp.services').factory('txConfirmNotification', function txConfirmNotification($log, storageService) {
  var root = {};

  root.checkIfEnabled = function(txid, cb) {
    storageService.getTxConfirmNotification(txid, function(err, res) {
      if (err) $log.error(err);
      return cb(!!res);
    });
  };

  root.subscribe = function(client, opts) {
    client.txConfirmationSubscribe(opts, function(err, res) {
      if (err) $log.error(err);
      storageService.setTxConfirmNotification(opts.txid, true, function(err) {
        if (err) $log.error(err);
      });
    });
  };

  root.unsubscribe = function(client, txId) {
    client.txConfirmationUnsubscribe(txId, function(err, res) {
      if (err) $log.error(err);
      storageService.removeTxConfirmNotification(txId, function(err) {
        if (err) $log.error(err);
      });
    });
  };

  return root;

});
