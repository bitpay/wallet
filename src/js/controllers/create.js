'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $timeout, $log, lodash, $state, $ionicScrollDelegate, $ionicHistory, profileService, configService, gettextCatalog, ledger, trezor, intelTEE, derivationPathHelper, ongoingProcess, walletService, storageService, popupService, appConfigService, pushNotificationsService, $http, $q, bitcore, CUSTOMNETWORKS) {

    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.formData = {};
      var defaults = configService.getDefaults();
      var tc = $state.current.name == 'tabs.add.create-personal' ? 1 : defaults.wallet.totalCopayers;
      $scope.formData.account = 1;
      $scope.formData.bwsurl = defaults.bws.url;
      $scope.TCValues = lodash.range(2, defaults.limits.totalCopayers + 1);
      $scope.formData.derivationPath = derivationPathHelper.getDefault('livenet');
      $scope.setTotalCopayers(tc);
      updateRCSelect(tc);
      resetPasswordFields();
      $scope.networks = CUSTOMNETWORKS;
      $scope.network = CUSTOMNETWORKS['livenet']
    });

    $scope.showNetworkSelector = function() {
      $scope.networkSelectorTitle = gettextCatalog.getString('Select currency');
      $scope.showNetworks = true;
    };
    $scope.onNetworkSelect = function(network) {
      $scope.network = network
      $scope.formData.derivationPath = derivationPathHelper.getDefault(network.name);
      $scope.formData.bwsurl = network.bwsUrl;
    }


    $scope.showAdvChange = function() {
      $scope.showAdv = !$scope.showAdv;
      $scope.encrypt = null;
      $scope.resizeView();
    };

    $scope.checkPassword = function(pw1, pw2) {
      if (pw1 && pw1.length > 0) {
        if (pw2 && pw2.length > 0) {
          if (pw1 == pw2) $scope.result = 'correct';
          else {
            $scope.formData.passwordSaved = null;
            $scope.result = 'incorrect';
          }
        } else
          $scope.result = null;
      } else
        $scope.result = null;
    };

    $scope.resizeView = function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 10);
      resetPasswordFields();
    };

    function resetPasswordFields() {
      $scope.formData.passphrase = $scope.formData.createPassphrase = $scope.formData.passwordSaved = $scope.formData.repeatPassword = $scope.result = null;
      $timeout(function() {
        $scope.$apply();
      });
    };

    function updateRCSelect(n) {
      $scope.formData.totalCopayers = n;
      var maxReq = COPAYER_PAIR_LIMITS[n];
      $scope.RCValues = lodash.range(1, maxReq + 1);
      $scope.formData.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    function updateSeedSourceSelect(n) {
      var seedOptions = [{
        id: 'new',
        label: gettextCatalog.getString('Random'),
        supportsTestnet: true
      }, {
        id: 'set',
        label: gettextCatalog.getString('Specify Recovery Phrase...'),
        supportsTestnet: false
      }];

      $scope.formData.seedSource = seedOptions[0];

      /*

      Disable Hardware Wallets for BitPay distribution

      */

      if (appConfigService.name == 'copay') {
        if (n > 1 && walletService.externalSource.ledger.supported)
          seedOptions.push({
            id: walletService.externalSource.ledger.id,
            label: walletService.externalSource.ledger.longName,
            supportsTestnet: walletService.externalSource.ledger.supportsTestnet
          });

        if (walletService.externalSource.trezor.supported) {
          seedOptions.push({
            id: walletService.externalSource.trezor.id,
            label: walletService.externalSource.trezor.longName,
            supportsTestnet: walletService.externalSource.trezor.supportsTestnet
          });
        }

        if (walletService.externalSource.intelTEE.supported) {
          seedOptions.push({
            id: walletService.externalSource.intelTEE.id,
            label: walletService.externalSource.intelTEE.longName,
            supportsTestnet: walletService.externalSource.intelTEE.supportsTestnet
          });
        }
      }

      $scope.seedOptions = seedOptions;
    };

    $scope.setTotalCopayers = function(tc) {
      $scope.formData.totalCopayers = tc;
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
    };


    $scope.getCustomNetwork = function() {
      var def = $q.defer();
      if($scope.formData.customParam) {
        networkName = $scope.formData.customParam
        // check apple approved list on iOS, and the full list of whatever we can support for Android
        var customNet = CUSTOMNETWORKS[$scope.formData.customParam]
        if(customNet) {
          def.resolve(customNet)
        } else {
          // check previously imported custom nets
          var customNetworks = storageService.getCustomNetworks(function(err, customNetworkListRaw) {
            if(!customNetworkListRaw) {
              customNetworkList = {};
            } else {
              customNetworkList = JSON.parse(customNetworkListRaw)
            }
            // try getting it from bitlox website
            $http.get("https://btm.bitlox.com/coin/"+networkName+".php").then(function(response){
              if(!response) {
                def.reject();
              }
              var res = response.data;
              res.pubkeyhash = parseInt(res.pubkeyhash,16)
              res.privatekey = parseInt(res.privatekey,16)
              res.scripthash = parseInt(res.scripthash,16)
              res.xpubkey = parseInt(res.xpubkey,16)
              res.xprivkey = parseInt(res.xprivkey,16)
              res.networkMagic = parseInt(res.magic,16)
              res.port = parseInt(res.port, 10)
              customNetworkList[$scope.formData.customParam] = res;
              CUSTOMNETWORKS[$scope.formData.customParam] = res;
              storageService.setCustomNetworks(JSON.stringify(customNetworkList));
              bitcore.Networks.add(res)
              def.resolve(res)
            }, function(err) {
              console.warn(err)
              def.reject();
            })

          })
 
        }
      } else {
        return $q.resolve();
      }
      return def.promise;

    }

    $scope.create = function(form) {
      if (form && form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the required fields'));
        return;
      }
      var networkName = $scope.network.name
      if($scope.formData.customParam) {
        networkName = $scope.formData.customParam;
      }

      if($scope.formData.customParam) {
        networkName = $scope.formData.customParam
        var customNet = CUSTOMNETWORKS[$scope.formData.customParam]
        if(!customNet) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid') + ": " + $scope.formData.customParam);
          return;
        }
        bwsUrl = customNet.bwsUrl
      }
      var opts = {
        name: $scope.formData.walletName,
        m: $scope.formData.requiredCopayers,
        n: $scope.formData.totalCopayers,
        myName: $scope.formData.totalCopayers > 1 ? $scope.formData.myName : null,
        networkName: networkName,
        bwsurl: $scope.formData.bwsurl,
        singleAddress: $scope.formData.singleAddressEnabled,
        walletPrivKey: $scope.formData._walletPrivKey, // Only for testing
      };

      var setSeed = $scope.formData.seedSource.id == 'set';
      if (setSeed) {

        var words = $scope.formData.privateKey || '';
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = $scope.formData.passphrase;

        var pathData = derivationPathHelper.parse($scope.formData.derivationPath);
        if (!pathData) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
          return;
        }

        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;

      } else {
        opts.passphrase = $scope.formData.createPassphrase;
      }

      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase'));
        return;
      }

      if ($scope.formData.seedSource.id == walletService.externalSource.ledger.id || $scope.formData.seedSource.id == walletService.externalSource.trezor.id || $scope.formData.seedSource.id == walletService.externalSource.intelTEE.id) {
        var account = $scope.formData.account;
        if (!account || account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
          return;
        }

        if ($scope.formData.seedSource.id == walletService.externalSource.trezor.id || $scope.formData.seedSource.id == walletService.externalSource.intelTEE.id)
          account = account - 1;

        opts.account = account;
        ongoingProcess.set('connecting ' + $scope.formData.seedSource.id, true);

        var src;
        switch ($scope.formData.seedSource.id) {
          case walletService.externalSource.ledger.id:
            src = ledger;
            break;
          case walletService.externalSource.trezor.id:
            src = trezor;
            break;
          case walletService.externalSource.intelTEE.id:
            src = intelTEE;
            break;
          default:
            popupService.showAlert(gettextCatalog.getString('Error'), 'Invalid seed source id');
            return;
        }

        src.getInfoForNewWallet(opts.n > 1, account, opts.networkName, function(err, lopts) {
          ongoingProcess.set('connecting ' + $scope.formData.seedSource.id, false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          opts = lodash.assign(lopts, opts);
          _prepareToCreate(opts);
        });
      } else {
        _prepareToCreate(opts);
      }

    };

    function _prepareToCreate(opts) {
      $scope.getCustomNetwork().then(function(customNet) {
        if(customNet) {
          opts.derivationStrategy = "BIP44";
          opts.bwsurl = customNet.bwsUrl
        }
        _create(opts)
      }, function(err) {
        if($scope.formData.customParam) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid') + ": " + $scope.formData.customParam);
        } else {
          // user did not ask for custom network, do nothing
          _create(opts)
        }
      })      
    }

    function _create(opts) {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {
        profileService.createWallet(opts, function(err, client) {
          ongoingProcess.set('creatingWallet', false);
          if (err) {
            $log.warn(err);
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client);
          pushNotificationsService.updateSubscription(client);

          if ($scope.formData.seedSource.id == 'set') {
            profileService.setBackupFlag(client.credentials.walletId);
          }

          $ionicHistory.removeBackView();

          if (!client.isComplete()) {
            $ionicHistory.nextViewOptions({
              disableAnimate: true
            });
            $state.go('tabs.home');
            $timeout(function() {
              $state.transitionTo('tabs.copayers', {
                walletId: client.credentials.walletId
              });
            }, 100);
          } else $state.go('tabs.home');
        });
      }, 300);
    }
  });
