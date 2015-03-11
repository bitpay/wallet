'use strict';
angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, $state, $timeout, $filter, pluginManager, notification, pendingTxsService, balanceService, applicationService, go, localStorageService) {

    // TODO:
    // * remove iden from rootScope
    // * remove wallet from rootScope
    // * create walletService

    var root = {};

    var checkIfExist = function(username) {
      return localStorageService.get(username);
    };

    root.isAuthenticated = function() {
      return $rootScope.iden;
    };

    root.open = function(username, password, cb) {
      var localUser = checkIfExist(username);
      if (localUser && password === localUser.password ) {
        $rootScope.iden = localUser;
        $state.go('home');
      }
      else {
        return cb('Username or password are incorrects');
      }
    };
    
    root.create = function(username, password, cb) {
      var newUser = {
        username: username,
        password: password,
        wallets: {}
      };
      
      if (checkIfExist(newUser)) {
        return cb('The user already exists');
      }

      if (localStorageService.set(username, newUser)) {
        $rootScope.iden = newUser;
        $state.go('home');
      }
      else {
        return cb('Can not save on localStorage');
      }
    };

    root.delete = function(cb) {
      if ($rootScope.iden) {
        var name = $rootScope.iden.name;
        if (localStorageService.remove(name)) {
          root.signout();
        }
        else {
          return cb('Error when trying to delete profile');
        }
      }
    };

    root.signout = function() {
      if ($rootScope.iden) {
        $rootScope.iden = null;
        $rootScope.wallets = null;
        $rootScope.currentWallet = null;
        $rootScope.offline = null;
        $state.go('signin');
      }
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
