
'use strict';

angular.module('copayApp.controllers').controller('cashScanController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcess,  profileService, walletService, configService, $log, txFormatService, bwcError, pushNotificationsService, bwcService) {
    var wallet;
    var errors = bwcService.getErrors();
    $scope.error  = null;

    $scope.$on("$ionicView.enter", function(event, data) {
      updateAllWallets();
    });

    var updateAllWallets = function() {
      var wallets = profileService.getWallets({coin:'btc', onlyComplete:true, network: 'livenet'  });


      var kk = lodash.indexBy(wallets,"credentials.xPubKey");


      // TODO ?
      if (lodash.isEmpty(wallets)) return;


      var walletsBCH = profileService.getWallets({coin:'bch', network: 'livenet' });
      var xPubKeyIndex = lodash.indexBy(walletsBCH,"credentials.xPubKey");

//      wallets= lodash.filter(wallets,function(w) { return !xPubKeyIndex[w.credentials.xPubKey]; });

      $scope.wallets = wallets;

      var i = wallets.length;
      var j = 0;
      lodash.each(wallets, function(wallet) {
        walletService.getBalance(wallet, {coin:'bch'}, function(err, balance) {
          if (err) {

            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

            $log.error(err);
            return;
          } 
//

console.log('[otherBalance.js.28:balance:]',balance); //TODO
          wallet.error = null;
          wallet.bchBalance = txFormatService.formatAmountStr('bch', balance.availableAmount);
          if (++j == i) {

            //Done
            $timeout(function() {
              $rootScope.$apply();
            }, 10);

          }
        });
      });
    };

    $scope.duplicate = function(wallet) {
      $scope.error  = null;
      $log.debug('Duplicating wallet for BCH:' + wallet.id + ':' +  wallet.name);

      var opts = {};
      opts.name = wallet.name + '[BCH]';
      opts.m = wallet.m;
      opts.n = wallet.n;
      opts.myName = wallet.credentials.copayerName; 
      opts.networkName = wallet.network;
      opts.coin = 'bch';

      // TODO: finger print / decrypt
      $log.warn('TODO finger print / decrypt');
      opts.extendedPrivateKey =  wallet.credentials.xPrivKey;

      function setErr(err, cb) {
        $scope.error =  bwcError.cb(err, gettextCatalog.getString('Could not duplicate'), function() { 
          return cb(err); 
        });
        $timeout(function() {
          $rootScope.$apply();
        }, 10);
      }

      function importOrCreate(cb) {
        walletService.getStatus(wallet, {}, function(err, status){
          if (err) return cb(err);

          opts.singleAddress =  status.wallet.singleAddress;

          // first try to import
          profileService.importExtendedPrivateKey(opts.extendedPrivateKey, opts, function(err, client) {
            if (err && !(err instanceof errors.NOT_AUTHORIZED) ) {
              return setErr(err, cb);
            }
            if (err) {
              // create and store a wallet
              return profileService.createWallet(opts, function(err, client) {
                if (err) return setErr(err, cb);
                return cb(null, client, true);
              });
            }
            return cb(null, client);
          });
        });
      };


      importOrCreate(function(err, client, isNew) {
        if (err) return;
        walletService.updateRemotePreferences(client);
        pushNotificationsService.updateSubscription(client);
        walletService.startScan(wallet, function() { });
        $state.go('tabs.home');
      });
    }
  });
