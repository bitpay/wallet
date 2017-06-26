(function(window, angular, async) {
    'use strict';

    angular.module('app.wallet')
        .factory('bitloxWallet', WalletFactory);

    WalletFactory.$inject = [
        '$rootScope', '$q', '$timeout',
        'WalletStatus', '$state', 
         'bitloxHidChrome', 'bitloxHidWeb', 'bitloxBleApi', 'BIP32', 'bitloxTransaction', 'addressInfo', 'MIN_OUTPUT', 'bcMath', 'platformInfo',
         '$ionicLoading',  '$ionicModal', '$log', 'lodash', 'txUtil'
      ];

    function WalletFactory(
        $rootScope, $q, $timeout,
        WalletStatus, $state,
        hidchrome,hidweb, bleapi, BIP32, Transaction, addressInfo, MIN_OUTPUT, bcMath, platformInfo,
        $ionicLoading, $ionicModal, $log, lodash, txUtil) {

        var Wallet = function(data) {
            this.number = data.wallet_number;
            this.version = data.version;
            this._name = data.wallet_name;
            this._uuid = data.wallet_uuid;
            this.addresses = {
                receive: {},
                change: {}
            };
            this.balance = 0;
            this.unspent = [];
            this.transactions = [];
        };

        var api = hidweb;
        if (platformInfo.isChromeApp) {
          api = hidchrome
        }
        else if(platformInfo.isMobile) {
          api = bleapi;
        }
        Wallet.NOTIFY_XPUB_LOADED = 'xpub loaded';

        Object.defineProperty(Wallet.prototype, 'name', {
            get: function() {
                if (!this._name || !this._name.toString) {
                    return "";
                }
                return this._name.toString("utf8");
            }
        });

        Object.defineProperty(Wallet.prototype, 'uuid', {
            get: function() {
                if (!this._uuid || !this._uuid.toString) {
                    return "";
                }
                return this._uuid.toString("utf8");
            }
        });

        Object.defineProperty(Wallet.prototype, 'isSecure', {
            get: function() {
                return this.version === 3;
            }
        });

        Object.defineProperty(Wallet.prototype, 'isHidden', {
            get: function() {
                return this.version === 4;
            }
        });

        Wallet.list = function() {

            return api.listWallets().then(function(res) {
                var wallets = [];
                res.payload.wallets.forEach(function(data) {
                    wallets.push(new Wallet(data));
                });
                return wallets;
            }, function(err) {
              console.error('listWallets call failed')
              console.error(err)
            });
        };

        Wallet.create = function(walletNumber, options) {
            return api.newWallet(walletNumber, options);
        };

        // scan the currently open wallet and get the bip32 source key
        // from the data
        Wallet.getBip32 = function(wallet) {
            return api.scanWallet().then(function(data) {
                var bip32;
                try {
                    bip32 = new BIP32(data.payload.xpub);
                } catch(ex) {
                    console.error(ex);
                    return $q.reject(ex);
                }
                wallet.xpub = data.payload.xpub;
                wallet.bip32 = bip32;
                // now that we have addresses, update the balance for
                // the wallet
                // return wallet.updateBalance(); dave says we don't need this anymore
            });
        };
        Wallet.signTransaction = function(wallet, txp, cb) {
        if(api.getStatus() === api.STATUS_CONNECTED || api.getStatus() === api.STATUS_IDLE) {
            console.log('device is already connected, proceed with transaction:'+api.getStatus())
            $rootScope.bitloxConnectErrorListener = $rootScope.$on('bitloxConnectError', function() {
              cb(new Error("BitLox Disconnected"));
            })      
            return _bitloxSend(wallet,txp,cb)
          } else {
            var newScope = $rootScope.$new();
            var successListener;
            var errorListener
            $ionicModal.fromTemplateUrl('views/bitlox/tab-attach-bitlox.html', {
                scope: newScope,
                animation: 'slide-in-up',
                hardwareBackButtonClose: false
              }).then(function(modal) {
                newScope.modal = modal;
                newScope.modal.show();
              }).catch(function(err) {
                $log.debug('modal error', err)
              });
              newScope.closeModal = function() {
                newScope.modal.remove();
              };
              // Cleanup the modal when we're done with it!
              newScope.$on('$destroy', function() {
                newScope.modal.remove();
              });
              // Execute action on hide modal
              newScope.$on('modal.hidden', function() {
                // Execute action
              });

              newScope.$on('modal.removed', function() {
                // Execute action
                successListener()
                errorListener()
                $rootScope.bitloxConnectErrorListener = $rootScope.$on('bitloxConnectError', function() {
                  cb(new Error("BitLox Disconnected"));
                })      
                console.log("BitLox connection successful, signing...")
                $timeout(function() {_bitloxSend(wallet,txp,cb)})
              });
              successListener = newScope.$on('bitloxConnectSuccess', function() {
                // Execute action
                newScope.modal.remove()
              });
              errorListener = newScope.$on('bitloxConnectError', function() {

                // Execute action
              });
          }
        }
        function _bitloxSend(wallet,txp,cb) {

            if(api.getStatus() !== api.STATUS_CONNECTED && api.getStatus() !== api.STATUS_IDLE) {
              return cb(new Error("Unable to connect to BitLox"))
            }          
            $ionicLoading.show({
              template: 'Connecting to BitLox, Please Wait...'
            });

            try {

              var tx = new Transaction({
                  outputs: txp.outputs,
                  fee: txp.fee,
                  inputs: txp.inputs,
                  changeAddress: txp.changeAddress.address,
                  // forceSmallChange: forceSmallChange,
              });
            } catch(e) {
              return cb(e)
            }
            tx.bwsInputs = txp.inputs


            $log.info('Requesting Bitlox to sign the transaction');
            var xPubKeys = lodash.pluck(wallet.credentials.publicKeyRing, 'xPubKey');
            // var opts = {tx: txp, rawTx: bwcService.getUtils().buildTx(txp).uncheckedSerialize()}
            if(!xPubKeys) {
              return cb(new Error("Unable to connect to BitLox, pub key error"))
            }
            $log.debug('xPubKeys', xPubKeys)

            return api.getDeviceUUID().then(function(results) {
              console.log('got device UUID, finding wallet')
              var externalSource = wallet.getPrivKeyExternalSourceName()
              var bitloxInfo = externalSource.split('/')
              if(!results) {
                return cb(new Error('Unable to get BitLox device information. Try reconnecting the BitLox'))
              }
              if(bitloxInfo[1] !== results.payload.device_uuid.toString('hex')) {
                return cb(new Error('This wallet is not on the connected BitLox device or has been moved. Select the correct Bitlox or contact support.'))
              }
              $ionicLoading.show({
                template: 'Opening Wallet. Check Your BitLox...'
              });

              return api.listWallets()
              .then(function(res) {

                if(!res || res.type === api.TYPE_ERROR) {
                  return cb(new Error('BitLox wallet connection error'))
                }

                var wallets = [];
                res.payload.wallets.forEach(function(data) {
                    wallets.push(new Wallet(data));
                });
                for(var i=0; i<wallets.length;i++) {
                  var thisWallet = wallets[i]

                  if(thisWallet._uuid.toString("hex") === bitloxInfo[2]) {
                    return thisWallet.open()
                    .then(function() {

                        $log.debug("WALLET LOADED", thisWallet.xpub)
                        $ionicLoading.show({
                          template: 'Preparing Transaction. Please Wait...'
                        });
                        if(thisWallet.xpub !== xPubKeys[0]) {
                          $log.debug('pubkeys do not match')
                          return cb(new Error('pubkeys do not match'))
                        }
                        var changeIndex = txp.changeAddress.path.split('/')[2]
                        $log.debug('changeIndex', changeIndex)
                        return api.setChangeAddress(changeIndex).then(function() {
                          $log.debug('Done setting change address')
                          $ionicLoading.show({
                            template: 'Signing Transaction. Check Your BitLox...'
                          });
                          return api.signTransaction(tx)
                          .then(function(result) {
                            $log.debug('Bitlox response', result);
                            if(!result) {
                              return cb(new Error('Unable to get signatures from BitLox. Try reconnecting the BitLox'))
                            }                            
                            if(result.type === api.TYPE_SIGNATURE_RETURN) {
                              txp.signatures = result.payload.signedScripts;
                              tx.replaceScripts(txp.signatures)
                              $ionicLoading.show({
                                template: 'Broadcasting Transaction. Please Wait...'
                              });
                              // comment out thes 5 lines and send `return cb(null,txp) to skip broadcast`
                              return txUtil.submit(tx.signedHex).then(function() {
                                return cb(null, txp)
                              }, function(err) {
                                return cb(err)
                              })
                              // return cb(null,txp)
                            } else {
                              $log.debug('TX signing error')
                              if(platformInfo.isMobile) {
                                return cb(new Error(result.type.error_message))
                              } else {
                                return cb(new Error(result))
                              }
                            }
                          }, function(err) {
                            $log.debug("TX sign error", err)
                            return cb(err)
                          })
                        }, function(err) {
                          $log.debug("setChangeAddress error", err)
                          return cb(err)
                        })
                    }, function(err) {
                      $log.debug('load wallet error', err)
                      return cb(err)
                    })
                  }
                }
                return cb(new Error('This wallet is not on the connected BitLox device or has been moved. Select the correct Bitlox or contact support.'))

              }, function(e) {
                $log.debug('Bitlox wallet list error', e)
                return cb(e)
              })
            }, function(e) {
              $log.debug('cannot get device uuid', e)

              return cb(e)
            })
        }


        Wallet.prototype.clearSpent = function(inputs) {
            var wallet = this;
            wallet.balance = 0;
            wallet.unspent = [];
            inputs.forEach(function(input) {
                var addrType = input.chain;
                var txid = input.tx_hash_big_endian;
                var addresses = wallet.addresses[addrType];
                Object.keys(addresses).forEach(function(address) {
                    var addrData = addresses[address];
                    var newUnspent = [];
                    addrData.unspent.forEach(function(output) {
                        if (txid !== output.tx_hash_big_endian) {
                            newUnspent.push(output);
                        }
                    });
                    addrData.unspent = newUnspent;
                });
                wallet.recalculateBalance(addrType);
            });
            // then also do a balance update after a timeout,
            // so we get the data we actually need for the
            // unspent outputs we have
            $timeout(function() {
                wallet.updatingBalance = true;
                wallet.updateBalance();
                wallet.loadTransactions();
            }, 5000);
        };

        // add up the unspent outputs on each input
        Wallet.prototype.recalculateBalance = function(addrType) {
            var wallet = this;
            var addresses = wallet.addresses[addrType];
            Object.keys(addresses).forEach(function(address) {
                var addrData = addresses[address];
                wallet.unconfirmedBalance += addrData.unconfirmedBalance;
                wallet.balance += addrData.balance;
            });
        };

        Wallet.prototype.getAllAddresses = function() {
            var wallet = this;
            var deferred = $q.defer();
            WalletStatus.status = WalletStatus.STATUS_LOADING_UNSPENT;
            async.each([
                "receive",
                "change"
            ], function(addrType, done) {
                var hasAll = false;
                var index = 0;
                console.debug("getting", addrType, "addresses");
                async.until(function() {
                    return hasAll;
                }, function(next) {
                    // generate the address for this index
                    var address = wallet.bip32.generateAddress(addrType, index);
                    address.chain = addrType;
                    address.chainIndex = index;
                    address.balance = 0;
                    address.unconfirmedBalance = 0;
                    // get the received amount for this address
                    addressInfo.getReceived(address.pub).then(function(received) {
                        address.received = received;
                        address.balance = received.balanceSat - (received.unconfirmedBalanceSat || 0);
                        if (address.balance < 0) {
                            address.balance = 0;
                        }
                        address.unconfirmedBalance = received.unconfirmedBalanceSat || 0;
                        if (address.unconfirmedBalance < 0) {
                            address.unconfirmedBalance = 0;
                        }
                        if (received.totalReceivedSat > 0 || received.unconfirmedBalanceSat > 0) {
                            // increment the index for the next run
                            index += 1;
                            // and increment the bip key's address count
                            wallet.bip32.keyCount[addrType] += 1;
                            // add the address to the wallet
                            wallet.addresses[addrType][address.pub] = address;
                            // then continue, generating a new address
                            return next();
                            // if we have received anything, look for unspent outputs
                        } else {
                            // otherwise just set unspent to an empty
                            // array and move on.
                            address.unspent = [];
                            // set to true, to indicate that we do not
                            // need to generate any more addresses
                            hasAll = true;
                            // add the address to the wallet
                            wallet.addresses[addrType][address.pub] = address;
                            // then continue --> this must be masked when actually sending
                            if (addrType === 'receive') {
                                wallet.nextAddress = address;
                                api.showQr(index);
                            }
                            if (addrType === 'change') {
                                api.setChangeAddress(index);
                            }
                            return next();
                        }
                    }, next); // pass in callback as promise failure function
                }, done);
            }, function(err) {
                if (err) {
                    return deferred.reject(err);
                }
                return deferred.resolve(wallet);
            });
            return deferred.promise;
        };

        Wallet.prototype.getUnspent = function() {
            var wallet = this;
            var deferred = $q.defer();
            wallet.unspent = [];
            async.each([
                "receive",
                "change"
            ], function(addrType, done) {
                async.forEachOf(wallet.addresses[addrType], function(address, _, next) {
                    if (!address.received.totalReceivedSat && !address.received.unconfirmedBalance) {
                        wallet.addresses[addrType][address.pub].unspent = [];
                        return next();
                    }
                    var thisUnconfirmedSpent = (address.received.unconfirmedBalance + address.received.totalSentSat);
                    if (thisUnconfirmedSpent < 0) {
                        wallet.addresses[addrType][address.pub].unspent = [];
                        return next();
                    }
                    addressInfo.getUnspent(address.pub).then(function(unspent) {
                        // assign the chain and chain index
                        // for each output for when we go to
                        // send
                        unspent.forEach(function(output) {
                            output.chain = addrType;
                            output.chainIndex = address.chainIndex;
                            wallet.unspent.push(output);
                        });
                        wallet.addresses[addrType][address.pub].unspent = unspent;
                        return next();
                    }, next); // pass in callback as promise failure function
                }, done);
            }, function(err) {
                if (err) {
                    return deferred.reject(err);
                }
                return deferred.resolve(wallet);
            });
            return deferred.promise;
        };

        Wallet.prototype.updateBalance = function() {
            var wallet = this;
            wallet.updatingBalance = true;
            wallet.balance = 0;
            wallet.unconfirmedBalance = 0;
            wallet.unspent = [];
            return wallet.getAllAddresses().then(function() {
                ["receive", "change"].forEach(wallet.recalculateBalance, wallet);
                return wallet;
            }).finally(function() {
                wallet.updatingBalance = false;
                WalletStatus.status = null;
            });
        };

        Wallet.prototype.open = function(skipBip32) {
            var wallet = this;
            WalletStatus.status = WalletStatus.STATUS_LOADING;
            var deferred = $q.defer();
            api.loadWallet(this.number).then(function(data) {
                if (!data || data.type !== api.TYPE_SUCCESS) {
                    wallet.unlocked = false;
                    return deferred.reject("Error opening wallet");
                }
                deferred.notify(Wallet.NOTIFY_XPUB_LOADED);
                wallet.unlocked = true;
                // now that is is open, get the bip32 key for the
                // current wallet
                if(skipBip32) {
                  return deferred.resolve(wallet)
                }
                return Wallet.getBip32(wallet).then(function() {
                    // wallet.loadTransactions(); // dave says, we don't need this anymore
                    return deferred.resolve(wallet);
                }, deferred.reject);
            }, deferred.reject);
            return deferred.promise;
        };

        Wallet.prototype.getChangeAddress = function() {
            var chAddr;
            var addresses = this.addresses.change;
            console.debug("Choosing change address");
            for (var address in addresses) {
                if (addresses.hasOwnProperty(address)) {
                    var received = addresses[address].received;
                    if (received.totalReceivedSat === 0 && received.unconfirmedBalance === 0) {
                        chAddr = address;
                    }
                }
            }
            return chAddr;
        };

        Wallet.prototype.showQr = function(chainIndex) {
            return api.showQr(chainIndex);
        };

        Wallet.prototype.setChangeAddress = function(chainIndex) {
        	return api.setChangeAddress(chainIndex);
        };

        Wallet.prototype.send = function(outputs, fee, forceSmallChange) {
            WalletStatus.status = WalletStatus.STATUS_SENDING;
            var wallet = this;
            var deferred = $q.defer();
            try {
                console.debug("making transaction");
                var tx = new Transaction({
                    outputs: outputs,
                    fee: fee,
                    inputs: wallet.unspent,
                    changeAddress: wallet.getChangeAddress(),
                    forceSmallChange: forceSmallChange,
                });
                // do the send
                doSend(tx).then(deferred.resolve, deferred.reject);
                return deferred.promise.finally(function() {
                    WalletStatus.status = null;
                });
            } catch (ex) {
            	console.debug("caught exception in making transaction");
                if (ex === Transaction.ERR_AMOUNT_TOO_LOW) {
                    $timeout(function() {
                        deferred.reject("You cannot send less than " + bcMath.toBTC(MIN_OUTPUT) + " BTC");
                    });
                } else if (ex.change !== undefined && 'number' === typeof ex.change) {
                    $timeout(function() {
                        deferred.reject(ex);
                    });
                } else {
                    $timeout(function() {
                        deferred.reject(ex);
                    });
                }
                return deferred.promise;
            }
        };

        function doSend(tx) {
            console.debug("send: signing with device");
            // sign the transaction on the device
            return api.signTransaction(tx)
                .then(function(res) {
                    // after signing, replace the input scripts
                    // with the signed versions
                    console.debug("send: signed, replacing scripts");
                    tx.replaceScripts(res.payload.signedScripts);
                    // then submit it to the network
                    return tx;
                });
        }

        Wallet.prototype.signMessage = function(address, chain, chainIndex, message) {
            WalletStatus.status = WalletStatus.STATUS_SIGNING;
            return api.signMessage(address, chain, chainIndex, message)
                .finally(function() {
                    WalletStatus.status = null;
                });
        };

        // renames the currently loaded wallet
        Wallet.prototype.rename = function(newName) {
            var wallet = this;
            return api.renameWallet(newName).then(function() {
                console.debug(arguments);
                wallet._name = newName;
            });
        };

        Wallet.prototype.remove = function() {
            return api.deleteWallet(this.number);
        };

        Wallet.prototype.removeConfirm = function(otp) {
            return api.sendOTP(otp);
        };





        Wallet.prototype.loadTransactions = function() {
            WalletStatus.status = WalletStatus.STATUS_LOADING_TRANSACTIONS;
            var transactions = [];
            var foundHashes = [];
            var wallet = this;
            var deferred = $q.defer();
            wallet.loadingTransactions = true;
            async.each([
                "receive",
                "change"
            ], function(addrType, done) {
                async.forEachOf(wallet.addresses[addrType], function(address, _, next) {
                    if (!address.received.totalReceivedSat && !address.received.unconfirmedBalance) {
                        return next();
                    }
                    addressInfo.getTransactions(address.pub).then(function(txs) {
                        txs.forEach(function(tx) {
                            if (foundHashes.indexOf(tx.txid) === -1) {
                                foundHashes.push(tx.txid);
                                console.debug("foundHashes.push(tx.txid) " + tx.txid);
                                transactions.push(tx);
                            }
                        });
                        return next();
                    }, next);
                }, done);
            }, function(err) {
                if (err) {
                    return deferred.reject(err);
                }
                transactions = transactions.sort(txSort).map(wallet.txMap.bind(wallet));
                wallet.transactions = transactions;
                WalletStatus.status = null;
                return deferred.resolve(transactions);
            });
            return deferred.promise.finally(function() {
                wallet.loadingTransactions = false;
            });
        };


        function txSort(a, b) {
            return a.confirmations < b.confirmations ? -1 : 1;
        }

	// Assumes the amount is displayed as an eight-digit after the comma float (string)
		function stringToSatoshis(amountAsString) {
			amountAsString = amountAsString.replace(/\./g,'');
			var amountAsInteger = 0;
			var i;
			var amountArray = amountAsString.split("");
			amountArray.reverse();
			for(i = 0; i < amountArray.length; i++)
			{
				amountAsInteger = amountAsInteger + ((parseInt(amountArray[i]))*(Math.pow(10,i)));
			}
			return amountAsInteger;
		}

    Wallet.prototype.txMap = function(tx) {
        console.debug("*************************************");
    	console.debug("ROOT txid " + tx.txid);

			var epochDate = 0;
			if (tx.confirmations > 0) {
				epochDate = tx.blocktime*1000;
				console.debug("epochDate raw >0 conf " + epochDate);
			} else {
				epochDate = tx.time*1000;
				console.debug("epochDate raw 0 conf " + epochDate);
			}
			tx.blocktime = moment(epochDate).format("YYYY-MM-DD HH:mm");
			console.debug("tx.blocktime formatted " + tx.blocktime);

			tx.fees = tx.fees * 100000000;
			console.debug("tx.fees " + tx.fees);

      tx.type = 'send';
      var wallet = this;
      tx.amount = tx.valueOut * 100000000;
      tx.totalAmount = tx.amount;
      var ownAddresses = 0;
      var addrCount = 0;
      tx.vout.forEach(function(out) {
          out.scriptPubKey.addresses.forEach(function(addr) {
              addrCount += 1;
              if (wallet.addresses.receive.hasOwnProperty(addr)) {
                  tx.type = 'receive';
                  ownAddresses += 1;
              } else if (wallet.addresses.change.hasOwnProperty(addr)) {
                  ownAddresses += 1;
                  var changeAmount = stringToSatoshis(out.value);
                  console.debug("changeAmount " + changeAmount);
                  tx.amount -= changeAmount;
              }
          });
      });
      if (ownAddresses === addrCount) {
          tx.type = 'transfer';
      }
      if (tx.type === 'receive') {
          tx.vout.forEach(function(out) {
              out.scriptPubKey.addresses.forEach(function(addr) {
                  if (!wallet.addresses.receive.hasOwnProperty(addr) &&
                      !wallet.addresses.change.hasOwnProperty(addr)) {
                      var receiveAmount = stringToSatoshis(out.value);
                      console.debug("receiveAmount " + receiveAmount);
                      tx.amount -= receiveAmount;
                  }
              });
          });
      }

      return tx;
    };

    return Wallet;

  }

})(window, window.angular, window.async);
