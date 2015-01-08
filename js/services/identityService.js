'use strict';
angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, $timeout, $filter, pluginManager, notification, pendingTxsService, balanceService, applicationService, go) {

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

    root.resendVerificationEmail = function(cb) {
      var iden = $rootScope.iden;
      iden.resendVerificationEmail(cb);
    };

    root.setServerStatus = function(headers) {
      if (!headers)
        return;

      var customHeaders = {};
      _.each(_.keys(headers), function(headerKey) {
        var hk = headerKey.toLowerCase();
        if (hk.indexOf('x-') === 0) {
          customHeaders[hk] = headers[headerKey];
        }
      });

      if (customHeaders['x-email-needs-validation'])
        $rootScope.needsEmailConfirmation = true;
      else
        $rootScope.needsEmailConfirmation = null;

      if (customHeaders['x-quota-per-item'])
        $rootScope.quotaPerItem = parseInt(customHeaders['x-quota-per-item']);

      if (customHeaders['x-quota-items-limit'])
        $rootScope.quotaItems = parseInt(customHeaders['x-quota-items-limit']);
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
      $rootScope.iden.deleteWallet(w.getId(), cb);
    };

    root.isFocused = function(wid) {
      return $rootScope.wallet && wid === $rootScope.wallet.getId();
    };

    root.setupGlobalVariables = function(iden) {
      $rootScope.reconnecting = false;
      $rootScope.iden = iden;
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
      }, 1);
    };

    root.notifyTxProposalEvent = function(w, e) {
      if (e.cId == w.getMyCopayerId())
        return;

      var user = w.publicKeyRing.nicknameForCopayer(e.cId);
      var name = w.getName();
      switch (e.type) {
        case copay.Wallet.TX_NEW:
          notification.info('[' + name + '] New Transaction',
            $filter('translate')('You received a transaction proposal from') + ' ' + user);
          break;
        case copay.Wallet.TX_SIGNED:
          notification.success('[' + name + '] Transaction Signed',
            $filter('translate')('A transaction was signed by') + ' ' + user);
          break;
        case copay.Wallet.TX_BROADCASTED:
          notification.success('[' + name + '] Transaction Approved',
            $filter('translate')('A transaction was broadcasted by') + ' ' + user);
          break;
        case copay.Wallet.TX_REJECTED:
          notification.warning('[' + name + '] Transaction Rejected',
            $filter('translate')('A transaction was rejected by') + ' ' + user);
          break;
      }
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
        copay.logger.warn('Received corrupt message from ' + peerId);
      });

      w.on('publicKeyRingUpdated', function() {
        $rootScope.$digest();
      });

      w.on('ready', function() {
        var isFocused = root.isFocused(wid);
        copay.logger.debug('Wallet:' + w.getName() +
          ' is ready. Focused:', isFocused);

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

      // Disabled for now, does not seens to have much value for the user
      // w.on('paymentACK', function(memo) {
      //   notification.success('Payment Acknowledged', memo);
      // });

      w.on('txProposalEvent', function(ev) {

        if (root.isFocused(wid)) {
          pendingTxsService.update();
        }

        // TODO aqui lo unico que cambia son los locked
        // se puede optimizar 
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, root.isFocused(wid));

        root.notifyTxProposalEvent(w, ev);
        $timeout(function() {
          $rootScope.$digest();
        });
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
        copay.logger.debug('newWallet:',
          w.getName(), wid, iden.getLastFocusedWalletId());
        root.installWalletHandlers(w);
        if (wid == iden.getLastFocusedWalletId()) {
          copay.logger.debug('GOT Focused wallet:', w.getName());
          root.setFocusedWallet(w, true);
          go.walletHome();
        }

        // At the end (after all handlers are in place)...start the wallet.
        w.netStart();
      });

      iden.on('noWallets', function() {
        notification.warning('No Wallets', 'Your profile has no wallets. Create one here');
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
        $rootScope.signingOut = true;
        $rootScope.iden.close(function() { // Will trigger 'closed'
          $rootScope.signingOut = false;
        }); // Will trigger 'closed'
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
