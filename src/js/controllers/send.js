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
      this.setScanner();

      var config = configService.getSync().wallet.settings;
      this.alternativeName = config.alternativeName;
      this.alternativeIsoCode = config.alternativeIsoCode;
      this.unitToSatoshi = config.unitToSatoshi;

      // TODO : rateService
      // rateService.whenAvailable(function() {
      //   self.isRateAvailable = true;
      //   self.$digest();
      // });
      //
      if (isCordova) {
        var openScannerCordova = $rootScope.$on('dataScanned', function(event, data) {
          self.sendForm.address.$setViewValue(data);
          self.sendForm.address.$render();
        });

        this.$on('$destroy', function() {
          openScannerCordova();
        });
      };
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
      Object.defineProperty(self,
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
      Object.defineProperty(self,
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

      Object.defineProperty(self,
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

    this.setScanner = function() {
      navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      window.URL = window.URL || window.webkitURL ||
        window.mozURL || window.msURL;

      if (!window.cordova && !navigator.getUserMedia)
        this.disableScanner = 1;
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

      if (isCordova) {
        window.plugins.spinnerDialog.show(null, 'Creating transaction...', true);
      }

      this.loading = true;
      if (this.isWindowsPhoneApp)
        $rootScope.wpInputFocused = true;

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
          if (self.isWindowsPhoneApp)
            $rootScope.wpInputFocused = false;

          if (err) {
            self.setError(err);
          } else {
            txStatus.notify(txp);
            $rootScope.$emit('updateStatus');
            self.resetForm(form);
          }
        });
      }, 100);
    };

    // QR code Scanner
    var cameraInput;
    var video;
    var canvas;
    var $video;
    var context;
    var localMediaStream;

    var _scan = function(evt) {
      console.log('[send.js.233:evt:]', evt); //TODO
      if (self.isMobile) {
        self.scannerLoading = true;
        var files = evt.target.files;

        if (files.length === 1 && files[0].type.indexOf('image/') === 0) {
          var file = files[0];

          var reader = new FileReader();
          reader.onload = (function(theFile) {
            return function(e) {
              var mpImg = new MegaPixImage(file);
              mpImg.render(canvas, {
                maxWidth: 200,
                maxHeight: 200,
                orientation: 6
              });

              $timeout(function() {
                qrcode.width = canvas.width;
                qrcode.height = canvas.height;
                qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);

                try {
                  qrcode.decode();
                } catch (e) {
                  // error decoding QR
                }
              }, 1500);
            };
          })(file);

          // Read  in the file as a data URL
          reader.readAsDataURL(file);
        }
      } else {

        console.log('[send.js.270]'); //TODO
        if (localMediaStream) {
          context.drawImage(video, 0, 0, 300, 225);

          try {
            qrcode.decode();
          } catch (e) {
            //qrcodeError(e);
          }
        }

        $timeout(_scan, 500);
      }
    };

    var _successCallback = function(stream) {
      video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      localMediaStream = stream;
      video.play();
      $timeout(_scan, 1000);
    };

    var _scanStop = function() {
      this.scannerLoading = false;
      this.showScanner = false;
      if (!this.isMobile) {
        if (localMediaStream && localMediaStream.stop) localMediaStream.stop();
        localMediaStream = null;
        video.src = '';
      }
    };

    var _videoError = function(err) {
      _scanStop();
    };

    qrcode.callback = function(data) {
      _scanStop();
      this.$apply(function() {
        self.sendForm.address.$setViewValue(data);
        self.sendForm.address.$render();
      });
    };

    this.cancelScanner = function() {
      _scanStop();
    };

    this.openScanner = function() {
      var self = this;
      this.showScanner = true;

      // Wait a moment until the canvas shows
      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if (self.isMobile) {
          cameraInput = document.getElementById('qrcode-camera');
          cameraInput.addEventListener('change', _scan, false);
        } else {
          video = document.getElementById('qrcode-scanner-video');
          $video = angular.element(video);
          canvas.width = 300;
          canvas.height = 225;
          context.clearRect(0, 0, 300, 225);

          navigator.getUserMedia({
            video: true
          }, _successCallback, _videoError);
        }
      }, 500);
    };

    this.setTopAmount = function() {
      throw new Error('todo: setTopAmount');
      var form = this.sendForm;
      if (form) {
        form.amount.$setViewValue(w.balanceInfo.topAmount);
        form.amount.$render();
        form.amount.$isValid = true;
      }
    };

    this.setForm = function(to, amount, comment) {
      var form = this.sendForm;
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
        windowClass: 'medium',
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
      var form = this.sendForm;

      uri = sanitizeUri(uri);

      var parsed = new bitcore.BIP21(uri);
      if (!parsed.isValid() || !parsed.address.isValid()) {
        this.error = 'Invalid bitcoin URL';
        form.address.$isValid = false;
        return uri;
      };

      var addr = parsed.address.toString();
      if (parsed.data.merchant)
        return this.setFromPayPro(parsed.data.merchant);

      var amount = (parsed.data && parsed.data.amount) ?
        ((parsed.data.amount * 100000000).toFixed(0) * satToUnit).toFixed(w.settings.unitDecimals) : 0;

      this.setForm(addr, amount, parsed.data.message, true);
      return addr;
    };

    this.onAddressChange = function(value) {
      this.error = this.success = null;
      if (!value) return '';

      if (value.indexOf('bitcoin:') === 0) {
        return this.setFromUri(value);
      } else if (/^https?:\/\//.test(value)) {
        return this.setFromPayPro(value);
      }

      return value;
    };

    this.openAddressBook = function() {
      var w = $rootScope.wallet;
      var modalInstance = $modal.open({
        templateUrl: 'views/modals/address-book.html',
        windowClass: 'large',
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
