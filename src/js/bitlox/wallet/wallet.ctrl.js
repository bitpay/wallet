(function(window, angular, chrome) {
    'use strict';

    angular.module('app.wallet')
        .controller('WalletCtrl', WalletCtrl);

    WalletCtrl.$inject = ['$scope', '$rootScope', '$log', '$state', '$stateParams', '$timeout', '$ionicPopup', '$ionicModal', '$ionicLoading', 'MAX_WALLETS', 'bitloxWallet', 'Toast', 'bitloxHidChrome', 'bitloxHidWeb', 'bitloxBleApi', '$ionicHistory', 'profileService',  'ongoingProcess', 'walletService', 'popupService', 'gettextCatalog', 'derivationPathHelper', 'bwcService', 'platformInfo'];

    function WalletCtrl($scope, $rootScope,  $log, $state, $stateParams, $timeout, $ionicPopup, $ionicModal, $ionicLoading, MAX_WALLETS, bitloxWallet, Toast, hidchrome, hidweb, bleapi, $ionicHistory, profileService, ongoingProcess, walletService, popupService, gettextCatalog, derivationPathHelper, bwcService, platformInfo) {

        var api = hidweb;
        if (platformInfo.isChromeApp) {
          api = hidchrome
        }
        else if(platformInfo.isMobile) {
          api = bleapi;
          api.initializeBle();
        }
        $scope.api = api;



        $scope.bitlox = {
          isMobile: platformInfo.isMobile,
          connectAttempted: false,
          connected: false,
          statusString: "No Bitlox",
          alertClass: "danger"
        }

        $scope.wallet = {
          status: null,
          alertClass: "warning"
        };


        $scope.getEntropy = function(data) {
          api.getEntropy(1024).then(function(data) {

            console.warn("ENTROPY SUCCESS "+data.payload.entropy)
          }).catch(function(e) {
            console.warn("ENTROPY FAILURE")
            console.warn(e)
          });
        }
        $scope.ping = function(data) {
          api.ping({greeting:"wbalbadubs"}).then(function(data) {

            console.warn("PING SUCCESS "+data.payload.echoed_greeting + " " + data.payload.echoed_session_id)
          }).catch(function(e) {
            console.warn("PING FAILURE")
            console.warn(e)
          });
        }
        $scope.refreshBitlox = function($event) {

          if(platformInfo.isMobile) {
            api.startScanNew();
            $timeout(function() {
              api.stopScan();
            },60000)
          }
        }
        $scope.connectBle = function(address) {
          $ionicLoading.show({
            template: 'Connecting to BitLox, Please Wait...'
          });
          // console.log('connecting to '+address)

          api.connect(address).then(function() {
          }, function(err) {
            $log.debug("BitLox Connection Error", err)
            api.disconnect();
          }).finally(function() {

          })

        }



        $scope.createWallet = function() {
            $ionicLoading.show({template: "Creating Wallet, Check Your BitLox"})
            $scope.creatingWallet = true;
            bitloxWallet.create($scope.newWallet.number, $scope.newWallet).then(function(res) {

              $ionicLoading.hide()

              $timeout($scope.readWallets.bind(vm), 100)
              bitloxWallet.getBip32().then(function() {
                $timeout($scope.readWallets.bind(vm), 1000).then(function() {
                  _importExtendedPublicKey(wallet)
                  $scope.resetNewWallet()
                });
              })

            }, function() {
              $ionicLoading.hide()
            }).finally(function(res) {
                // reset();
                $scope.creatingWallet = false;
            });
        };

        $scope.updateWordNumbers = function() {
            if (!$scope.userWords) {
                return;
            }
            var words = $scope.userWords.split(/\s+/);
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
            $scope.wordIndexes = numbers;
        };

        $scope.resetNewWallet = function() {
            $scope.newWallet = {
                name: "Wallet",
                number: 0,
                isSecure: true,
                isHidden: false,
                isRestore: false,
            };
        }
        $scope.resetNewWallet()


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
            opts.derivationPath = derivationPathHelper.getDefault('livenet')
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
            opts.bwsurl = 'https://bws.bitlox.com/bws/api'

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

                  $scope.updateDeviceQr(walletId, function() {
                    $ionicLoading.hide()
                    $ionicHistory.goBack(-3);
                  })


                });
                return;
              }
              $scope.updateDeviceQr(walletId, function() {
                $ionicLoading.hide()
                $ionicHistory.goBack(-3);
              })

              

            });
          }).catch(function(e) {
            $log.debug("error getting device UUID", e)
          });

        };

        $scope.updateDeviceQr = function(walletId, cb) {
          walletService.getMainAddresses(walletId, {reverse:true}, function(err, addresses) {
            return cb();
            // if(addresses.length > 0) {
            //   var sp = addresses[0].path.split('/')
            //   var p = parseInt(sp.pop(),10);
                
            //   api.setQrCode(p+1);              
            // }
            // cb();
          });
        }
        $scope.$watch('api.getBleReady()', function(newVal) {
          if(newVal) {
            $scope.refreshBitlox()
          }
        });
        $scope.$watch('api.getStatus()', function(hidstatus) {


          // console.warn("New device status: " + hidstatus)
          switch(hidstatus) {
              case api.STATUS_CONNECTED:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox connected";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-ok";

                    $rootScope.$broadcast('bitloxConnectSuccess')
                    // only read wallets if we are on the add bitlox screen
                    if($state.current.url === '/attach-bitlox') {
                        $scope.readWallets(); 
                    }
                    $timeout.cancel($rootScope.bitloxConnectTimer)              
                  break;
              case api.STATUS_IDLE:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox idle";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-ok";
                  break;
              case api.STATUS_CONNECTING:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = false;
                  $scope.bitlox.statusString = "Bitlox connecting";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-refresh";
                  break;
              case api.STATUS_INITIALIZING:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = false;
                  $scope.bitlox.statusString = "Bitlox initializing";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-refresh";
                    $scope.initializeDevice();              
                  break;          
              case api.STATUS_DISCONNECTED:
                  $scope.bitlox.statusString = "Bitlox disconnected!";
                  $scope.bitlox.alertClass = "danger";
                  $scope.bitlox.glyph = "glyphicon-remove";
                  $scope.bitlox.connected = false;

                  if($scope.wallet.status && $scope.wallet.status !== api.STATUS_DISCONNECTED) {
                    console.log("disconnected error")
                    $scope.wallet.status = hidstatus;
                    if($scope.timer) {
                        $ionicLoading.hide();
                        if($state.current.url === '/create-bitlox') {
                            $ionicHistory.goBack();
                        } 
                        if ($state.current.url === '/attach-bitlox') {
                            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('BitLox Connection Error'));
                        }                        
                    }
                  }                              
                  break;
              case api.STATUS_WRITING:
                  $scope.bitlox.connectAttempted = true;
                  // $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox writing";
                  $scope.bitlox.alertClass = "info";
                  $scope.bitlox.glyph = "glyphicon-upload";
                  break;
              case api.STATUS_READING:
                  $scope.bitlox.connectAttempted = true;
                  // $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox reading";
                  $scope.bitlox.alertClass = "info";
                  $scope.bitlox.glyph = "glyphicon-download";
                  break;
              default:
                  $scope.bitlox.connected = false;
                  $scope.bitlox.statusString = null;
          }

          $scope.wallet.status = hidstatus;

        })

        $scope.readWallets = function() {
            $ionicLoading.show({template: "Reading BitLox wallet list, please wait..."})
            $scope.readingWallets = true;
            return bitloxWallet.list()
                .then(function(wallets) {
                    $scope.wallets = wallets;
                    $scope.openWallet = null;
                    $scope.refreshAvailableNumbers(wallets);

                }, Toast.errorHandler)
                .finally(function() {
                    $ionicLoading.hide()
                    $scope.readingWallets = false;
                });
        };

        $scope.loadWallet = function(wallet) {

          $ionicPopup.confirm({
            title: "Link BitLox Wallet #"+wallet.number,
            subTitle: wallet.name,
            cancelText: "Cancel",
            cancelType: 'button-clear button-positive',
            okText: "Yes, Link",
            okType: 'button-clear button-positive'
          }).then(function(res) {
            if(!res) { return false; }

            $scope.openWallet = null;
            $scope.loadingXpub = true;
            $ionicLoading.show({
                  template: 'Opening Wallet. Check your BitLox...'
                });            // console.debug("loading wallet", wallet.number);
            $scope.openingWallet = wallet.number;
            wallet.open()
                .then(function() {
                    $scope.openWallet = wallet;
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
                        $scope.loadingXpub = false;
                    }
                    console.debug("done loading wallet", wallet.number);
                    $scope.openingWallet = -99;    
                });
          });
        };

        $scope.directOpenNumber = 0;
        $scope.directLoad = function() {
            var wallet;
            $scope.wallets.forEach(function(w) {
                if (w.number === $scope.directOpenNumber) {
                    wallet = w;
                }
            });
            if (!wallet) {
                wallet = new Wallet({
                    wallet_number: $scope.directOpenNumber,
                    version: 4,
                    wallet_name: "HIDDEN",
                    wallet_uuid: "HIDDEN",
                });
            }
            $scope.loadWallet(wallet);
        };

        $scope.prepForFlash = function() {
            $scope.flashing = true;
            api.flash().catch(Toast.errorHandler)
                .finally(function() {
                    $scope.flashing = false;
                });
        };


        $scope.refreshAvailableNumbers = function(wallets) {
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
            $scope.availableWalletNumbers = available;
            if (available && available.length) {
                // also set some default values for that form
                $scope.newWallet.name = "Wallet " + available[0];
                $scope.newWallet.number = available[0];
            }
        }

        $scope.initializeDevice = function() {
            var session = new Date().getTime(true);
            api.initialize(session).then(function(res) {
                if(!res || res.type === api.TYPE_ERROR) {
                    $ionicLoading.hide();
                    popupService.showAlert(gettextCatalog.getString('Error'), "BitLox Initialization Error.");
                    api.disconnect();
                }
            });            
        }
        $scope.reset = function() {
            // status variables
            $scope.readingWallets = true;
            $scope.openingWallet = -99;
            $scope.scanningWallet = false;
            $scope.creatingWallet = false;
            $scope.refreshingBalance = false;
            $scope.openWallet = null;
            $scope.timer = false;

            $ionicLoading.show({template: "Finding BitLox, please wait...",duration:3000})
            $timeout(function() {
                $scope.timer = true;
            },3000);            
            if(platformInfo.isChromeApp) {

                // api.disconnect().then(function() {
                    $timeout(function() {
                        api.device().then(function() {
                            if(api.getStatus() === api.STATUS_IDLE) {
                                $scope.readWallets();
                            }
                        })
                    },1000);
                // })
            } else {
                if(api.getStatus() === api.STATUS_IDLE) {
                    $scope.readWallets();
                }                
            }
        }



        $scope.reset();

    }

})(window, window.angular, window.chrome);
