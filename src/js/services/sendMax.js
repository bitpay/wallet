'use strict';

angular.module('copayApp.services').service('sendMaxService', function(feeService, configService, walletService) {

  /**
   * Get sendMaxInfo
   *
   * @param {Obj} Wallet
   * @param {Callback} Function (optional)
   *
   */
  this.getInfo = function(wallet, cb) {
    feeService.getCurrentFeeRate(wallet.coin, wallet.credentials.network, function(err, feePerKb) {
      if (err) return cb(err);

      var config = configService.getSync().wallet;

      walletService.getSendMaxInfo(wallet, {
        feePerKb: feePerKb,
        excludeUnconfirmedUtxos: !config.spendUnconfirmed,
        returnInputs: true,
      }, function(err, resp) {
        if (err) return cb(err);

        return cb(null, {
          sendMax: true,
          amount: resp.amount,
          inputs: resp.inputs,
          fee: resp.fee,
          feePerKb: feePerKb,
        });
      });
    });
  };

});
