(function(window, angular, chrome) {
    'use strict';

    angular.module('app.wallet')
        .controller('WalletCtrl', WalletCtrl);

    WalletCtrl.$inject = ['$scope', '$rootScope', '$log', '$state', '$stateParams', '$timeout', '$ionicPopup', '$ionicModal', '$ionicLoading', 'MAX_WALLETS', 'bitloxWallet', 'Toast', 'bitloxHidChrome', 'bitloxHidWeb', 'bitloxBleApi', '$ionicHistory', 'profileService',  'ongoingProcess', 'walletService', 'popupService', 'gettextCatalog', 'derivationPathHelper', 'bwcService', 'platformInfo'];

    function WalletCtrl($scope, $rootScope,  $log, $state, $stateParams, $timeout, $ionicPopup, $ionicModal, $ionicLoading, MAX_WALLETS, bitloxWallet, Toast, hidchrome, hidweb, bleapi, $ionicHistory, profileService, ongoingProcess, walletService, popupService, gettextCatalog, derivationPathHelper, bwcService, platformInfo) {
        var vm = this;
        var api = hidweb;
        if (platformInfo.isChromeApp) {
          api = hidchrome
        }
        else if(platformInfo.isMobile) {
          api = bleapi;
        }
        $scope.api = api;


        vm.createWallet = function() {
            $ionicLoading.show({template: "Creating Wallet, Check Your BitLox"})
            vm.creatingWallet = true;
            bitloxWallet.create(vm.newWallet.number, vm.newWallet).then(function(res) {

              $ionicLoading.hide()

              $timeout(vm.readWallets.bind(vm), 100)
              bitloxWallet.getBip32().then(function() {
                $timeout(vm.readWallets.bind(vm), 1000).then(function() {
                  _importExtendedPublicKey(wallet)
                });
              })

            }, function() {
              $ionicLoading.hide()
            }).finally(function(res) {
                // reset();
                vm.creatingWallet = false;
            });
        };

        vm.updateWordNumbers = function() {
            if (!vm.userWords) {
                return;
            }
            var words = vm.userWords.split(/\s+/);
            var numbers = [];
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                var wordIndex = wordlist.indexOf(word);
                if (wordIndex < 0) {
                    numbers[i] = "INVALID WORD";
                } else {
                    numbers[i] = wordIndex;
                }
            }
            vm.wordIndexes = numbers;
        };

        vm.resetNewWallet = function() {
            vm.newWallet = {
                name: "Wallet",
                number: 0,
                isSecure: true,
                isHidden: false,
                isRestore: false,
            };
        }
        vm.resetNewWallet()


        // dave says this comes from the import.js file by copay, with edits
        var _importExtendedPublicKey = function(wallet) {
          $ionicLoading.show({
            template: 'Importing BitLox wallet...'
          });
          api.getDeviceUUID().then(function(result) {
            var opts = {};
            opts.singleAddress = false
            opts.externalSource = 'bitlox/'+result.payload.device_uuid.toString('hex')+'/'+wallet._uuid.toString("hex")
            opts.isPrivKeyExternal = true
            opts.extendedPublicKey = wallet.xpub
            opts.derivationPath = derivationPathHelper.default
            opts.derivationStrategy = 'BIP44'
            opts.hasPassphrase = false;
            opts.name = wallet.name;
            opts.account = 0;
            opts.hwInfo = result.payload.device_uuid.toString('hex')+'/'+wallet._uuid.toString("hex");

            var b = bwcService.getBitcore();
            var x = b.HDPublicKey(wallet.xpub);
            opts.entropySource = x.publicKey.toString(); //"40c13cfdbafeccc47b4685d6e7f6a27c";
            opts.account = wallet.number;
            opts.networkName = 'livenet';
            opts.m = 1;
            opts.n = 1;
            opts.singleAddress = false;

            opts.network = 'livenet'
            opts.bwsurl = 'https://bws.bitpay.com/bws/api'

            // console.warn("START IMPORTING")
            profileService.createWallet(opts, function(err, walletId) {
              $ionicLoading.hide()
              // console.warn("DONE IMPORTING")
              if (err) {
                console.error(err)

                profileService.importExtendedPublicKey(opts, function(err2, walletId) {

                  // console.warn("DONE IMPORTING")
                  if (err2) {
                    console.error(err2)
                    popupService.showAlert(gettextCatalog.getString('Error'), err2);
                    return;
                  }


                  walletService.updateRemotePreferences(walletId);
                  $ionicLoading.hide()
                  $ionicHistory.goBack(-3);

                });
                return;
              }

              $ionicLoading.hide()
              walletService.updateRemotePreferences(walletId);
              $ionicHistory.goBack(-3);

            });
          }).catch(function(e) {
            $log.debug("error getting device UUID", e)
          });

        };

        $scope.$watch('api.getStatus()', function(newVal) {
            if(newVal === api.STATUS_CONNECTED) {
                $rootScope.$broadcast('bitloxConnectSuccess')
                console.log($state)
                // only read wallets if we are on the add bitlox screen
                if($state.current.url === '/attach-bitlox') {
                    vm.readWallets(); 
                }
                $timeout.cancel($rootScope.bitloxConnectTimer)
            } else if (newVal === api.STATUS_INITIALIZING) {
                var session = new Date().getTime(true);
                api.initialize(session);
            }
        })

        vm.readWallets = function() {
            $ionicLoading.show({template: "Reading BitLox wallet list, please wait..."})
            vm.readingWallets = true;
            return bitloxWallet.list()
                .then(function(wallets) {
                    vm.wallets = wallets;
                    vm.openWallet = null;
                    vm.refreshAvailableNumbers(wallets);

                }, Toast.errorHandler)
                .finally(function() {
                    $ionicLoading.hide()
                    vm.readingWallets = false;
                });
        };

        vm.loadWallet = function(wallet) {

          $ionicPopup.confirm({
            title: "Link BitLox Wallet #"+wallet.number,
            subTitle: wallet.name,
            cancelText: "Cancel",
            cancelType: 'button-clear button-positive',
            okText: "Yes, Link",
            okType: 'button-clear button-positive'
          }).then(function(res) {
            if(!res) { return false; }

            vm.openWallet = null;
            vm.loadingXpub = true;
            $ionicLoading.show({
                  template: 'Opening Wallet. Check your BitLox...'
                });            // console.debug("loading wallet", wallet.number);
            vm.openingWallet = wallet.number;
            wallet.open()
                .then(function() {
                    vm.openWallet = wallet;
                    console.log("WALLET LOADED")
                    console.log(wallet.xpub)
                    _importExtendedPublicKey(wallet)
                }).catch(function(err) {
                    console.log("OPEN WALLET ERROR", err)
                    $ionicLoading.hide();
                    popupService.showAlert(gettextCatalog.getString('Error'), err);
                })
                .finally(function(status) {
                    console.debug("open notify", status);
                    if (status === bitloxWallet.NOTIFY_XPUB_LOADED) {
                        vm.loadingXpub = false;
                    }
                    console.debug("done loading wallet", wallet.number);
                    vm.openingWallet = -99;    
                });
          });
        };

        vm.directOpenNumber = 0;
        vm.directLoad = function() {
            var wallet;
            vm.wallets.forEach(function(w) {
                if (w.number === vm.directOpenNumber) {
                    wallet = w;
                }
            });
            if (!wallet) {
                wallet = new Wallet({
                    wallet_number: vm.directOpenNumber,
                    version: 4,
                    wallet_name: "HIDDEN",
                    wallet_uuid: "HIDDEN",
                });
            }
            vm.loadWallet(wallet);
        };

        vm.prepForFlash = function() {
            vm.flashing = true;
            api.flash().catch(Toast.errorHandler)
                .finally(function() {
                    vm.flashing = false;
                });
        };


        vm.refreshAvailableNumbers = function(wallets) {
            if (!wallets) {
                return;
            }
            // assemble array of wallet numbers
            var available = [];
            for(var i = 0; i < (MAX_WALLETS + 1); i++) {
                available.push(i);
            }
            // now loop through the wallets and remove existing
            // numbers
            wallets.forEach(function(wallet) {
                available.splice(available.indexOf(wallet.number), 1);
            });
            // set to the vm for the new wallet form
            vm.availableWalletNumbers = available;
            if (available && available.length) {
                // also set some default values for that form
                vm.newWallet.name = "Wallet " + available[0];
                vm.newWallet.number = available[0];
            }
        }


        vm.reset = function() {
            console.log("RESET WALLET CONTROLLER")
            // status variables
            vm.readingWallets = true;
            vm.openingWallet = -99;
            vm.scanningWallet = false;
            vm.creatingWallet = false;
            vm.refreshingBalance = false;
            vm.openWallet = null;
            vm.timer = false;

            $ionicLoading.show({template: "Connecting to BitLox, please wait...",duration:5000})
            $timeout(function() {
                vm.timer = true;
            },5000);            
            if(platformInfo.isChromeApp) {
                // api.close().then(function() {api.device()})
                api.device().then(function() {
                    if(api.getStatus() === api.STATUS_IDLE) {
                        vm.readWallets();
                    }
                })
            }
        }



        vm.reset();


        // $scope.$watch('api.getStatus()', function(hidstatus) {
        //   checkStatus(hidstatus)
        //   $scope.prevStatus = hidstatus;
        // });

        // function checkStatus(hidstatus) {
        //   console.warn("New device status: " + hidstatus)
        //   switch(hidstatus) {
        //   case api.STATUS_DISCONNECTED:
        //       if(!platformInfo.isIOS && $scope.prevStatus && $scope.prevStatus !== api.STATUS_DISCONNECTED) {
        //         $ionicLoading.hide();
        //         popupService.showAlert(gettextCatalog.getString('Error'), "BitLox Disconnected.");

        //       }
        //       break;
        //   }
        // }
    }

})(window, window.angular, window.chrome);
