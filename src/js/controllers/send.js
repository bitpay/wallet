'use strict';

angular.module('copayApp.controllers').controller('sendController',
  function($rootScope, $scope, $window, $timeout, $modal, $filter, $log, notification, isMobile, txStatus, isCordova, bitcore, profileService, configService) {
    var fc = profileService.focusedClient;

    this.init = function() {
      var self = this;
      this.isMobile = isMobile.any();
      this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
      $rootScope.wpInputFocused = false;

      $rootScope.title = fc.credentials.m > 1 ? 'Send Proposal' : 'Send';
      this.loading = false;
      this.error = this.success = null;

      this.isRateAvailable = false;
      this.showScanner = false;
      this.isMobile = isMobile.any();


      if ($rootScope.pendingPayment) {
        $timeout(function() {
          self.setFromUri($rootScope.pendingPayment)
          $rootScope.pendingPayment = null;
        }, 100);
      }

      this.setInputs();

      var config = configService.getSync().wallet.settings;
      this.alternativeName = config.alternativeName;
      this.alternativeIsoCode = config.alternativeIsoCode;
      this.unitToSatoshi = config.unitToSatoshi;
      this.unitDecimals = config.unitDecimals;
      this.unitName = config.unitName;

      // TODO : rateService
      // rateService.whenAvailable(function() {
      //   self.isRateAvailable = true;
      //   self.$digest();
      // });
      //

      var openScannerCordova = $rootScope.$on('dataScanned', function(event, data) {
        self.setForm(data);
      });

      $scope.$on('$destroy', function() {
        openScannerCordova();
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
      var self = this;
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
            return this.__alternative;
          },
          set: function(newValue) {
            this.__alternative = newValue;
            if (typeof(newValue) === 'number' && self.isRateAvailable) {
              this._amount = parseFloat(
                (rateService.fromFiat(newValue, self.alternativeIsoCode) * satToUnit).toFixed(w.settings.unitDecimals), 10);
            } else {
              this._amount = 0;
            }
          },
          enumerable: true,
          configurable: true
        });
      Object.defineProperty($scope,
        "_amount", {
          get: function() {
            return this.__amount;
          },
          set: function(newValue) {
            this.__amount = newValue;
            if (typeof(newValue) === 'number' && self.isRateAvailable) {
              this.__alternative = parseFloat(
                (rateService.toFiat(newValue * unitToSat, self.alternativeIsoCode)).toFixed(2), 10);
            } else {
              this.__alternative = 0;
            }
          },
          enumerable: true,
          configurable: true
        });

      Object.defineProperty($scope,
        "_address", {
          get: function() {
            return this.__address;
          },
          set: function(newValue) {
            this.__address = self.onAddressChange(newValue);
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
      var self = this;
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
        var merchantData = self._merchantData;
        var address, amount;
        if (!merchantData) {
          address = form.address.$modelValue;
          amount = parseInt((form.amount.$modelValue * unitToSat).toFixed(0));
        }

        fc.sendTxProposal({
          // TODO
          //          merchantData: merchantData,
          toAddress: address,
          amount: amount,
          message: comment,
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
                txStatus.notify(signedTx);
                $scope.$emit('updateStatus');
                self.resetForm(form);
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
      this.fetchingURL = null;
      this._merchantData = this._domain = null;

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

    var $oscope = this;
    this.openPPModal = function(merchantData) {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        var satToUnit = 1 / this.unitToSatoshi;
        $scope.md = merchantData;
        $scope.alternative = $oscope._alternative;
        $scope.alternativeIsoCode = this.alternativeIsoCode;
        $scope.isRateAvailable = this.isRateAvailable;
        $scope.unitTotal = (merchantData.total * satToUnit).toFixed(w.settings.unitDecimals);

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


    // TODO form
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


      // Payment Protocol URI (BIP-72)
      w.fetchPaymentRequest({
        url: uri
      }, function(err, merchantData) {
        self.loading = false;
        self.fetchingURL = null;

        if (err) {
          $log.warn(err);
          self.resetForm(form);
          $rootScope.$emit('updateStatus');
          var msg = err.toString();
          if (msg.match('HTTP')) {
            msg = 'Could not fetch payment information';
          }
          self.error = msg;
        } else {
          self._merchantData = merchantData;
          self._domain = merchantData.domain;
          self.setForm(null, (merchantData.total * satToUnit).toFixed(w.settings.unitDecimals));
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

      var parsed = new bitcore.URI(uri);
      var addr = parsed.address.toString();
      var message = parsed.message;
      if (parsed.data && parsed.data.merchant)
        return this.setFromPayPro(parsed.data.merchant);

      var amount = parsed.amount ?
        (parsed.amount.toFixed(0) * satToUnit).toFixed(this.unitDecimals) : 0;

      this.setForm(addr, amount, message);
      return addr;
    };

    this.onAddressChange = function(value) {
      this.error = this.success = null;
      if (!value) return '';

      if (value.indexOf('bitcoin:') === 0) {
        return this.setFromUri(value);
      } else if (/^https?:\/\//.test(value)) {
        return this.setFromPayPro(value);
      } else {
        this.setForm(value, null, null);
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
