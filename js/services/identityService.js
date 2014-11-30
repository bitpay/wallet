'use strict';
angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, $timeout, $filter, pluginManager, notification, pendingTxsService, balanceService, applicationService) {
    notification.enableHtml5Mode(); // for chrome: if support, enable it

    var root = {};
    root.check = function(scope) {
      copay.Identity.checkIfExistsAny({
        pluginManager: pluginManager,
      }, function(anyProfile) {
        copay.Wallet.checkIfExistsAny({
          pluginManager: pluginManager,
        }, function(anyWallet) {
          scope.loading = false;
          scope.anyProfile = anyProfile ? true : false;
          scope.anyWallet = anyWallet ? true : false;

          if (!scope.anyProfile) {
            $location.path('/createProfile');
          }
        });
      });
    };

    root.goWalletHome = function() {
      var w = $rootScope.wallet;
      if (w) {
        if (!w.isComplete()) {
          $location.path('/copayers');
        } else {
          if ($rootScope.pendingPayment) {
            $location.path('paymentIntent');
          } else {
            $location.path('homeWallet');
          }
        }
      }
    };

    root.create = function(email, password) {
      copay.Identity.create({
        email: form.email.$modelValue,
        password: form.password.$modelValue,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
        failIfExists: true,
      }, function(err, iden) {
        if (err) return cb(err);
        preconditions.checkState(iden);

        var walletOptions = {
          nickname: iden.fullName,
          networkName: config.networkName,
          requiredCopayers: 1,
          totalCopayers: 1,
          password: iden.password,
          name: 'My wallet',
        };
        iden.createWallet(walletOptions, function(err, wallet) {
          if (err) return cb(err);
          root.bind(iden);

          return cb();
        });
      });

    };


    root.open = function(email, password, cb) {
      var opts = {
        email: email,
        password: password,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      };

      copay.Identity.open(opts, function(err, iden) {
        if (err) return cb(err);
        root.bind(iden);
        iden.openWallets();
        return cb();
      });
    };

    root.deleteWallet = function($scope, iden, w) {
      $rootScope.iden.deleteWallet(w.id);
    };

    root.isFocused = function(wid) {
      return $rootScope.wallet && wid === $rootScope.wallet.getId();
    };

    root.setupGlobalVariables = function(iden) {
      $rootScope.pendingTxCount = 0;
      $rootScope.reconnecting = false;
      $rootScope.iden = iden;
    };

    root.setPaymentWallet = function(w) {
      root.setFocusedWallet(w);
      $location.path('/send');
    };

    root.setFocusedWallet = function(w, dontUpdateIt) {
      if (!_.isObject(w))
        w = $rootScope.iden.getWalletById(w);
      preconditions.checkState(w && _.isObject(w));

      copay.logger.debug('Set focus:', w.getName());
      $rootScope.wallet = w;

      if (!dontUpdateIt)
        $rootScope.iden.updateFocusedTimestamp(w.getId());

      pendingTxsService.update();
      $timeout(function() {
        $rootScope.$digest();
      })
    };

    root.installWalletHandlers = function(w) {
      var wid = w.getId();
      w.on('connectionError', function() {
        console.log('err', w.getName()); //TODO
        if (root.isFocused(wid)) {
          var message = "Could not connect to the Insight server. Check your settings and network configuration";
          notification.error('Networking Error', message);
        }
      });

      w.on('corrupt', function(peerId) {
        console.log('corr', w.getName()); //TODO
        if (root.isFocused(wid)) {
          notification.error('Error', $filter('translate')('Received corrupt message from ') + peerId);
        }
      });
      w.on('ready', function() {
        var isFocused = root.isFocused(wid);
        copay.logger.debug('Wallet:' + w.getName() + ' is ready. Focused:', isFocused);

        balanceService.update(w, function() {
          $rootScope.$digest();
        }, isFocused);
      });

      w.on('tx', function(address, isChange) {
        console.log('tx', w.getName()); //TODO
        if (!isChange) {
          notification.funds('Funds received on ' + w.getName(), address);
        }
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));
      });

      w.on('balanceUpdated', function() {
        console.log('b', w.getName()); //TODO
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));
      });

      w.on('insightReconnected', function() {
        console.log('i', w.getName()); //TODO
        $rootScope.reconnecting = false;
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));
      });

      w.on('insightError', function() {
        console.log('i', w.getName()); //TODO
        if (root.isFocused(wid)) {
          $rootScope.reconnecting = true;
          $rootScope.$digest();
        }
      });
      w.on('newAddresses', function() {
        console.log('newAddress', w.getName()); //TODO
      });

      w.on('txProposalsUpdated', function() {
        if (root.isFocused(wid)) {
          pendingTxsService.update();
        }
      });

      w.on('paymentACK', function(memo) {
        notification.success('Payment Acknowledged', memo);
      });

      w.on('txProposalEvent', function(e) {
        if (root.isFocused(wid)) {
          pendingTxsService.update();
        }

        // TODO: add wallet name notification
        var user = w.publicKeyRing.nicknameForCopayer(e.cId);
        var name = w.getName();
        switch (e.type) {
          case 'new':
            notification.info('[' + name + '] New Transaction',
              $filter('translate')('You received a transaction proposal from') + ' ' + user);
            break;
          case 'signed':
            notification.info('[' + name + '] Transaction Signed',
              $filter('translate')('A transaction was signed by') + ' ' + user);
            break;
          case 'signedAndBroadcasted':
            notification.info('[' + name + '] Transaction Approved',
              $filter('translate')('A transaction was signed and broadcasted by') + ' ' + user);
            break;
          case 'rejected':
            notification.info('[' + name + '] Transaction Rejected',
              $filter('translate')('A transaction was rejected by') + ' ' + user);
            break;
          case 'corrupt':
            notification.error('[' + name + '] Transaction Error',
              $filter('translate')('Received corrupt transaction from') + ' ' + user);
            break;
        }
        $rootScope.$digest();
      });
      w.on('addressBookUpdated', function(dontDigest) {
        if (root.isFocused(wid)) {
          if (!dontDigest) {
            $rootScope.$digest();
          }
        }
      });
      w.on('connect', function(peerID) {
        $rootScope.$digest();
      });
      // TODO?
      // w.on('close', );
      // w.on('locked',);
    };

    root.bind = function(iden) {
      preconditions.checkArgument(_.isObject(iden));
      copay.logger.debug('Binding profile...');

      var self = this;
      root.setupGlobalVariables(iden);

      iden.on('newWallet', function(wid) {
        var w = iden.getWalletById(wid);
        copay.logger.debug('newWallet:', w.getName(), wid, iden.getLastFocusedWalletId());
        root.installWalletHandlers(w);
        if (wid == iden.getLastFocusedWalletId()) {
          $rootScope.starting = false;
          copay.logger.debug('GOT Focused wallet:', w.getName());
          root.setFocusedWallet(w, true);
          root.goWalletHome();
        }
        // At the end (after all handlers are in place)...start the wallet.
        w.netStart();
      });

      iden.on('noWallets', function() {
        $location.path('/create');
        $rootScope.$digest()
      });

      iden.on('deletedWallet', function(wid) {
        notification.info('Wallet deleted', $filter('translate')('This wallet was deleted'));
        if ($rootScope.wallet.id === wid) {
          $rootScope.wallet = null;
          var lastFocused = iden.getLastFocusedWalletId();
          root.setFocusedWallet(lastFocused);
        }
      });

      iden.on('closed', function() {
        delete $rootScope['wallet'];
        delete $rootScope['iden'];
        applicationService.restart();
      });
    };

    root.signout = function() {
      if ($rootScope.iden) {
        $rootScope.iden.close();
      }
    };

    root.createWallet = function(opts, cb) {
      $rootScope.iden.createWallet(opts, cb);
    };

    root.importWallet = function(encryptedObj, pass, opts, cb) {
      copay.Compatibility.importEncryptedWallet($rootScope.iden, encryptedObj, pass, opts);
    };

    root.joinWallet = function(opts, cb) {
      $rootScope.iden.joinWallet(opts, function(err, w) {
        return cb(err);
      });
    };

    root.importProfile = function(str, password, cb) {
      copay.Identity.importFromEncryptedFullJson(str, password, {
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      }, function(err, iden) {
        if (err) return cb(err);
      });
    };

    return root;
  });
