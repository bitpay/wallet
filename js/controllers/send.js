'use strict';
var bitcore = require('bitcore');
var preconditions = require('preconditions').singleton();

angular.module('copayApp.controllers').controller('SendController',
  function($scope, $rootScope, $window, $timeout, $modal, $filter, notification, isMobile, rateService, txStatus) {

    var satToUnit;

    $scope.init = function() {
      var w = $rootScope.wallet;
      preconditions.checkState(w);
      preconditions.checkState(w.settings.unitToSatoshi);

      $rootScope.title = w.isShared() ? 'Send Proposal' : 'Send';
      $scope.loading = false;
      $scope.error = $scope.success = null;

      satToUnit = 1 / w.settings.unitToSatoshi;

      $scope.alternativeName = w.settings.alternativeName;
      $scope.alternativeIsoCode = w.settings.alternativeIsoCode;

      $scope.isRateAvailable = false;
      $scope.rateService = rateService;
      $scope.showScanner = false;
      $scope.myId = w.getMyCopayerId();
      $scope.isMobile = isMobile.any();

      if ($rootScope.pendingPayment) {
        $timeout(function() {
          $scope.setFromUri($rootScope.pendingPayment)
          $rootScope.pendingPayment = null;
        }, 100);
      }

      $scope.setInputs();
      $scope.setScanner();

      rateService.whenAvailable(function() {
        $scope.isRateAvailable = true;
        $scope.$digest();
      });
    }

    $scope.setInputs = function() {
      var w = $rootScope.wallet;
      var unitToSat = w.settings.unitToSatoshi;
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
            if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
              this._amount = parseFloat(
                (rateService.fromFiat(newValue, $scope.alternativeIsoCode) * satToUnit).toFixed(w.settings.unitDecimals), 10);
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
            if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
              this.__alternative = parseFloat(
                (rateService.toFiat(newValue * unitToSat, $scope.alternativeIsoCode)).toFixed(2), 10);
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
            this.__address = $scope.onAddressChange(newValue);
          },
          enumerable: true,
          configurable: true
        });
    };

    $scope.setScanner = function() {
      navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      window.URL = window.URL || window.webkitURL ||
        window.mozURL || window.msURL;

      if (!window.cordova && !navigator.getUserMedia)
        $scope.disableScanner = 1;
    };


    $scope.setError = function(err) {
      var w = $rootScope.wallet;
      copay.logger.warn(err);

      var msg = err.toString();
      if (msg.match('BIG'))
        msg = 'The transaction have too many inputs. Try creating many transactions  for smaller amounts'

      if (msg.match('totalNeededAmount') || msg.match('unspent not set'))
        msg = 'Insufficient funds'

      if (msg.match('expired'))
        msg = 'The payment request has expired';

      var message = 'The transaction' + (w.isShared() ? ' proposal' : '') +
        ' could not be created: ' + msg;

      $scope.error = message;

      $timeout(function() {
        $scope.$digest();
      }, 1);
    };

    $scope.submitForm = function(form) {
      var w = $rootScope.wallet;
      var unitToSat = w.settings.unitToSatoshi;

      if (form.$invalid) {
        $scope.error = 'Unable to send transaction proposal';
        return;
      }

      $scope.loading = true;
      var comment = form.comment.$modelValue;
      var merchantData = $scope._merchantData;
      var address, amount;
      if (!merchantData) {
        address = form.address.$modelValue;
        amount = parseInt((form.amount.$modelValue * unitToSat).toFixed(0));
      }

      w.spend({
        merchantData: merchantData,
        toAddress: address,
        amountSat: amount,
        comment: comment,
      }, function(err, txid, status) {
        $scope.loading = false;
        if (err)
          return $scope.setError(err);
        txStatus.notify(status);
        $scope.resetForm();
      });
    };

    // QR code Scanner
    var cameraInput;
    var video;
    var canvas;
    var $video;
    var context;
    var localMediaStream;

    var _scan = function(evt) {
      if ($scope.isMobile) {
        $scope.scannerLoading = true;
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
      $scope.scannerLoading = false;
      $scope.showScanner = false;
      if (!$scope.isMobile) {
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
      $scope.$apply(function() {
        $scope.sendForm.address.$setViewValue(data);
        $scope.sendForm.address.$render();
      });
    };

    $scope.cancelScanner = function() {
      _scanStop();
    };

    $scope.openScanner = function() {
      if (window.cordova) return $scope.scannerIntent();
      $scope.showScanner = true;

      // Wait a moment until the canvas shows
      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if ($scope.isMobile) {
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

    $scope.scannerIntent = function() {
      window.ignoreMobilePause = true;
      cordova.plugins.barcodeScanner.scan(
        function onSuccess(result) {
          $timeout(function(){
            window.ignoreMobilePause = false;
          }, 100);
          if (result.cancelled) return;

          $timeout(function() {
            var data = result.text;
            $scope.$apply(function() {
              $scope.sendForm.address.$setViewValue(result.text);
              $scope.sendForm.address.$render();
            });
          }, 1000);
        },
        function onError(error) {
          $timeout(function(){
            window.ignoreMobilePause = false;
          }, 100);
          alert('Scanning error');
        });
    }

    $scope.setTopAmount = function() {
      var w = $rootScope.wallet;
      var form = $scope.sendForm;
      if (form) {
        form.amount.$setViewValue(w.balanceInfo.topAmount);
        form.amount.$render();
        form.amount.$isValid = true;
      }
    };

    $scope.setForm = function(to, amount, comment) {
      var form = $scope.sendForm;
      if (to) {
        form.address.$setViewValue(to);
        form.address.$isValid = true;
        form.address.$render();
        $scope.lockAddress = true;
      }

      if (amount) {
        form.amount.$setViewValue("" + amount);
        form.amount.$isValid = true;
        form.amount.$render();
        $scope.lockAmount = true;
      }

      if (comment) {
        form.comment.$setViewValue(comment);
        form.comment.$isValid = true;
        form.comment.$render();
      }
    };

    $scope.resetForm = function() {
      var form = $scope.sendForm;

      $scope.fetchingURL = null;
      $scope._merchantData = $scope._domain = null;

      $scope.lockAddress = false;
      $scope.lockAmount = false;

      $scope._amount = $scope._address = null;

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

    var $oscope = $scope;
    $scope.openPPModal = function(merchantData) {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.md = merchantData;
        $scope.alternative = $oscope._alternative;
        $scope.alternativeIsoCode = $oscope.alternativeIsoCode;
        $scope.isRateAvailable = $oscope.isRateAvailable;

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };
      $modal.open({
        templateUrl: 'views/modals/paypro.html',
        windowClass: 'tiny',
        controller: ModalInstanceCtrl,
      });
    };


    $scope.setFromPayPro = function(uri) {

      var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;
      if (isChromeApp) {
        $scope.error = 'Payment Protocol not yet supported on ChromeApp';
        return;
      }

      var w = $rootScope.wallet;
      $scope.fetchingURL = uri;
      $scope.loading = true;


      // Payment Protocol URI (BIP-72)
      w.fetchPaymentRequest({
        url: uri
      }, function(err, merchantData) {
        $scope.loading = false;
        $scope.fetchingURL = null;

        if (err) {
          copay.logger.warn(err);
          $scope.resetForm();
          var msg = err.toString();
          if (msg.match('HTTP')) {
            msg = 'Could not fetch payment information';
          }
          $scope.error = msg;
        } else {
          $scope._merchantData = merchantData;
          $scope._domain = merchantData.domain;
          $scope.setForm(null, merchantData.total * satToUnit);
        }
      });
    };

    $scope.setFromUri = function(uri) {
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

      var form = $scope.sendForm;

      uri = sanitizeUri(uri);

      var parsed = new bitcore.BIP21(uri);
      if (!parsed.isValid() || !parsed.address.isValid()) {
        $scope.error = 'Invalid bitcoin URL';
        form.address.$isValid = false;
        return uri;
      };

      var addr = parsed.address.toString();
      if (parsed.data.merchant)
        return $scope.setFromPayPro(parsed.data.merchant);

      var amount = (parsed.data && parsed.data.amount) ?
        (parsed.data.amount * 100000000).toFixed(0) * satToUnit : 0;

      $scope.setForm(addr, amount, parsed.data.message, true);
      return addr;
    };

    $scope.onAddressChange = function(value) {
      $scope.error = $scope.success = null;
      if (!value) return '';

      if (value.indexOf('bitcoin:') === 0) {
        return $scope.setFromUri(value);
      } else if (/^https?:\/\//.test(value)) {
        return $scope.setFromPayPro(value);
      }

      return value;
    };

    $scope.openAddressBook = function() {
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
            $scope.error = $scope.success = null;
            $scope.toggleForm();
          };

          $scope.toggleForm = function() {
            $scope.showForm = !$scope.showForm;
          };

          // TODO change to modal
          $scope.submitAddressBook = function(form) {
            if (form.$invalid) {
              return;
            }
            $timeout(function() {
              var errorMsg;
              var entry = {
                "address": form.newaddress.$modelValue,
                "label": form.newlabel.$modelValue
              };
              try {
                w.setAddressBook(entry.address, entry.label);
              } catch (e) {
                copay.logger.warn(e);
                errorMsg = e.message;
              }

              if (errorMsg) {
                $scope.error = errorMsg;
              } else {
                $scope.toggleForm();
                notification.success('Entry created', 'New addressbook entry created')
              }
              $rootScope.$digest();
            }, 1);
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
