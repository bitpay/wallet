'use strict';

angular.module('copayApp.services').factory('walletService',
  function($rootScope, $http, localStorageService, bwcService) {
    var root = {};

    var set = function(data) {
      var wId = JSON.parse(data).walletId;
      var wallets = {};
      $rootScope.iden.wallets[wId] = data;
      $rootScope.iden.lastOpenedWallet = wId;
      if (localStorageService.set($rootScope.iden.name, $rootScope.iden)) {
        console.log('Wallet stored');
      }
    };

    var get = function(wId) {
      if (!$rootScope.iden || !$rootScope.iden.name)
        return;
      var iden = localStorageService.get($rootScope.iden.name);
      if (!wId)
        return iden.wallets;
      else
        return iden.wallets[wId];
    };

    var updateStatus = function(wallet, cb) {
      $rootScope.offline = false;
      bwcService.getStatus(wallet, function(err, res) {
        if (err) {
          $rootScope.currentWallet = {
            wallet: JSON.parse(wallet)
          };
          $rootScope.offline = true;
        } else {
          $rootScope.currentWallet = res;
          $rootScope.offline = false;
        }
        return cb(err, res);
      });
    };

    root.list = function(cb) {
      var walletData = get();
      if (!walletData) return;
      $rootScope.wallets = [];
      for (var wId in walletData) {
        $rootScope.wallets.push(JSON.parse(walletData[wId]));
        if (wId === $rootScope.iden.lastOpenedWallet) {
          root.open(wId, function(err, res) {
            return cb(err, res);
          });
        }
      }
    };

    root.create = function(wallet, cb) {
      var w = {
        walletName: wallet.name,
        copayerName: $rootScope.iden.name,
        mn: [wallet.m, wallet.n],
        network: wallet.network
      };

      bwcService.create(w, function(err, secret, w) {
        if (!secret) {
          updateWallet(w, function(e, r) {
            return cb(err, secret);
          });
        } else {
          set(w);
          return cb(null, secret);
        }
      });
    };

    var updateWallet = function(walletData, cb) {
      bwcService.open(walletData, function(err, res, w) {
        if (!w) return cb(err);
        set(w);
        updateStatus(w, function(e, r) {
          return cb(e, r);
        });
      });
    };

    root.join = function(wallet, cb) {
      var wallet = {
        walletSecret: wallet.secret,
        copayerName: $rootScope.iden.name
      };

      bwcService.join(wallet, function(err, res, w) {
        if (err) return cb(err);
        set(w);
        updateWallet(w, function(e, r) {
          if (e) return cb(e);
          return cb(e, r);
        });
      });
    };

    root.open = function(wId, cb) {
      var walletData = get(wId);
      if (!walletData) return cb();

      $rootScope.currentWallet = {
        wallet: JSON.parse(walletData)
      };
      updateWallet(walletData, function(err, res) {
        return cb(err, res);
      });
    };

    root.getAddress = function(cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.getAddress(walletData, function(err, res) {
        return cb(err, res);
      });
    };

    root.getAddresses = function(cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.getAddresses(walletData, function(err, res) {
        return cb(err, res);
      });
    };

    root.sendTransaction = function(tx, cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.sendTransaction(walletData, tx, function(err, res) {
        updateStatus(walletData, function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.signTransaction = function(txp, cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.signTransaction(walletData, txp, function(err, res) {
        updateStatus(walletData, function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.rejectTransaction = function(txp, cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.rejectTransaction(walletData, txp, function(err, res) {
        updateStatus(walletData, function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.broadcastTransaction = function(txp, cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.broadcastTransaction(walletData, txp, function(err, res) {
        updateStatus(walletData, function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.getHistory = function(cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.getHistory(walletData, function(err, res) {
        return cb(err, res);
      });
    };

    root.getBalance = function(cb) {
      var walletData = $rootScope.iden.wallets[$rootScope.currentWallet.wallet.id];

      bwcService.getBalance(walletData, function(err, res) {
        updateStatus(walletData, function(e, r) {
          return cb(err, res);
        });
      })
    };

    return root;
  });
