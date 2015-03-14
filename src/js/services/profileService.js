'use strict';
angular.module('copayApp.services')
  .factory('profileService', function($rootScope, $location, $timeout, $filter, $log, lodash, pluginManager, notification, pendingTxsService, balanceService, applicationService, storageService, bwcService, configService) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};

    root._setFocus = function(walletId, cb) {
      $log.debug('Set focus:', walletId);

      // Set local object
      root.focusedClient = root.walletClients[walletId];

      if (!root.focusedClient)
        root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];

      // TODO
      if (!root.focusedClient)
        throw new Error('Profile has not wallets!');

      // TODO open from cache if exist
      root.focusedClient.getStatus(function(err, walletStatus) {
        $rootScope.$emit('newFocusedWallet', walletStatus);
        return cb(err);
      });
    };

    root.setAndStoreFocus = function(walletId, cb) {
      root.setFocus(walletId, function(err) {
        storageService.setFocusedWalletId(walletId, cb);
      });
    };

    root.setProfile = function(p, cb) {
      root.walletClients = {};

      lodash.each(p.credentials, function(c) {
        root.walletClients[c.walletId] = bwcService.getClient(c);
      });
      root.profile = p;

      storageService.getFocusedWalletId(function(err, focusedWalletId) {
        root._setFocus(focusedWalletId, function(err) {
          return cb(err);
        });
      });
    };


    root.loadAndSetProfile = function(cb) {
      storageService.getProfile(function(err, profile) {
        if (err) return cb(err);
        if (!profile) return cb(new Error('NOPROFILE: No profile'));

        return root.setProfile(profile, cb);
      });
    };

    root._createNewProfile = function(pin, cb) {
      var walletClient = bwcService.getClient();
      walletClient.createWallet('Personal Wallet', 'me', 1, 1, 'livenet', function(err) {
        if (err) return cb('Error creating wallet');
        var p = Profile.create({
          credentials: [walletClient.export()],
        });
        return cb(null, p);
      })
    };

    root.create = function(pin, cb) {
      root._createNewProfile(pin, function(err, p) {
        root.setProfile(p, function(err) {
          storageService.storeNewProfile(p, function(err) {
            return cb(err);
          });
        });
      });
    };

    root.isFocusedComplete = function() {
      return root.focusedClient.credentials.isComplete();
    };

    // -===============================================================================

    root.signout = function() {
      root.profile = null;
      root.lastFocusedWallet = null;
      // TODO //        $state.go('signin');
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
          // TODO          go.walletHome();
        }

        // At the end (after all handlers are in place)...start the wallet.
        w.netStart();
      });

      iden.on('noWallets', function() {
        notification.warning('No Wallets', 'Your profile has no wallets. Create one here');
        $rootScope.starting = false;
        $location.path('/add');
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
