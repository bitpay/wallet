'use strict';

angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, notification, txStatus, profileService, lodash, configService, rateService, storageService, bitcore, gettext, gettextCatalog, platformInfo, addressService, ledger, bwcError, confirmDialog, txFormatService, addressbookService, go, feeService, walletService, fingerprintService, nodeWebkit, ongoingProcess) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var self = this;
  $rootScope.shouldHideMenuBar = false;
  $rootScope.wpInputFocused = false;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;
  var ret = {};

  // INIT. Global value
  ret.unitToSatoshi = walletSettings.unitToSatoshi;
  ret.satToUnit = 1 / ret.unitToSatoshi;
  ret.unitName = walletSettings.unitName;
  ret.alternativeIsoCode = walletSettings.alternativeIsoCode;
  ret.alternativeName = walletSettings.alternativeName;
  ret.alternativeAmount = 0;
  ret.unitDecimals = walletSettings.unitDecimals;
  ret.isCordova = isCordova;
  ret.addresses = [];
  ret.isMobile = platformInfo.isMobile;
  ret.isWindowsPhoneApp = platformInfo.isWP;
  ret.countDown = null;
  ret.sendMaxInfo = {};
  ret.showAlternative = false;
  ret.fromInputAmount = null;
  var vanillaScope = ret;

  var disableScannerListener = $rootScope.$on('dataScanned', function(event, data) {
    if (!data) return;

    self.setForm(data);
    $rootScope.$emit('Local/SetTab', 'send');
    var form = $scope.sendForm;
    if (form.address.$invalid && !ongoingProcess.get('fetchingPayPro')) {
      self.resetForm();
      self.error = gettext('Could not recognize a valid Bitcoin QR Code');
    }
  });

  var disablePaymentUriListener = $rootScope.$on('paymentUri', function(event, uri) {
    $rootScope.$emit('Local/SetTab', 'send');
    $timeout(function() {
      self.setForm(uri);
    }, 100);
  });

  var disableAddrListener = $rootScope.$on('Local/AddressIsUsed', function() {
    self.setAddress(true);
  });

  var disableFocusListener = $rootScope.$on('Local/NewFocusedWalletReady', function() {
    self.addr = null;
    self.resetForm();
    $scope.search = '';

    if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
      self.setAddress();
      self.setSendFormInputs();
    }

    $log.debug('Cleaning WalletHome Instance');
    lodash.each(self, function(v, k) {
      if (lodash.isFunction(v)) return;
      if (!lodash.isUndefined(vanillaScope[k])) {
        self[k] = vanillaScope[k];
        return;
      }
      if (k == 'isRateAvailable') return;

      delete self[k];
    });
  });

  var disableResumeListener = $rootScope.$on('Local/Resume', function() {
    // This is needed then the apps go to sleep
    self.bindTouchDown();
  });

  var disableTabListener = $rootScope.$on('Local/TabChanged', function(e, tab) {
    // This will slow down switch, do not add things here!
    switch (tab) {
      case 'receive':
        // just to be sure we have an address
        self.setAddress();
        break;
      case 'send':
        self.resetError();
    };
  });

  $scope.$on('$destroy', function() {
    disableAddrListener();
    disableScannerListener();
    disablePaymentUriListener();
    disableTabListener();
    disableFocusListener();
    disableResumeListener();
    $rootScope.shouldHideMenuBar = false;
  });

  if (isCordova && StatusBar.isVisible) {
    var backgroundColor = profileService.focusedClient ? profileService.focusedClient.backgroundColor : "#4B6178";
    StatusBar.backgroundColorByHexString(backgroundColor);
  }

  this.onQrCodeScanned = function(data) {
    if (data) go.send();
    $rootScope.$emit('dataScanned', data);
  };

  rateService.whenAvailable(function() {
    self.isRateAvailable = true;
    $rootScope.$digest();
  });

  var getClipboard = function(cb) {
    if (!isCordova || platformInfo.isWP) return cb();

    window.cordova.plugins.clipboard.paste(function(value) {
      var fc = profileService.focusedClient;
      var Address = bitcore.Address;
      var networkName = fc.credentials.network;
      if (Address.isValid(value, networkName) && !$scope.newAddress) {
        return cb(value);
      }
    });
  };

  var handleEncryptedWallet = function(client, cb) {
    if (!walletService.isEncrypted(client)) return cb();
    $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
      if (err) return cb(err);
      return cb(walletService.unlock(client, password));
    });
  };

  var accept_msg = gettextCatalog.getString('Accept');
  var cancel_msg = gettextCatalog.getString('Cancel');
  var confirm_msg = gettextCatalog.getString('Confirm');

  this.openAddressbookModal = function(wallets, address) {
    $scope.wallets = wallets;
    $scope.address = address;
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/addressbook.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addressbookModal = modal;
      $scope.addressbookModal.show();
    });
  };

  var GLIDERA_LOCK_TIME = 6 * 60 * 60;
  // isGlidera flag is a security measure so glidera status is not
  // only determined by the tx.message
  this.openTxpModal = function(tx, copayers, isGlidera) {
    $scope.self = self;
    $scope.tx = tx;
    $scope.copayers = copayers;
    $scope.isGlidera = isGlidera;
    $scope.error = null;
    $scope.loading = null;
    $scope.paymentExpired = null;
    $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;

    $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.txpDetailsModal = modal;
      $scope.txpDetailsModal.show();
    });
  };

  this.setAddress = function(forceNew) {
    self.addrError = null;
    var client = profileService.focusedClient;
    if (!client || !client.isComplete()) return;

    // Address already set?
    if (!forceNew && self.addr) {
      return;
    }

    self.generatingAddress = true;
    $timeout(function() {
      addressService.getAddress(client.credentials.walletId, forceNew, function(err, addr) {
        self.generatingAddress = false;

        if (err) {
          self.addrError = err;
        } else {
          if (addr)
            self.addr = addr;
        }

        $scope.$digest();
      });
    });
  };

  this.copyToClipboard = function(addr, $event) {

    var showPopover = function() {

      $ionicPopover.fromTemplateUrl('views/includes/copyToClipboard.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
        $scope.popover.show($event);
      });

      $scope.close = function() {
        $scope.popover.hide();
      }

      $timeout(function() {
        $scope.popover.hide(); //close the popover after 0.7 seconds
      }, 700);

      $scope.$on('$destroy', function() {
        $scope.popover.remove();
      });
    };

    if (isCordova) {
      window.cordova.plugins.clipboard.copy(addr);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
    } else if (platformInfo.isNW) {
      nodeWebkit.writeToClipboard(addr);
      showPopover($event);
    }
  };

  this.shareAddress = function(addr) {
    if (isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  // Send

  this.resetError = function() {
    this.error = this.success = null;
  };

  this.bindTouchDown = function(tries) {
    var self = this;
    tries = tries || 0;
    if (tries > 5) return;
    var e = document.getElementById('menu-walletHome');
    if (!e) return $timeout(function() {
      self.bindTouchDown(++tries);
    }, 500);

    // on touchdown elements
    $log.debug('Binding touchstart elements...');
    ['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive'].forEach(function(id) {
      var e = document.getElementById(id);
      if (e) e.addEventListener('touchstart', function() {
        try {
          event.preventDefault();
        } catch (e) {};
        angular.element(e).triggerHandler('click');
      }, true);
    });
  }

  this.hideMenuBar = lodash.debounce(function(hide) {
    if (hide) {
      $rootScope.shouldHideMenuBar = true;
    } else {
      $rootScope.shouldHideMenuBar = false;
    }
    $rootScope.$digest();
  }, 100);

  this.formFocus = function(what) {
    if (isCordova && this.isWindowsPhoneApp) {
      this.hideMenuBar(what);
    }
    var self = this;
    if (isCordova && !this.isWindowsPhoneApp && what == 'address') {
      getClipboard(function(value) {
        if (value) {
          document.getElementById("amount").focus();
          $timeout(function() {
            window.plugins.toast.showShortCenter(gettextCatalog.getString('Pasted from clipboard'));
            self.setForm(value);
          }, 100);
        }
      });
    }
  };

  this.setSendFormInputs = function() {
    var unitToSat = this.unitToSatoshi;
    var satToUnit = 1 / unitToSat;
    /**
     * Setting the two related amounts as properties prevents an infinite
     * recursion for watches while preserving the original angular updates
     *
     */
    Object.defineProperty($scope,
      "_alternative", {
        get: function() {
          return $scope.__alternative;
        },
        set: function(newValue) {
          $scope.__alternative = newValue;
          if (self.isRateAvailable) {
            $scope._amount = parseFloat((rateService.fromFiat(newValue, self.alternativeIsoCode) * satToUnit).toFixed(self.unitDecimals), 10);
          } else {
            $scope.__amount = null;
          }
        },
        enumerable: true,
        configurable: true
      });
    Object.defineProperty($scope,
      "_amount", {
        get: function() {
          return $scope.__amount;
        },
        set: function(newValue) {
          $scope.__amount = newValue;
          if (self.isRateAvailable) {
            $scope.__alternative = parseFloat((rateService.toFiat(newValue * self.unitToSatoshi, self.alternativeIsoCode)).toFixed(2), 10);
          } else {
            $scope.__alternative = null;
          }
          self.alternativeAmount = $scope.__alternative;
          self.resetError();
        },
        enumerable: true,
        configurable: true
      });

    Object.defineProperty($scope,
      "_address", {
        get: function() {
          return $scope.__address;
        },
        set: function(newValue) {
          $scope.__address = self.onAddressChange(newValue);
          if ($scope.sendForm && $scope.sendForm.address.$valid) {
            self.lockAddress = true;
          }
        },
        enumerable: true,
        configurable: true
      });

    var fc = profileService.focusedClient;
    // ToDo: use a credential's (or fc's) function for this
    this.hideNote = !fc.credentials.sharedEncryptingKey;
  };

  this.setSendError = function(err) {
    var fc = profileService.focusedClient;
    var prefix =
      fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');

    this.error = bwcError.msg(err, prefix);

    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  this.setAmount = function(amount, useAlternativeAmount) {
    $scope.showAlternative = useAlternativeAmount;

    self.fromInputAmount = true;
    self.setForm(null, amount, null);
  };

  this.submitForm = function() {
    if (!$scope._amount || !$scope._address) return;
    var client = profileService.focusedClient;
    var unitToSat = this.unitToSatoshi;
    var currentSpendUnconfirmed = configWallet.spendUnconfirmed;

    var outputs = [];

    this.resetError();

    if (isCordova && this.isWindowsPhoneApp)
      $rootScope.shouldHideMenuBar = true;

    var form = $scope.sendForm;
    var comment = form.comment.$modelValue;

    // ToDo: use a credential's (or fc's) function for this
    if (comment && !client.credentials.sharedEncryptingKey) {
      var msg = 'Could not add message to imported wallet without shared encrypting key';
      $log.warn(msg);
      return self.setSendError(gettext(msg));
    }

    if (form.amount.$modelValue * unitToSat > Number.MAX_SAFE_INTEGER) {
      var msg = 'Amount too big';
      $log.warn(msg);
      return self.setSendError(gettext(msg));
    };

    $timeout(function() {
      var paypro = self._paypro;
      var address, amount;

      address = form.address.$modelValue;
      amount = parseInt((form.amount.$modelValue * unitToSat).toFixed(0));

      outputs.push({
        'toAddress': address,
        'amount': amount,
        'message': comment
      });

      var txp = {};

      if (!lodash.isEmpty(self.sendMaxInfo)) {
        txp.sendMax = true;
        txp.inputs = self.sendMaxInfo.inputs;
        txp.fee = self.sendMaxInfo.fee;
      } else {
        txp.amount = amount;
      }

      txp.toAddress = address;
      txp.outputs = outputs;
      txp.message = comment;
      txp.payProUrl = paypro ? paypro.url : null;
      txp.excludeUnconfirmedUtxos = configWallet.spendUnconfirmed ? false : true;
      txp.feeLevel = walletSettings.feeLevel || 'normal';

      ongoingProcess.set('creatingTx', true);
      walletService.createTx(client, txp, function(err, createdTxp) {
        ongoingProcess.set('creatingTx', false);
        if (err) {
          return self.setSendError(err);
        }

        if (!client.canSign() && !client.isPrivKeyExternal()) {
          $log.info('No signing proposal: No private key');
          ongoingProcess.set('sendingTx', true);
          walletService.publishTx(client, createdTxp, function(err, publishedTxp) {
            ongoingProcess.set('sendingTx', false);
            if (err) {
              return self.setSendError(err);
            }
            self.resetForm();
            go.walletHome();
            var type = txStatus.notify(createdTxp);
            $scope.openStatusModal(type, createdTxp, function() {
              return $scope.$emit('Local/TxProposalAction');
            });
          });
        } else {
          $rootScope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
            if (accept) self.confirmTx(createdTxp);
            else self.resetForm();
          });
        }
      });

    }, 100);
  };

  this.confirmTx = function(txp) {
    var client = profileService.focusedClient;
    var self = this;

    fingerprintService.check(client, function(err) {
      if (err) {
        return self.setSendError(err);
      }

      handleEncryptedWallet(client, function(err) {
        if (err) {
          return self.setSendError(err);
        }

        ongoingProcess.set('sendingTx', true);
        walletService.publishTx(client, txp, function(err, publishedTxp) {
          ongoingProcess.set('sendingTx', false);
          if (err) {
            return self.setSendError(err);
          }

          ongoingProcess.set('signingTx', true);
          walletService.signTx(client, publishedTxp, function(err, signedTxp) {
            ongoingProcess.set('signingTx', false);
            walletService.lock(client);
            if (err) {
              $scope.$emit('Local/TxProposalAction');
              return self.setSendError(
                err.message ?
                err.message :
                gettext('The payment was created but could not be completed. Please try again from home screen'));
            }

            if (signedTxp.status == 'accepted') {
              ongoingProcess.set('broadcastingTx', true);
              walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                ongoingProcess.set('broadcastingTx', false);
                if (err) {
                  return self.setSendError(err);
                }
                self.resetForm();
                go.walletHome();
                var type = txStatus.notify(broadcastedTxp);
                $scope.openStatusModal(type, broadcastedTxp, function() {
                  $scope.$emit('Local/TxProposalAction', broadcastedTxp.status == 'broadcasted');
                });
              });
            } else {
              self.resetForm();
              go.walletHome();
              var type = txStatus.notify(signedTxp);
              $scope.openStatusModal(type, signedTxp, function() {
                $scope.$emit('Local/TxProposalAction');
              });
            }
          });
        });
      });
    });
  };

  $scope.openStatusModal = function(type, txp, cb) {
    var fc = profileService.focusedClient;
    $scope.type = type;
    $scope.tx = txFormatService.processTx(txp);
    $scope.color = fc.backgroundColor;
    $scope.cb = cb;

    $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.txStatusModal = modal;
      $scope.txStatusModal.show();
    });
  };

  $scope.openSearchModal = function() {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });
  };

  $scope.openCustomInputAmountModal = function(addr) {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;
    $scope.addr = addr;

    $ionicModal.fromTemplateUrl('views/modals/customAmount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.customAmountModal = modal;
      $scope.customAmountModal.show();
    });
  };

  $scope.openAmountModal = function(addr) {
    if (isCordova)
      $scope.openInputAmountModal(addr);
    else
      $scope.openCustomInputAmountModal(addr);
  };

  $scope.openInputAmountModal = function(addr) {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.showAlternativeAmount = $scope.showAlternative || null;
    if ($scope.showAlternativeAmount) {
      $scope.amount = $scope.sendForm.alternative.$viewValue || null;
    } else {
      $scope.amount = $scope.sendForm.amount.$viewValue || null;
    }
    $scope.self = self;
    $scope.addr = addr;

    $ionicModal.fromTemplateUrl('views/modals/inputAmount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.inputAmountModal = modal;
      $scope.inputAmountModal.show();
    });
  };

  this.setForm = function(to, amount, comment) {
    var form = $scope.sendForm;
    if (to) {
      form.address.$setViewValue(to);
      form.address.$isValid = true;
      form.address.$render();
      this.lockAddress = true;
    }

    if (amount) {
      form.amount.$setViewValue("" + amount);
      form.amount.$isValid = true;
      form.amount.$render();
      if (!this.fromInputAmount)
        this.lockAmount = true;
      this.fromInputAmount = false;
    }

    if (comment) {
      form.comment.$setViewValue(comment);
      form.comment.$isValid = true;
      form.comment.$render();
    }
  };

  this.resetForm = function() {
    this.resetError();
    this.sendMaxInfo = {};
    if (this.countDown) $interval.cancel(this.countDown);
    this._paypro = null;

    this.lockAddress = false;
    this.lockAmount = false;

    this._amount = this._address = null;

    var form = $scope.sendForm;

    if (form && form.amount) {
      form.amount.$pristine = true;
      form.amount.$setViewValue('');
      form.amount.$render();

      form.comment.$setViewValue('');
      form.comment.$render();
      form.$setPristine();

      if (form.address) {
        form.address.$pristine = true;
        form.address.$setViewValue('');
        form.address.$render();
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
  };

  this.openPPModal = function(paypro) {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;
    $scope.paypro = paypro;

    $ionicModal.fromTemplateUrl('views/modals/paypro.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.payproModal = modal;
      $scope.payproModal.show();
    });
  };

  this.setFromPayPro = function(uri, cb) {
    if (!cb) cb = function() {};

    var fc = profileService.focusedClient;
    if (isChromeApp) {
      this.error = gettext('Payment Protocol not supported on Chrome App');
      return cb(true);
    }

    var satToUnit = 1 / this.unitToSatoshi;
    var self = this;
    /// Get information of payment if using Payment Protocol
    ongoingProcess.set('fetchingPayPro', true);

    $log.debug('Fetch PayPro Request...', uri);
    $timeout(function() {
      fc.fetchPayPro({
        payProUrl: uri,
      }, function(err, paypro) {
        ongoingProcess.set('fetchingPayPro', false);

        if (err) {
          $log.warn('Could not fetch payment request:', err);
          self.resetForm();
          var msg = err.toString();
          if (msg.match('HTTP')) {
            msg = gettext('Could not fetch payment information');
          }
          self.error = msg;
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
          return cb(true);
        }

        if (!paypro.verified) {
          self.resetForm();
          $log.warn('Failed to verify payment protocol signatures');
          self.error = gettext('Payment Protocol Invalid');
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
          return cb(true);
        }

        self._paypro = paypro;
        self.setForm(paypro.toAddress, (paypro.amount * satToUnit).toFixed(self.unitDecimals), paypro.memo);
        _paymentTimeControl(paypro.expires);
        return cb();
      });
    }, 1);
  };

  function _paymentTimeControl(expirationTime) {
    self.paymentExpired = false;
    setExpirationTime();

    self.countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        setExpiredValues();
        return;
      }

      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      self.remainingTimeStr = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    function setExpiredValues() {
      self.paymentExpired = true;
      self.remainingTimeStr = null;
      self._paypro = null;
      self.error = gettext('Cannot sign: The payment request has expired');
      if (self.countDown) $interval.cancel(self.countDown);
    };
  };

  this.setFromUri = function(uri) {
    var self = this;

    function sanitizeUri(uri) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(uri);
      if (!match || match.length === 0) {
        return uri;
      }
      var value = match[0].replace(',', '.');
      var newUri = uri.replace(regex, value);
      return newUri;
    };

    var satToUnit = 1 / this.unitToSatoshi;

    // URI extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(uri)) {
      uri = decodeURIComponent(uri.replace('bitcoin:?r=', ''));
      this.setFromPayPro(uri, function(err) {
        if (err) {
          return err;
        }
      });
    } else {
      uri = sanitizeUri(uri);

      if (!bitcore.URI.isValid(uri)) {
        return uri;
      }
      var parsed = new bitcore.URI(uri);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ?
        (parsed.amount.toFixed(0) * satToUnit).toFixed(this.unitDecimals) : 0;


      if (parsed.r) {
        this.setFromPayPro(parsed.r, function(err) {
          if (err && addr && amount) {
            self.setForm(addr, amount, message);
            return addr;
          }
        });
      } else {
        this.setForm(addr, amount, message);
        return addr;
      }
    }

  };

  this.onAddressChange = function(value) {
    this.resetError();
    if (!value) return '';

    if (this._paypro)
      return value;

    if (value.indexOf('bitcoin:') === 0) {
      return this.setFromUri(value);
    } else if (/^https?:\/\//.test(value)) {
      return this.setFromPayPro(value);
    } else {
      return value;
    }
  };

  // History

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  }

  this.getUnitName = function() {
    return this.unitName;
  };

  this.getAlternativeIsoCode = function() {
    return this.alternativeIsoCode;
  };

  this.openTxModal = function(btx) {
    var self = this;

    $scope.btx = lodash.cloneDeep(btx);
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
      scope: $scope,
      hideDelay: 500
    }).then(function(modal) {
      $scope.txDetailsModal = modal;
      $scope.txDetailsModal.show();
    });
  };

  this.hasAction = function(actions, action) {
    return actions.hasOwnProperty('create');
  };

  this.sendMax = function(availableBalanceSat) {
    if (availableBalanceSat == 0) {
      this.error = gettext("Cannot create transaction. Insufficient funds");
      return;
    }

    var self = this;
    var fc = profileService.focusedClient;
    this.error = null;
    ongoingProcess.set('calculatingFee', true);

    $timeout(function() {

      feeService.getCurrentFeeValue(function(err, feePerKb) {
        ongoingProcess.set('calculatingFee', false);
        if (err || !lodash.isNumber(feePerKb)) {
          self.error = gettext('Could not get fee value');
          return;
        }

        var opts = {};
        opts.feePerKb = feePerKb;
        opts.returnInputs = true;
        var config = configService.getSync();
        opts.excludeUnconfirmedUtxos = !config.wallet.spendUnconfirmed;
        ongoingProcess.set('retrivingInputs', true);

        fc.getSendMaxInfo(opts, function(err, resp) {
          ongoingProcess.set('retrivingInputs', false);

          if (err) {
            self.error = err;
            $scope.$apply();
            return;
          }

          if (resp.amount == 0) {
            self.error = gettext("Not enough funds for fee");
            $scope.$apply();
            return;
          }

          var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees", {
            fee: profileService.formatAmount(resp.fee) + ' ' + self.unitName
          });

          var warningMsg = verifyExcludedUtxos();

          if (!lodash.isEmpty(warningMsg))
            msg += '. \n' + warningMsg;

          confirmDialog.show(msg, function(confirmed) {
            if (confirmed) {
              self.sendMaxInfo = resp;
              var amount = parseFloat((resp.amount * self.satToUnit).toFixed(self.unitDecimals));
              self.setForm(null, amount, null);
            } else {
              self.resetForm();
            }
          });

          function verifyExcludedUtxos() {
            var warningMsg = [];
            if (resp.utxosBelowFee > 0) {
              warningMsg.push(gettextCatalog.getString("Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.", {
                amountBelowFeeStr: profileService.formatAmount(resp.amountBelowFee) + ' ' + self.unitName
              }));
            }
            if (resp.utxosAboveMaxSize > 0) {
              warningMsg.push(gettextCatalog.getString("Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded", {
                amountAboveMaxSizeStr: profileService.formatAmount(resp.amountAboveMaxSize) + ' ' + self.unitName
              }));
            }
            return warningMsg.join('\n');
          }
        });
      });
    }, 10);
  };

  /* Start setup */
  lodash.assign(self, vanillaScope);

  this.bindTouchDown();
  if (profileService.focusedClient) {
    this.setAddress();
    this.setSendFormInputs();
  }

});
