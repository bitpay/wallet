'use strict';
angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, pluginManager, notification, pendingTxsService, balanceService, applicationService, storageService, bwcService, configService) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};


    // Add some convenience shortcuts
    root.setupFocusedClient = function() {
      var fc = root.focusedClient;
      fc.networkName = fc.credentials.network;
      fc.m = fc.credentials.m;
      fc.n = fc.credentials.n;
      fc.network = fc.credentials.network;
      fc.copayerId = fc.credentials.copayerId;
      fc.isComplete = fc.credentials.isComplete();
      $log.debug('Focused Client:', fc); //TODO
    };

    root._setFocus = function(walletId, cb) {
      $log.debug('Set focus:', walletId);

      // Set local object
      root.focusedClient = root.walletClients[walletId];

      if (!root.focusedClient)
        root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];

      if (!root.focusedClient)
        throw new Error('Profile has not wallets!');

      root.setupFocusedClient();
      root.focusedClient.openWallet(function() {
        $rootScope.$emit('updateStatus');
        return cb();
      });
    };

    root.setAndStoreFocus = function(walletId, cb) {
      root._setFocus(walletId, function() {
        storageService.storeFocusedWalletId(walletId, cb);
      });
    };

    root._setWalletClients = function() {
      root.walletClients = {};

      lodash.each(root.profile.credentials, function(credentials) {
        var client = bwcService.getClient(JSON.stringify(credentials));

        client.removeAllListeners();

        client.on('walletCompleted', function() {
          $log.debug('Wallet completed');
          client.isComplete = true;

          var newCredentials = lodash.reject(root.profile.credentials, {
            walletId: client.credentials.walletId
          });
          newCredentials.push(JSON.parse(client.export()));
          root.profile.credentials = newCredentials;

          storageService.storeProfile(root.profile, function(err) {
            $rootScope.$emit('walletWasCompleted')
          });
        });

        root.walletClients[credentials.walletId] = client;
      });
      $rootScope.$emit('updateWalletList');
    };

    root.bindProfile = function(profile, cb) {
      console.log('[profileService.js.54] SET Profile', profile); //TODO
      root.profile = profile;

      root._setWalletClients();
      storageService.getFocusedWalletId(function(err, focusedWalletId) {
        configService.get(function(err) {
          root._setFocus(focusedWalletId, cb);
        })
      });
    };


    root.loadAndBindProfile = function(cb) {
      storageService.getProfile(function(err, profile) {
        if (err) return cb(err);
        if (!profile) return cb(new Error('NOPROFILE: No profile'));

        return root.bindProfile(profile, cb);
      });
    };

    root._createNewProfile = function(pin, cb) {
      var walletClient = bwcService.getClient();

      // TODO livenet
      walletClient.createWallet('Personal Wallet', 'me', 1, 1, 'testnet', function(err) {
        if (err) return cb('Error creating wallet');
        var p = Profile.create({
          credentials: [JSON.parse(walletClient.export())],
        });
        return cb(null, p);
      })
    };

    // TODO name
    root.createWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Creating Wallet:', opts);

      walletClient.createWallet(opts.name, opts.myName || 'me', opts.m, opts.n, opts.networkName, function(err, secret) {
        if (err) return cb('Error creating wallet');

        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root._setWalletClients();

        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, secret);
          });
        });
      })
    };

    root.joinWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Joining Wallet:', opts);

      // TODO name
      walletClient.joinWallet(opts.secret, opts.myName || 'me', function(err) {
        // TODO: err
        if (err) return cb('Error joining wallet' + err);

        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root._setWalletClients();

        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, secret);
          });
        });
      })
    };

    root.create = function(pin, cb) {
      root._createNewProfile(pin, function(err, p) {

        root.bindProfile(p, function(err) {
          storageService.storeNewProfile(p, function(err) {
            return cb(err);
          });
        });
      });
    };

    // -===============================================================================
    //OLD!
    //

    root.signout = function() {
      root.profile = null;
      root.lastFocusedWallet = null;
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

    // TODO TODO
    root.bind = function(iden) {
      preconditions.checkArgument(_.isObject(iden));
      copay.logger.debug('Binding profile...');

      var self = this;
      root.setupGlobalVariables(iden);
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
