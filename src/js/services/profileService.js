'use strict';
angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, pluginManager, balanceService, applicationService, storageService, bwcService, configService, notificationService) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};

    configService.get(function(err, config) {
      if (err) {
        throw new Error(err);
      }
      var bwsurl = config.bws.url;
      bwcService.setBaseUrl(bwsurl);
    });


    root.getUtils = function() {
      return bwcService.getUtils();
    };


    // Add some convenience shortcuts
    root.setupFocusedClient = function() {
      var fc = root.focusedClient;
      fc.networkName = fc.credentials.network;
      fc.m = fc.credentials.m;
      fc.n = fc.credentials.n;
      fc.network = fc.credentials.network;
      fc.copayerId = fc.credentials.copayerId;
      fc.walletId = fc.credentials.walletId;
      fc.isComplete = fc.credentials.isComplete();
      $log.debug('Focused Client:', fc); //TODO
    };


    root.formatAmount = function(amount) {
      var config = configService.getSync().wallet.settings;
      if (config.unitCode == 'sat') return amount;

      //TODO : now only works for english, specify opts to change thousand separator and decimal separator
      return this.getUtils().formatAmount(amount, config.unitCode);
    };


    root.scan = function(walletId, cb) {
      // TODO
      $log.warn('Wallet scanning not YET implemented...');
      $timeout(cb, 500 * lodash.random(1, 20));

      //      root.walletClients[walletId].scan(cb);
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
        $rootScope.$emit('Local/NewFocusedWallet');
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

        client.initNotifications(function(err) {
          if (err) console.log('*** [profileService.js ln58] Could not init notifications err:', err); // TODO
        });

        client.on('notification', function(notification) {
          $log.debug('BWC Notification:', notification);
          notificationService.newBWCNotification(notification, {
            walletId: client.credentials.walletId,
            walletName: client.credentials.walletName
          });
          if (root.focusedClient.credentials.walletId == client.credentials.walletId) {
            $rootScope.$emit(notification.type);
          } else {
            $rootScope.$apply();
          }
        });

        client.on('walletCompleted', function() {
          $log.debug('Wallet completed');
          client.isComplete = true;

          var newCredentials = lodash.reject(root.profile.credentials, {
            walletId: client.credentials.walletId
          });
          newCredentials.push(JSON.parse(client.export()));
          root.profile.credentials = newCredentials;

          storageService.storeProfile(root.profile, function(err) {
            $rootScope.$emit('Local/WalletCompleted')
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
      walletClient.createWallet('Personal Wallet', 'me', 1, 1, {
        network: 'testnet'
      }, function(err) {
        if (err) return cb('Error creating wallet');
        var p = Profile.create({
          credentials: [JSON.parse(walletClient.export())],
        });
        return cb(null, p);
      })
    };

    // TODO copayer name
    root.createWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Creating Wallet:', opts);

      walletClient.createWallet(opts.name, opts.myName || 'me', opts.m, opts.n, {
        network: opts.networkName
      }, function(err, secret) {
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

    root.importWallet = function(str, opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Importing Wallet:', opts);
      try {
        walletClient.import(str, {
          compressed: opts.compressed,
          password: opts.password
        });
      } catch (err) {
        return cb('Could not import. Check input file and password');
      }

      var walletId = walletClient.credentials.walletId;

      // check if exist
      if (lodash.find(root.profile.credentials, {
        'walletId': walletId
      })) {
        return cb('Wallet already exists');
      }

      root.profile.credentials.push(JSON.parse(walletClient.export()));
      root._setWalletClients();

      root.setAndStoreFocus(walletId, function() {
        storageService.storeProfile(root.profile, function(err) {
          return cb(null);
        });
      });
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

    root.importLegacyWallet = function(username, password, blob, cb) {
      var walletClient = bwcService.getClient();

      walletClient.createWalletFromOldCopay(username, password, blob, function(err) {
        if (err) return cb('Error importing wallet: ' + err);

        $log.debug('Creating Wallet:', walletClient.credentials);
        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root._setWalletClients();
        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, walletClient.credentials.walletName);
          });
        });
      });
    };

    //
    // Up to here was refectored.
    // ===============================================================================
    //

    root.signout = function() {
      root.profile = null;
      root.lastFocusedWallet = null;
    };

    return root;
  });
