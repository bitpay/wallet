'use strict';

angular.module('copayApp.controllers').controller('sendController',
  function($rootScope, $scope, $window, $timeout, $modal, $filter, $log, notification, isMobile, txStatus, isCordova, bitcore, profileService, configService, rateService) {
    var fc = profileService.focusedClient;
    var self = this;

    this.init = function() {
      this.isMobile = isMobile.any();
      this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
      $rootScope.wpInputFocused = false;

      $rootScope.title = fc.credentials.m > 1 ? 'Send Proposal' : 'Send';
      this.loading = false;
      this.error = this.success = null;

      this.isRateAvailable = false;
      this.showScanner = false;
      this.isMobile = isMobile.any();

      this.setInputs();

      var paymentUri = $rootScope.$on('paymentUri', function(event, uri) {
        $timeout(function() {
          self.setForm(uri);
        }, 100);
      });

      var config = configService.getSync().wallet.settings;
      this.alternativeName = config.alternativeName;
      this.alternativeAmount = 0;
      this.alternativeIsoCode = config.alternativeIsoCode;
      this.unitToSatoshi = config.unitToSatoshi;
      this.unitDecimals = config.unitDecimals;
      this.unitName = config.unitName;


      rateService.whenAvailable(function() {
        self.isRateAvailable = true;
        $rootScope.$digest();
      });


      var openScannerCordova = $rootScope.$on('dataScanned', function(event, data) {
        self.setForm(data);
      });

      $scope.$on('$destroy', function() {
        openScannerCordova();
        paymentUri();
      });
    };

    this.formFocus = function(what) {
      if (!this.isWindowsPhoneApp) return

      if (!what) {
        $rootScope.wpInputFocused = false;
        this.hideAddress = false;
        this.hideAmount = false;

      } else {
        $rootScope.wpInputFocused = true;
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

    this.setInputs = function() {
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
            } else {
              $scope._amount = 0;
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
      $log.warn(err);

      // TODO
      // if (err.code('BIG'))
      //   msg = 'The transaction have too many inputs. Try creating many transactions  for smaller amounts'
      //
      // if (msg.code('totalNeededAmount') || msg.code('unspent not set'))
      //   msg = 'Insufficient funds'
      //
      // if (msg.code('expired'))
      //   msg = 'The payment request has expired';
      //
      // if (msg.code('XMLHttpRequest'))
      //   msg = 'Error when sending to the blockchain. Resend it from Home';
      //
      var errMessage = 'The transaction' + (fc.credentials.m > 1 ? ' proposal' : '') +

        ' could not be created: ' + (err.message ? err.message : err);

      this.error = errMessage;

      $timeout(function() {
        $scope.$digest();
      }, 1);
    };

    this.submitForm = function(form) {
      var unitToSat = this.unitToSatoshi;

      if (form.$invalid) {
        this.error = 'Unable to send transaction proposal';
        return;
      }
      self.loading = true;

      if (isCordova) {
        window.plugins.spinnerDialog.show(null, 'Creating transaction...', true);
      }

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
          if (isCordova) {
            window.plugins.spinnerDialog.hide();
          }
          self.loading = false;

          if (err) {
            self.setError(err);
          } else {
            fc.signTxProposal(txp, function(err, signedTx) {
              if (err) {
                self.setError(err);
              } else {
                //if txp has required signatures then broadcast it
                var txpHasRequiredSignatures = signedTx.status == 'accepted';
                if (txpHasRequiredSignatures) {
                  fc.broadcastTxProposal(signedTx, function(err, btx) {
                    if (err) {
                      $scope.error = 'Transaction not broadcasted. Please try again.';
                      $scope.$digest();
                    } else {
                      txStatus.notify(btx);
                      $scope.$emit('Local/NewTxProposal');
                      self.resetForm(form);
                    }
                  });
                } else {
                  txStatus.notify(signedTx);
                  $scope.$emit('Local/NewTxProposal');
                  self.resetForm(form);
                }
              }
            });
          }
        });
      }, 100);
    };

    this.setTopAmount = function() {
      throw new Error('todo: setTopAmount');
      var form = $scope.sendForm;
      if (form) {
        form.amount.$setViewValue(w.balanceInfo.topAmount);
        form.amount.$render();
        form.amount.$isValid = true;
      }
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

    this.resetForm = function(form) {
      this.error = this.success = null;
      this.fetchingURL = null;
      this._paypro = null;

      this.lockAddress = false;
      this.lockAmount = false;

      this._amount = this._address = null;

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
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    };

    this.openPPModal = function(paypro) {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        var satToUnit = 1 / self.unitToSatoshi;
        $scope.paypro = paypro;
        $scope.alternative = self.alternativeAmount;
        $scope.alternativeIsoCode = self.alternativeIsoCode;
        $scope.isRateAvailable = self.isRateAvailable;
        $scope.unitTotal = (paypro.amount * satToUnit).toFixed(self.unitDecimals);
        $scope.unitName = self.unitName;

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

    this.setFromPayPro = function(uri, form) {
      var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;
      if (isChromeApp) {
        this.error = 'Payment Protocol not yet supported on ChromeApp';
        return;
      }

      var satToUnit = 1 / this.unitToSatoshi;
      this.fetchingURL = uri;
      this.loading = true;
      var self = this;

      $log.debug('Fetch PayPro Request...', uri);
      fc.fetchPayPro({
        payProUrl: uri,
      }, function(err, paypro) {
        $log.debug(paypro);
        self.loading = false;
        self.fetchingURL = null;

        if (err) {
          $log.warn(err);
          self.resetForm(form);
          var msg = err.toString();
          if (msg.match('HTTP')) {
            msg = 'Could not fetch payment information';
          }
          self.error = msg;
        } else {
          self._paypro = paypro;
          self.setForm(paypro.toAddress, (paypro.amount * satToUnit).toFixed(self.unitDecimals),
            paypro.memo);
        }
      });
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
      this.error = this.success = null;
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

    this.openAddressBook = function() {
      var w = $rootScope.wallet;
      var modalInstance = $modal.open({
        templateUrl: 'views/modals/address-book.html',
        windowClass: 'full',
        controller: function($scope, $modalInstance) {

          $scope.showForm = null;
          $scope.addressBook = w.addressBook;

          $scope.hasEntry = function() {
            return _.keys($scope.addressBook).length > 0 ? true : false;
          };

          $scope.toggleAddressBookEntry = function(key) {
            w.toggleAddressBookEntry(key);
          };

          $scope.copyToSend = function(addr) {
            $modalInstance.close(addr);
          };

          $scope.cancel = function(form) {
            $scope.error = $scope.success = $scope.newaddress = $scope.newlabel = null;
            clearForm(form);
            $scope.toggleForm();
          };

          $scope.toggleForm = function() {
            $scope.showForm = !$scope.showForm;
          };

          var clearForm = function(form) {
            form.newaddress.$pristine = true;
            form.newaddress.$setViewValue('');
            form.newaddress.$render();

            form.newlabel.$pristine = true;
            form.newlabel.$setViewValue('');
            form.newlabel.$render();
            form.$setPristine();
          };

          // TODO change to modal
          $scope.submitAddressBook = function(form) {
            if (form.$invalid) {
              return;
            }
            $scope.loading = true;
            $timeout(function() {
              var errorMsg;
              var entry = {
                "address": form.newaddress.$modelValue,
                "label": form.newlabel.$modelValue
              };
              try {
                w.setAddressBook(entry.address, entry.label);
              } catch (e) {
                $log.warn(e);
                errorMsg = e.message;
              }

              if (errorMsg) {
                $scope.error = errorMsg;
              } else {
                clearForm(form);
                $scope.toggleForm();
                notification.success('Entry created', 'New addressbook entry created')
              }
              $scope.loading = false;
              $rootScope.$digest();
            }, 100);
            return;
          };

          $scope.close = function() {
            $modalInstance.dismiss('cancel');
          };
        },
      });

      modalInstance.result.then(function(addr) {
        $scope.setForm(addr);
      });
    };
  });
