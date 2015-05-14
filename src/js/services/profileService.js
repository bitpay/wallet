'use strict';
angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, storageService, bwcService, configService, notificationService, isChromeApp, isCordova, gettext) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};

    root.getUtils = function() {
      return bwcService.getUtils();
    };

    root.formatAmount = function(amount) {
      var config = configService.getSync().wallet.settings;
      if (config.unitCode == 'sat') return amount;

      //TODO : now only works for english, specify opts to change thousand separator and decimal separator
      return this.getUtils().formatAmount(amount, config.unitCode);
    };

    root._setFocus = function(walletId, cb) {
      $log.debug('Set focus:', walletId);

      // Set local object
      if (walletId)
        root.focusedClient = root.walletClients[walletId];
      else 
        root.focusedClient = [];

      if (lodash.isEmpty(root.focusedClient)) {
        root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
      }

      // Still nothing?
      if (lodash.isEmpty(root.focusedClient)) {
        $rootScope.$emit('Local/NoWallets');
      } else {
        $rootScope.$emit('Local/NewFocusedWallet');
      }

      return cb();
    };

    root.setAndStoreFocus = function(walletId, cb) {
      root._setFocus(walletId, function() {
        storageService.storeFocusedWalletId(walletId, cb);
      });
    };

    root.setWalletClients = function() {
      lodash.each(root.profile.credentials, function(credentials) {

        if (root.walletClients[credentials.walletId] &&
          root.walletClients[credentials.walletId].started) {
          return;
        }

        var client = bwcService.getClient(JSON.stringify(credentials));
        root.walletClients[credentials.walletId] = client;
        client.removeAllListeners();


        client.on('reconnect', function() {
          if (root.focusedClient.credentials.walletId == client.credentials.walletId) {
            $rootScope.$emit('Local/Online');
          }
        });


        client.on('reconnecting', function() {
          if (root.focusedClient.credentials.walletId == client.credentials.walletId) {
            $rootScope.$emit('Local/Offline');
          }
        });

        client.on('notification', function(n) {
          $log.debug('BWC Notification:', n);
          notificationService.newBWCNotification(n,
            client.credentials.walletId, client.credentials.walletName);

          if (root.focusedClient.credentials.walletId == client.credentials.walletId) {
            $rootScope.$emit(n.type);
          } else {
            $rootScope.$apply();
          }
        });

        client.on('walletCompleted', function() {
          $log.debug('Wallet completed');

          root.updateCredentialsFC(function() {
            $rootScope.$emit('Local/WalletCompleted')
          });

        });

        root.walletClients[credentials.walletId].started = true;
        root.walletClients[credentials.walletId].doNotVerifyPayPro = isChromeApp;

        client.initNotifications(function(err) {
          if (err) {
            $log.error('Could not init notifications err:', err);
            root.walletClients[credentials.walletId].started = false;
            return;
          }
        });
      });
      $rootScope.$emit('Local/WalletListUpdated');
    };


    root.applyConfig = function() {
      var config = configService.getSync();
      $log.debug('Applying preferences');
      bwcService.setBaseUrl(config.bws.url);
      bwcService.setTransports(['polling']);
    };

    root.bindProfile = function(profile, cb) {
      root.profile = profile;

      configService.get(function(err) {
        $log.debug('Preferences read');
        if (err) return cb(err);
        root.applyConfig();
        $rootScope.$emit('Local/DefaultLanguage');
        root.setWalletClients();
        storageService.getFocusedWalletId(function(err, focusedWalletId) {
          if (err) return cb(err);
          root._setFocus(focusedWalletId, cb);
        });
      });
    };

    root.loadAndBindProfile = function(cb) {
      storageService.getProfile(function(err, profile) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return cb(err);
        }
        if (!profile) {
          // Migration??
          storageService.tryToMigrate(function(err, migratedProfile) {
            if (err) return cb(err);
            if (!migratedProfile)
              return cb(new Error('NOPROFILE: No profile'));

            profile = migratedProfile;
            return root.bindProfile(profile, cb);
          })
        } else {
          $log.debug('Profile read');
          return root.bindProfile(profile, cb);
        }

      });
    };

    root._createNewProfile = function(opts, cb) {

      if (opts.noWallet) {
        return cb(null, Profile.create());
      }

      var walletClient = bwcService.getClient();
      walletClient.createWallet('Personal Wallet', 'me', 1, 1, {
        network: 'livenet'
      }, function(err) {
        if (err) return cb(gettext('Error creating wallet. Check your internet connection'));
        var p = Profile.create({
          credentials: [JSON.parse(walletClient.export())],
        });
        return cb(null, p);
      })
    };

    root.createWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Creating Wallet:', opts);

      if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
        } catch (ex) {
          return cb(gettext('Could not create using the specified extended private key'));
        }
      }
      walletClient.createWallet(opts.name, opts.myName || 'me', opts.m, opts.n, {
        network: opts.networkName
      }, function(err, secret) {
        if (err) return cb(gettext('Error creating wallet'));

        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root.setWalletClients();

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
      if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
        } catch (ex) {
          return cb(gettext('Could not join using the specified extended private key'));
        }
      }
      walletClient.joinWallet(opts.secret, opts.myName || 'me', function(err) {
        if (err) return cb(err);

        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root.setWalletClients();

        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, secret);
          });
        });
      })
    };

    root.deleteWalletFC = function(opts, cb) {
      var fc = root.focusedClient;
      $log.debug('Deleting Wallet:', fc.credentials.walletName);

      fc.removeAllListeners();
      root.profile.credentials = lodash.reject(root.profile.credentials, {
        walletId: fc.credentials.walletId
      });

      delete root.walletClients[fc.credentials.walletId];
      root.focusedClient = null;

      $timeout(function() {
        root.setWalletClients();
        root.setAndStoreFocus(null, function() {
          storageService.storeProfile(root.profile, function(err) {
            if (err) return cb(err);
            return cb();
          });
        });
      });
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
        return cb(gettext('Could not import. Check input file and password'));
      }

      var walletId = walletClient.credentials.walletId;

      // check if exist
      if (lodash.find(root.profile.credentials, {
        'walletId': walletId
      })) {
        return cb(gettext('Wallet already exists'));
      }

      root.profile.credentials.push(JSON.parse(walletClient.export()));
      root.setWalletClients();

      root.setAndStoreFocus(walletId, function() {
        storageService.storeProfile(root.profile, function(err) {
          return cb(null, walletId);
        });
      });
    };

    root.create = function(opts, cb) {
      $log.info('Creating profile');
      configService.get(function(err) {
        root.applyConfig();
        root._createNewProfile(opts, function(err, p) {
          if (err) return cb(err);

          root.bindProfile(p, function(err) {
            storageService.storeNewProfile(p, function(err) {
              return cb(err);
            });
          });
        });
      });
    };

    root.importLegacyWallet = function(username, password, blob, cb) {
      var walletClient = bwcService.getClient();

      walletClient.createWalletFromOldCopay(username, password, blob, function(err, existed) {
        if (err) return cb(gettext('Error importing wallet: ') + err);

        if (root.walletClients[walletClient.credentials.walletId]) {
          $log.debug('Wallet:' + walletClient.credentials.walletName + ' already imported');
          return cb(gettext('Wallet Already Imported: ') + walletClient.credentials.walletName);
        };

        $log.debug('Creating Wallet:', walletClient.credentials.walletName);
        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root.setWalletClients();
        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, walletClient.credentials.walletId, walletClient.credentials.walletName, existed);
          });
        });
      });
    };

    root.updateCredentialsFC = function(cb) {
      var fc = root.focusedClient;

      var newCredentials = lodash.reject(root.profile.credentials, {
        walletId: fc.credentials.walletId
      });
      newCredentials.push(JSON.parse(fc.export()));
      root.profile.credentials = newCredentials;

      storageService.storeProfile(root.profile, cb);
    };


    root.setPrivateKeyEncryptionFC = function(password, cb) {
      var fc = root.focusedClient;
      $log.debug('Encrypting private key for', fc.credentials.walletName);

      fc.setPrivateKeyEncryption(password);
      fc.lock();
      root.updateCredentialsFC(function() {
        $log.debug('Wallet encrypted');
        return cb();
      });
    };


    root.disablePrivateKeyEncryptionFC = function(cb) {
      var fc = root.focusedClient;
      $log.debug('Disabling private key encryption for', fc.credentials.walletName);

      try {
        fc.disablePrivateKeyEncryption();
      } catch (e) {
        return cb(e);
      }
      root.updateCredentialsFC(function() {
        $log.debug('Wallet encryption disabled');
        return cb();
      });
    };

    root.lockFC = function() {
      var fc = root.focusedClient;
      try {
        fc.lock();
      } catch (e) {};
    };

    root.unlockFC = function(cb) {
      var fc = root.focusedClient;
      $log.debug('Wallet is encrypted');
      $rootScope.$emit('Local/NeedsPassword', false, function(err2, password) {
        if (err2 || !password) {
          return cb(err2 || gettext('Password needed'));
        }
        try {
          fc.unlock(password);
        } catch (e) {
          $log.debug(e);
          return cb(gettext('Wrong password'));
        }
        $timeout(function() {
          if (fc.isPrivKeyEncrypted()) {
            $log.debug('Locking wallet automatically');
            root.lockFC();
          };
        }, 2000);
        return cb();
      });
    };

    return root;
  });
