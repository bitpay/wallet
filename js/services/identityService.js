'use strict';

angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, $timeout, $filter, pluginManager, notification, pendingTxsService, balanceService) {
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
        if (!w.isReady()) {
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

    root.create = function(scope, form) {
      $rootScope.starting = true;
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
        if (err || !iden) {
          copay.logger.debug(err);
          if (err && (err.match('EEXISTS') || err.match('BADCREDENTIALS'))) {
            scope.error = 'User already exists!';
          } else {
            scope.error = 'Unknown error when connecting Insight Server';
          }
          $rootScope.starting = false;
          $timeout(function() {
            $rootScope.$digest()
          }, 1);
          return;
        }
        var walletOptions = {
          nickname: iden.fullName,
          networkName: config.networkName,
          requiredCopayers: 1,
          totalCopayers: 1,
          password: iden.password,
          name: 'My wallet',
        };
        iden.createWallet(walletOptions, function(err, wallet) {
          if (err || !wallet) {
            copay.logger.debug(err);
            scope.error = 'Could not create default wallet';
            $rootScope.starting = false;
            $timeout(function() {
              $rootScope.$digest()
            }, 1);
            return;
          }
          root.bind(scope, iden, wallet.id);
        });
      });

    };


    root.open = function(scope, form) {
      $rootScope.starting = true;
      copay.Identity.open({
        email: form.email.$modelValue,
        password: form.password.$modelValue,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      }, function(err, iden) {
        $rootScope.starting = false;
        if (err && !iden) {
          if ((err.toString() || '').match('PNOTFOUND')) {
            scope.error = 'Invalid email or password';
          } else {
            scope.error = 'Unknown error';
          }
          $timeout(function() {
            $rootScope.$digest()
          }, 1);
        } else {

          console.log('[identityService.js.95] LISTO OPEN!!'); //TODO
          var firstWallet = iden.getLastFocusedWallet();
          root.bind(scope, iden, firstWallet);
        }
      });
    };

    root.deleteWallet = function($scope, iden, w) {
      $rootScope.iden.deleteWallet(w.id, function() {
        notification.info(name + ' deleted', $filter('translate')('This wallet was deleted'));
        if ($rootScope.wallet.id === w.id) {
          $rootScope.wallet = null;
          var lastFocused = $rootScope.iden.getLastFocusedWallet();
          root.bind($scope, $rootScope.iden, lastFocused);
        }
      });
    };

    root.isFocused = function(wid) {
      return $rootScope.wallet && wid === $rootScope.wallet.getId();
    };

    root.setupGlobalVariables = function(iden) {
      notification.enableHtml5Mode(); // for chrome: if support, enable it
      $rootScope.unitName = config.unitName;
      $rootScope.pendingTxCount = 0;
      $rootScope.initialConnection = true;
      $rootScope.reconnecting = false;
      $rootScope.isCollapsed = true;

      $rootScope.iden = iden;
    };

    root.setPaymentWallet = function(w) {
      root.setFocusedWallet(w);
      $location.path('/send');
    };

    root.setFocusedWallet = function(w) {
      if (!_.isObject(w))
        w = $rootScope.iden.getWalletById(w);

      preconditions.checkState(w && _.isObject(w));
      $rootScope.wallet = w;
      w.updateFocusedTimestamp(Date.now());
      root.goWalletHome();
      pendingTxsService.update();

      console.log('[controllerUtils.js.221] SET FOCUS'); //TODO
      balanceService.update(w, function() {
        $rootScope.$digest();
      }, true)
    };

    root.installWalletHandlers = function($scope, w) {
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
        console.log('read', w.getName()); //TODO
        $scope.loading = false;
        if ($rootScope.initialConnection) {
          $rootScope.initialConnection = false;
          root.goWalletHome();
        }
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

    root.rebindWallets = function($scope, iden) {
      _.each(iden.listWallets(), function(wallet) {
        preconditions.checkState(wallet);
        root.installWalletHandlers($scope, wallet);
      });
    };

    root.bind = function($scope, iden, w) {
      console.log('ident bind Globals'); //TODO
      root.setupGlobalVariables(iden);
      root.rebindWallets($scope, iden);
      if (w) {
        root.setFocusedWallet(w);
      } else {
        $location.path('/create');
      }
      $timeout(function() {
        console.log('[controllerUtils.js.242] DIGEST'); //TODO
        $rootScope.$digest()
        console.log('[controllerUtils.js.242] DIGEST DONE'); //TODO
      }, 1);
    };

    root.logout = function() {
      if ($rootScope.iden) {
        $rootScope.iden.store(null, function() {
          $rootScope.iden.close();

          delete $rootScope['wallet'];
          delete $rootScope['iden'];

          // Go home reloading the application
          var hashIndex = window.location.href.indexOf('#!/');
          window.location = window.location.href.substr(0, hashIndex);
        });
      }
    };

    root.createWallet = function(opts, cb) {
      $rootScope.iden.createWallet(opts, function(err, w) {
        root.installWalletHandlers($scope, w);
        root.setFocusedWallet(w);
        return cb();
      });
    };

    root.importWallet = function(encryptedObj, pass, opts, cb) {
      copay.Compatibility.importEncryptedWallet($rootScope.iden, encryptedObj,
        pass, opts, function(err, wallet) {
          if (err) return cb(err);
          root.installWalletHandlers($scope, wallet);
          root.setFocusedWallet(wallet);
          return cb();
        });
    };

    root.joinWallet = function(opts, cb) {
      $rootScope.iden.joinWallet(opts, function(err, w) {
        $scope.loading = false;
        if (err || !w) {
          if (err === 'joinError')
            notification.error('Fatal error connecting to Insight server');
          else if (err === 'walletFull')
            notification.error('The wallet is full');
          else if (err === 'badNetwork')
            notification.error('Network Error', 'Wallet network configuration missmatch');
          else if (err === 'badSecret')
            notification.error('Bad secret', 'The secret string you entered is invalid');
          else {
            notification.error('Error', err.message || err);
          }
        } else {
          root.installWalletHandlers($scope, w);
          root.setFocusedWallet(w);
        }
        return cb(err);
      });
    };


    return root;
  });
