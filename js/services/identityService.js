'use strict';
angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, $timeout, $filter, pluginManager, notification, pendingTxsService, balanceService, applicationService) {
    notification.enableHtml5Mode(); // for chrome: if support, enable it

    // TODO:
    // * remove iden from rootScope
    // * remove wallet from rootScope
    // * create walletService

    var root = {};
    root.check = function(scope) {
      copay.Identity.checkIfExistsAny({
        pluginManager: pluginManager.getInstance(config),
      }, function(anyProfile) {
        copay.Wallet.checkIfExistsAny({
          pluginManager: pluginManager.getInstance(config),
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

    // TODO should be on 'walletService'
    root.goWalletHome = function() {
      var w = $rootScope.wallet;
      if (w) {
        $rootScope.starting = false;
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

    root.create = function(email, password, cb) {
      copay.Identity.create({
        email: email,
        password: password,
        pluginManager: pluginManager.getInstance(config),
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
        failIfExists: true,
      }, function(err, iden) {

        if (err) return cb(err);
        preconditions.checkState(iden);
        root.bind(iden);

        return cb(null);
      });
    };

    root.createDefaultWallet = function(cb) {
      var iden = $rootScope.iden;

      var walletOptions = {
        nickname: iden.fullName,
        networkName: config.networkName,
        requiredCopayers: 1,
        totalCopayers: 1,
        password: iden.password,
        name: 'My wallet',
      };
      iden.createWallet(walletOptions, function(err, wallet) {
        return cb(err);
      });
    };

    root.setServerStatus = function(headers) {
      if (!headers)
        return;

      if (headers['X-Email-Needs-Validation'])
        $rootScope.needsEmailConfirmation = true;
      else
        $rootScope.needsEmailConfirmation = null;

      if (headers['X-Quota-Per-Item'])
        $rootScope.quotaPerItem = parseInt(headers['X-Quota-Per-Item']);

      if (headers['X-Quota-Items-Limit'])
        $rootScope.quotaItems = parseInt(headers['X-Quota-Items-Limit']);
    };

    root.open = function(email, password, cb) {
      var opts = {
        email: email,
        password: password,
        pluginManager: pluginManager.getInstance(config),
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      };

      copay.Identity.open(opts, function(err, iden, headers) {
        if (err) return cb(err);
        root.setServerStatus(headers);
        root.bind(iden);
        return cb(null, iden);
      });
    };

    root.deleteProfile = function(cb) {
      $rootScope.iden.remove(null, cb);
    };

    root.deleteWallet = function(w, cb) {
      $rootScope.iden.deleteWallet(w.id, cb);
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

    root.noFocusedWallet = function() {
      $rootScope.wallet = null;
      $timeout(function() {
        $rootScope.$digest();
      })
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
        if (root.isFocused(wid)) {
          var message = "Could not connect to the Insight server. Check your settings and network configuration";
          notification.error('Networking Error', message);
        }
      });

      w.on('corrupt', function(peerId) {
        if (root.isFocused(wid)) {
          notification.error('Error', $filter('translate')('Received corrupt message from ') + peerId);
        }
      });

      w.on('publicKeyRingUpdated', function() {
        $rootScope.$digest();
      });

      w.on('ready', function() {
        var isFocused = root.isFocused(wid);
        copay.logger.debug('Wallet:' + w.getName() + ' is ready. Focused:', isFocused);

        balanceService.update(w, function() {
          $rootScope.$digest();
        }, isFocused);
      });

      w.on('tx', function(address, isChange) {
        if (!isChange) {
          notification.funds('Funds received on ' + w.getName(), address);
        }
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));
      });

      w.on('balanceUpdated', function() {
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));
      });

      w.on('insightReconnected', function() {
        $rootScope.reconnecting = false;
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));
      });

      w.on('insightError', function() {
        if (root.isFocused(wid)) {
          $rootScope.reconnecting = true;
          $rootScope.$digest();
        }
      });
      w.on('newAddresses', function() {
        // Nothing yet
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

        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));

        // TODO: add wallet name notification
        var user = w.publicKeyRing.nicknameForCopayer(e.cId);
        var name = w.getName();
        switch (e.type) {
          case 'new':
            notification.info('[' + name + '] New Transaction',
              $filter('translate')('You received a transaction proposal from') + ' ' + user);
            break;
          case 'signed':
            notification.success('[' + name + '] Transaction Signed',
              $filter('translate')('A transaction was signed by') + ' ' + user);
            break;
          case 'signedAndBroadcasted':
            notification.success('[' + name + '] Transaction Approved',
              $filter('translate')('A transaction was signed and broadcasted by') + ' ' + user);
            break;
          case 'rejected':
            notification.warning('[' + name + '] Transaction Rejected',
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
          copay.logger.debug('GOT Focused wallet:', w.getName());
          root.setFocusedWallet(w, true);
          root.goWalletHome();
        }

        // At the end (after all handlers are in place)...start the wallet.
        w.netStart();
      });

      iden.on('noWallets', function() {
        notification.warning('No Wallets','Your profile has no wallets. Create one here');
        $rootScope.starting = false;
        $location.path('/create');
        $timeout(function() {
          $rootScope.$digest();
        }, 1);
      });

      iden.on('walletDeleted', function(wid) {
        // do nothing. this is handled 'on sync' on controller.
      });

      iden.on('walletStorageError', function(wid, message) {
        notification.error('Error storing wallet', message);
      });

      iden.on('closed', function() {
        delete $rootScope['wallet'];
        delete $rootScope['iden'];
        applicationService.restart();
      });
    };

    root.signout = function() {
      if ($rootScope.iden) {
        $rootScope.iden.store({
          noWallets: true
        }, function() {
          $rootScope.iden.close();
        });
      }
    };

    root.createWallet = function(opts, cb) {
      $rootScope.iden.createWallet(opts, cb);
    };

    root.importWallet = function(encryptedObj, pass, opts, cb) {
      copay.Compatibility.importEncryptedWallet($rootScope.iden, encryptedObj, pass, opts, cb);
    };

    root.joinWallet = function(opts, cb) {
      $rootScope.iden.joinWallet(opts, function(err, w) {
        return cb(err);
      });
    };

    root.importProfile = function(str, password, cb) {
      copay.Identity.importFromEncryptedFullJson(str, password, {
        pluginManager: pluginManager.getInstance(config),
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      }, function(err, iden, walletObjs) {
        if (err) return cb(err);
        root.bind(iden);
        iden.importMultipleWalletsFromObj(walletObjs);
        return cb();
      });
    };

    return root;
  });
