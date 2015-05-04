'use strict';

angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, $log, notification, txStatus, isCordova, profileService, lodash, configService, rateService, storageService, bitcore, isChromeApp, gettext, gettextCatalog) {

  var self = this;
  $rootScope.hideMenuBar = false;
  $rootScope.wpInputFocused = false;

  // INIT
  var config = configService.getSync().wallet.settings;
  this.unitToSatoshi = config.unitToSatoshi;
  this.satToUnit = 1 / this.unitToSatoshi;
  this.unitName = config.unitName;
  this.alternativeIsoCode = config.alternativeIsoCode;
  this.alternativeName = config.alternativeName;
  this.alternativeAmount = 0;
  this.unitDecimals = config.unitDecimals;
  this.isCordova = isCordova;
  this.addresses = [];
  this.isMobile = isMobile.any();
  this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
  this.blockUx = false;
  this.isRateAvailable = false;
  this.showScanner = false;
  this.isMobile = isMobile.any();
  this.addr = null;

  var disableScannerListener = $rootScope.$on('dataScanned', function(event, data) {
    self.setForm(data);
    $rootScope.$emit('Local/SetTab', 'send');
  });

  var disablePaymentUriListener = $rootScope.$on('paymentUri', function(event, uri) {
    $timeout(function() {
      $rootScope.$emit('Local/SetTab', 'send');
      self.setForm(uri);
    }, 100);
  });

  var disableAddrListener = $rootScope.$on('Local/NeedNewAddress', function() {
    self.setNewAddress();
  });

  var disableFocusListener = $rootScope.$on('Local/NewFocusedWallet', function() {
    self.addr = null;
    self.resetForm();
  });

  var disableOnlineListener = $rootScope.$on('Local/Online', function() {
    // This is needed then the apps go to sleep
    self.bindTouchDown();
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
    disableOnlineListener();
    $rootScope.hideMenuBar = false;
  });

  rateService.whenAvailable(function() {
    self.isRateAvailable = true;
    $rootScope.$digest();
  });

  // walletHome


  $scope.openCopayersModal = function(copayers, copayerId) {
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.copayers = copayers;
      $scope.copayerId = copayerId;
      $scope.color = fc.backgroundColor;
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };
    $modal.open({
      animation: false,
      templateUrl: 'views/modals/copayers.html',
      windowClass: 'full',
      controller: ModalInstanceCtrl,
    });
  };

  $scope.openTxModal = function(tx, copayers) {
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.error = null;
      $scope.tx = tx;
      $scope.amountStr = tx.amountStr;
      $scope.alternativeAmountStr = tx.alternativeAmountStr;
      $scope.copayers = copayers
      $scope.loading = null;
      $scope.color = fc.backgroundColor;

      $scope.getShortNetworkName = function() {
        return fc.credentials.networkName.substring(0, 4);
      };

      lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy', 'transactionProposalRemoved', 'TxProposalRemoved', 'NewOutgoingTx'], function(eventName) {
        $rootScope.$on(eventName, function() {
          fc.getTx($scope.tx.id, function(err, tx) {
            if (err) {

              if (err.code && err.code == 'BADREQUEST' &&
                (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
                $scope.tx.removed = true;
                $scope.tx.couldRemove = false;
                $scope.tx.pendingForUs = false;
                $scope.$apply();
                return;
              }
              return;
            }

            var action = lodash.find(tx.actions, {
              copayerId: fc.credentials.copayerId
            });
            $scope.tx = tx;
            if (!action && tx.status == 'pending')
              $scope.tx.pendingForUs = true;
            $scope.updateCopayerList();
            $scope.$apply();
          });
        });
      });

      $scope.updateCopayerList = function() {
        lodash.map($scope.copayers, function(cp) {
          lodash.each($scope.tx.actions, function(ac) {
            if (cp.id == ac.copayerId) {
              cp.action = ac.type;
            }
          });
        });
      };

      $scope.sign = function(txp) {
        var fc = profileService.focusedClient;
        if (fc.isPrivKeyEncrypted()) {
          profileService.unlockFC(function(err) {
            if (err) {
              $scope.error = err;
              return;
            }
            return $scope.sign(txp);
          });
          return;
        };

        self.setOngoingProcess(gettext('Signing transaction'));
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.signTxProposal(txp, function(err, txpsi) {
            profileService.lockFC();
            self.setOngoingProcess();
            if (err) {
              $scope.loading = false;
              $scope.error = err.message || gettext('Transaction not signed. Please try again.');
              $scope.$digest();
            } else {
              //if txp has required signatures then broadcast it
              var txpHasRequiredSignatures = txpsi.status == 'accepted';
              if (txpHasRequiredSignatures) {
                self.setOngoingProcess(gettext('Broadcasting transaction'));
                $scope.loading = true;
                fc.broadcastTxProposal(txpsi, function(err, txpsb) {
                  self.setOngoingProcess();
                  $scope.loading = false;
                  if (err) {
                    $scope.error = gettext('Transaction not broadcasted. Please try again.');
                    $scope.$digest();
                  } else {
                    $modalInstance.close(txpsb);
                  }
                });
              } else {
                $scope.loading = false;
                $modalInstance.close(txpsi);
              }
            }
          });
        }, 100);
      };

      $scope.reject = function(txp) {
        self.setOngoingProcess(gettext('Rejecting transaction'));
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.rejectTxProposal(txp, null, function(err, txpr) {
            self.setOngoingProcess();
            $scope.loading = false;
            if (err) {
              $scope.error = err.message || gettext('Transaction not rejected. Please try again.');
              $scope.$digest();
            } else {
              $modalInstance.close(txpr);
            }
          });
        }, 100);
      };


      $scope.remove = function(txp) {
        self.setOngoingProcess(gettext('Deleting transaction'));
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.removeTxProposal(txp, function(err, txpb) {
            self.setOngoingProcess();
            $scope.loading = false;

            // Hacky: request tries to parse an empty response
            if (err && !(err.message && err.message.match(/Unexpected/))) {
              $scope.error = err.message || gettext('Transaction could not be deleted. Please try again.');
              $scope.$digest();
              return;
            }
            $modalInstance.close();
          });
        }, 100);
      };

      $scope.broadcast = function(txp) {
        self.setOngoingProcess(gettext('Broadcasting transaction'));
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.broadcastTxProposal(txp, function(err, txpb) {
            self.setOngoingProcess();
            $scope.loading = false;
            if (err) {
              $scope.error = err.message || gettext('Transaction not sent. Please try again.');
              $scope.$digest();
            } else {
              $modalInstance.close(txpb);
            }
          });
        }, 100);
      };

      $scope.copyAddress = function(addr) {
        if (!addr) return;
        self.copyAddress(addr);
      };

      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };

    var modalInstance = $modal.open({
      animation: false,
      templateUrl: 'views/modals/txp-details.html',
      windowClass: 'full',
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.then(function(txp) {
      $scope.$emit('Local/TxProposalAction');
      if (txp) {
        self.setOngoingProcess();
        txStatus.notify(txp);
      }
    });

  };

  // Receive
  this.setNewAddress = function() {
    var fc = profileService.focusedClient;
    self.generatingAddress = true;
    fc.createAddress(function(err, addr) {
      self.generatingAddress = false;
      if (err) {
        if (err.error.match(/locked/gi)) {
          $log.debug(err.error);
          $timeout(function() {
            self.setNewAddress();
          }, 5000);
        }
        else {
          $log.debug('Creating address ERROR:', err);
          $scope.$emit('Local/ClientError', err);
          $scope.$digest();
        }
        return;
      }
      self.addr = addr.address;
      storageService.storeLastAddress(fc.credentials.walletId, addr.address, function() {

        self.generatingAddress = false;
        $scope.$digest();
      });
    });
  };

  this.setAddress = function() {
    if (self.addr)
      return;

    var fc = profileService.focusedClient;
    $timeout(function() {
      storageService.getLastAddress(fc.credentials.walletId, function(err, addr) {
        if (addr) {
          self.addr = addr;
          $scope.$digest();
        } else {
          self.setNewAddress();
        }
      });
    });
  };

  this.copyAddress = function(addr) {
    if (isCordova) {
      window.cordova.plugins.clipboard.copy('bitcoin:' + addr);
      window.plugins.toast.showShortCenter('Copied to clipboard');
    }
  };

  this.shareAddress = function(addr) {
    if (isCordova) {
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  // Send

  this.canShowAlternative = function() {
    return $scope.showAlternative;
  };

  this.showAlternative = function() {
    $scope.showAlternative = true;
  };

  this.hideAlternative = function() {
    $scope.showAlternative = false;
  };

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
    ['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive', 'menu-history'].forEach(function(id) {
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
      $rootScope.hideMenuBar = true;
      this.bindTouchDown();
    } else {
      $rootScope.hideMenuBar = false;
    }
    $rootScope.$digest();
  }, 100);


  this.formFocus = function(what) {
    if (isCordova && !this.isWindowsPhoneApp) {
      this.hideMenuBar(what);
    }
    if (!this.isWindowsPhoneApp) return

    if (!what) {
      this.hideAddress = false;
      this.hideAmount = false;

    } else {
      if (what == 'amount') {
        this.hideAddress = true;
      } else if (what == 'msg') {
        this.hideAddress = true;
        this.hideAmount = true;
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
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
          if (typeof(newValue) === 'number' && self.isRateAvailable) {
            $scope._amount = parseFloat((rateService.fromFiat(newValue, self.alternativeIsoCode) * satToUnit).toFixed(self.unitDecimals), 10);
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
          if (typeof(newValue) === 'number' && self.isRateAvailable) {
            $scope.__alternative = parseFloat((rateService.toFiat(newValue * self.unitToSatoshi, self.alternativeIsoCode)).toFixed(2), 10);
          } else {
            $scope.__alternative = 0;
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
        },
        enumerable: true,
        configurable: true
      });
  };

  this.setError = function(err) {
    var fc = profileService.focusedClient;
    $log.warn(err);
    var errMessage = 'The transaction' + (fc.credentials.m > 1 ? ' proposal' : '') +

      ' could not be created: ' + (err.message ? err.message : err);

    this.error = errMessage;

    $timeout(function() {
      $scope.$digest();
    }, 1);
  };


  this.setOngoingProcess = function(name) {
    var self = this;
    self.blockUx = !!name;

    if (isCordova) {
      if (name) {
        window.plugins.spinnerDialog.hide();
        window.plugins.spinnerDialog.show(null, name + '...', true);
      } else {
        window.plugins.spinnerDialog.hide();
      }
    } else {
      self.onGoingProcess = name;
      $timeout(function() {
        $rootScope.$apply();
      });
    };
  };

  this.submitForm = function() {
    var fc = profileService.focusedClient;
    var unitToSat = this.unitToSatoshi;

    var form = $scope.sendForm;
    if (form.$invalid) {
      this.error = gettext('Unable to send transaction proposal');
      return;
    }

    if (fc.isPrivKeyEncrypted()) {
      profileService.unlockFC(function(err) {
        if (err) return self.setError(err);
        return self.submitForm();
      });
      return;
    };

    self.setOngoingProcess(gettext('Creating transaction'));
    $timeout(function() {
      var comment = form.comment.$modelValue;
      var paypro = self._paypro;
      var address, amount;

      address = form.address.$modelValue;
      amount = parseInt((form.amount.$modelValue * unitToSat).toFixed(0));

      fc.sendTxProposal({
        toAddress: address,
        amount: amount,
        message: comment,
        payProUrl: paypro ? paypro.url : null,
      }, function(err, txp) {
        if (err) {
          self.setOngoingProcess();
          profileService.lockFC();
          return self.setError(err);
        }

        self.signAndBroadcast(txp, function(err) {
          if (err) {
            self.setOngoingProcess();
            return self.setError(err);
          }

          self.resetForm();
        });
      });
    }, 100);
  };


  this.signAndBroadcast = function(txp, cb) {
    var fc = profileService.focusedClient;
    self.setOngoingProcess(gettext('Signing transaction'));
    fc.signTxProposal(txp, function(err, signedTx) {
      profileService.lockFC();

      if (err) {
        self.setOngoingProcess();
        return cb(err);
      }

      if (signedTx.status == 'accepted') {
        self.setOngoingProcess(gettext('Broadcasting transaction'));
        fc.broadcastTxProposal(signedTx, function(err, btx) {
          self.setOngoingProcess();
          if (err) {
            $scope.error = gettext('Transaction not broadcasted. Please try again.');
            $scope.$digest();
            return cb(err);
          }
          $scope.$emit('Local/TxProposalAction');
          txStatus.notify(btx, function() {
            return cb();
          });
        });
      } else {
        self.setOngoingProcess();
        $scope.$emit('Local/TxProposalAction');
        txStatus.notify(signedTx, function() {
          return cb();
        });
      }
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
      this.lockAmount = true;
    }

    if (comment) {
      form.comment.$setViewValue(comment);
      form.comment.$isValid = true;
      form.comment.$render();
    }
  };



  this.resetForm = function() {
    this.resetError();
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
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      var fc = profileService.focusedClient;
      var satToUnit = 1 / self.unitToSatoshi;
      $scope.paypro = paypro;
      $scope.alternative = self.alternativeAmount;
      $scope.alternativeIsoCode = self.alternativeIsoCode;
      $scope.isRateAvailable = self.isRateAvailable;
      $scope.unitTotal = (paypro.amount * satToUnit).toFixed(self.unitDecimals);
      $scope.unitName = self.unitName;
      $scope.color = fc.backgroundColor;

      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };
    $modal.open({
      templateUrl: 'views/modals/paypro.html',
      windowClass: 'full',
      controller: ModalInstanceCtrl,
    });
  };

  this.setFromPayPro = function(uri) {
    var fc = profileService.focusedClient;
    if (isChromeApp) {
      this.error = gettext('Payment Protocol not supported on Chrome App');
      return;
    }

    var satToUnit = 1 / this.unitToSatoshi;
    var self = this;
    /// Get information of payment if using Payment Protocol
    self.setOngoingProcess(gettext('Fetching Payment Information'));

    $log.debug('Fetch PayPro Request...', uri);
    $timeout(function() {
      fc.fetchPayPro({
        payProUrl: uri,
      }, function(err, paypro) {
        self.setOngoingProcess();

        if (err) {
          $log.warn(err);
          self.resetForm();
          var msg = err.toString();
          if (msg.match('HTTP')) {
            msg = gettext('Could not fetch payment information');
          }
          self.error = msg;
        } else {
          self._paypro = paypro;
          self.setForm(paypro.toAddress, (paypro.amount * satToUnit).toFixed(self.unitDecimals),
            paypro.memo);
        }
      });
    }, 1);
  };

  this.setFromUri = function(uri) {
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

    uri = sanitizeUri(uri);

    if (!bitcore.URI.isValid(uri)) {
      return uri;
    }
    var parsed = new bitcore.URI(uri);
    var addr = parsed.address.toString();
    var message = parsed.message;
    if (parsed.r)
      return this.setFromPayPro(parsed.r);

    var amount = parsed.amount ?
      (parsed.amount.toFixed(0) * satToUnit).toFixed(this.unitDecimals) : 0;

    this.setForm(addr, amount, message);
    return addr;
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

  this._addRates = function(txs, cb) {
    if (!txs || txs.length == 0) return cb();
    var index = lodash.groupBy(txs, 'rateTs');

    rateService.getHistoricRates(config.alternativeIsoCode, lodash.keys(index), function(err, res) {
      if (err || !res) return cb(err);
      lodash.each(res, function(r) {
        lodash.each(index[r.ts], function(tx) {
          var alternativeAmount = (r.rate != null ? tx.amount * rateService.SAT_TO_BTC * r.rate : null);
          tx.alternativeAmount = alternativeAmount ? $filter('noFractionNumber')(alternativeAmount, 2) : null;
        });
      });
      return cb();
    });
  };

  this.openTxModal = function(btx) {
    var self = this;
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.btx = btx;
      $scope.settings = config;
      $scope.color = fc.backgroundColor;

      $scope.getAmount = function(amount) {
        return self.getAmount(amount);
      };

      $scope.getUnitName = function() {
        return self.getUnitName();
      };

      $scope.getShortNetworkName = function() {
        var n = fc.credentials.network;
        return n.substring(0, 4);
      };

      $scope.copyAddress = function(addr) {
        if (!addr) return;
        self.copyAddress(addr);
      };

      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };

    $modal.open({
      animation: false,
      templateUrl: 'views/modals/tx-details.html',
      windowClass: 'full',
      controller: ModalInstanceCtrl,
    });
  };

  this.hasAction = function(actions, action) {
    return actions.hasOwnProperty('create');
  };

  // Startup events
  this.bindTouchDown();
  this.setAddress();
  this.setSendFormInputs();

});
