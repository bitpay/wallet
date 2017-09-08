
'use strict';

angular.module('copayApp.controllers').controller('otherBalanceController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcess,  profileService, walletService, configService, $log, platformInfo, storageService,   bwcError     ) {
    var wallet;
    var listeners = [];
    var notifications = [];
    $scope.isCordova = platformInfo.isCordova;
    $scope.isAndroid = platformInfo.isAndroid;
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    $scope.isNW = platformInfo.isNW;


    $scope.$on("$ionicView.enter", function(event, data) {
      updateAllWallets();
    });

    var updateAllWallets = function() {
      var wallets = profileService.getWallets({coin:'btc', onlyComplete:true, network: 'livenet'  });


      // TODO ?
      if (lodash.isEmpty(wallets)) return;
console.log('[otherBalance.js.24:wallets:]',wallets); //TODO


      var walletsBCH = profileService.getWallets({coin:'bch', network: 'livenet' });
      var xPubKeyIndex = lodash.indexBy(walletsBCH,"credentials.xPubKey");
console.log('[otherBalance.js.28:xPubKeyIndex:]',xPubKeyIndex); //TODO

      wallets= lodash.filter(wallets,function(w) { return xPubKeyIndex[w.credentials.xPubKey]; });
console.log('[otherBalance.js.31:wallets:]',wallets); //TODO


      // TODO Filterout already duplicated walelts
      // TODO filterout balance=0 wallets
      //
      //
      
      $scope.wallets = wallets;

      var i = wallets.length;
      var j = 0;
      lodash.each(wallets, function(wallet) {
        walletService.getBalance(wallet, {coin:'bch'}, function(err, status) {
          if (err) {

            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

            $log.error(err);
            return;
          } 
//

console.log('[otherBalance.js.28:status:]',status); //TODO
          wallet.error = null;
          wallet.status = status;
          if (++j == i) {
            //
          }
        });
      });
    };

    $scope.duplicate = function(wallet) {
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


      opts.walletPrivKey =  wallet.credentials.walletPrivKey;

      walletService.getStatus(wallet, {}, function(err, status){
        if (err) {
          // TODO
          $log.err('TODO Err');
          return;
        }
        opts.singleAddress =  status.wallet.singleAddress;

        // create and store a wallet
        profileService.createWallet(opts, function(err) {
            $state.go('tabs.home');
        });
      });
    }
  });
