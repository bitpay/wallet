'use strict';
var bitcore = require('bitcore');
var preconditions = require('preconditions').singleton();

angular.module('copayApp.controllers').controller('SendController',
  function($scope, $rootScope, $window, $timeout, $modal, $filter, $location, isMobile, notification, rateService) {

    var satToUnit, unitToSat, w;

    $scope.init = function() {
      w = $rootScope.wallet;
      preconditions.checkState(w);
      preconditions.checkState(w.settings.unitToSatoshi);

      $rootScope.title = w.isShared() ? 'Create Transaction Proposal' : 'Send';
      $scope.loading = false;
      $scope.error = $scope.success = null;

      unitToSat = w.settings.unitToSatoshi;
      satToUnit = 1 / w.settings.unitToSatoshi;

      $scope.alternativeName = w.settings.alternativeName;
      $scope.alternativeIsoCode = w.settings.alternativeIsoCode;

      $scope.isPayUri = false;
      $scope.isRateAvailable = false;
      $scope.rateService = rateService;
      $scope.showScanner = false;
      $scope.myId = w.getMyCopayerId();
      $scope.isMobile = isMobile.any();

      if ($rootScope.pendingPayment) {
        var value;
        var pp = $rootScope.pendingPayment;
        var amount = (pp.data && pp.data.amount) ?
          pp.data.amount * 100000000 * satToUnit : 0;
        $scope.setForm(pp.address, amount, pp.data.message)
        _onAddressChange(pp);
      }

      $scope.setInputs();
      $scope.setScanner();

      rateService.whenAvailable(function() {
        $scope.isRateAvailable = true;
        $scope.$digest();
      });
    }

    $scope.setInputs = function() {
      /**
       * Setting the two related amounts as properties prevents an infinite
       * recursion for watches while preserving the original angular updates
       *
       */
      Object.defineProperty($scope,
        "alternative", {
          get: function() {
            return this._alternative;
          },
          set: function(newValue) {
            this._alternative = newValue;
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
        "amount", {
          get: function() {
            return this._amount;
          },
          set: function(newValue) {
            this._amount = newValue;
            if (typeof(newValue) === 'number' && $scope.isRateAvailable) {

              this._alternative = parseFloat(
                (rateService.toFiat(newValue * unitToSat, $scope.alternativeIsoCode)).toFixed(2), 10);
            } else {
              this._alternative = 0;
            }
          },
          enumerable: true,
          configurable: true
        });

      Object.defineProperty($scope,
        "address", {
          get: function() {
            return this._address;
          },
          set: function(newValue) {
            this._address = newValue;
            _onAddressChange();
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


    $scope._showError = function(err) {
      copay.logger.error(err);

      var msg = err.toString();
      if (msg.match('BIG'))
        msg = 'The transaction have too many inputs. Try creating many transactions  for smaller amounts'

      if (msg.match('totalNeededAmount') || msg.match('unspent not set'))
        msg = 'Insufficient funds'

      var message = 'The transaction' + (w.isShared() ? ' proposal' : '') +
        ' could not be created: ' + msg;

      $scope.error = message;
      $scope.loading = false;
    };

    $scope.submitForm = function(form) {
      if (form.$invalid) {
        $scope.error = 'Unable to send transaction proposal';
        return;
      }

      $scope.loading = true;

      var address = form.address.$modelValue;
      var amount = parseInt((form.amount.$modelValue * unitToSat).toFixed(0));
      var commentText = form.comment.$modelValue;


      var payInfo;
      if (address.indexOf('bitcoin:') === 0) {
        payInfo = (new bitcore.BIP21(address)).data;
      } else if (/^https?:\/\//.test(address)) {
        payInfo = {
          merchant: address
        };
      }

      w.spend({
        toAddress: address,
        amountSat: amount,
        comment: commentText,
        url: (payInfo && payInfo.merchant) ? payInfo.merchant : null,
      }, function(err, txid, status) {
        $scope.loading = false;
        // reset fields
        $scope.address = $scope.amount = $scope.commentText = null;
        form.address.$pristine = form.amount.$pristine = true;
        $rootScope.pendingPayment = null;
        $scope.isPayUri = null;
        if (err) return $scope._showError(err);

        $scope.notifyStatus(status);
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
      cordova.plugins.barcodeScanner.scan(
        function onSuccess(result) {
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
          alert('Scanning error');
        });
    }

    $scope.setTopAmount = function() {
      $scope.amount = $rootScope.topAmount;
    };

    $scope.notifyStatus = function(status) {
      if (status == copay.Wallet.TX_BROADCASTED)
        $scope.success = 'Transaction broadcasted!';
      else if (status == copay.Wallet.TX_PROPOSAL_SENT)
        $scope.success = 'Transaction proposal created';
      else if (status == copay.Wallet.TX_SIGNED)
        $scope.success = 'Transaction proposal was signed';
      else if (status == copay.Wallet.TX_SIGNED_AND_BROADCASTED)
        $scope.success = 'Transaction signed and broadcasted!';
      else
        $scope.error = 'Unknown error occured';

      $timeout(function() {
        $scope.$digest();
      });
    };


    $scope.send = function(ntxid, cb) {
      $scope.error = $scope.success = null;
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      w.issueTx(ntxid, function(err, txid, status) {
        $scope.loading = false;
        $scope.notifyStatus(status);
        if (cb) return cb();
      });
    };

    $scope.setForm = function(to, amount, comment) {
      var form = $scope.sendForm;
      form.address.$setViewValue(merchantData.domain);
      form.address.$render();
      form.address.$isValid = true;

      form.amount.$setViewValue(merchantData.unitTotal);
      form.amount.$render();
      form.amount.$isValid = true;

      if (comment)
        $scope.commentText = comment;
    };

    $scope.cancelSend = function(error) {
      var form = $scope.sendForm;

      if (error)
        $scope.error = error;

      $scope.fetchingURL = null;
      $scope.isPayUri = null;
      form.address.$setViewValue('');
      form.address.$render();
      form.amount.$setViewValue('');
      form.amount.$render();
      form.comment.$setViewValue('');
      form.comment.$render();
      form.$setPristine();
    };


    $scope.openPPModal = function(pp) {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.pp = pp;
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



    var _onAddressChange = function(pp) {
      var value;
      value = value || $scope.address || '';
      var uri;

      $scope.error = $scope.success = null;

      if (value.indexOf('bitcoin:') === 0) {
        uri = new bitcore.BIP21(value);
      } else if (/^https?:\/\//.test(value)) {
        uri = {
          data: {
            merchant: value
          }
        };
      }

      if (!uri || !uri.data.merchant) {
        if (uri && uri.address) {
          var amount = (uri.data && uri.data.amount) ? uri.data.amount * 100000000 * satToUnit : 0;
          var address = uri.address.data;
          if (amount && address) {
            $scope.isPayUri = {fixedAmount: true} ;
          }
          $timeout(function() {
            $scope.amount = amount;
          }, 1000);
          $scope.commentText = uri.data.message;
          $scope.address = address;
        }
        return;
      }

      $scope.fetchingURL = uri.data.merchant;
      $scope.loading = true;


      var balance = w.balanceInfo.availableBalance;
      var available = +(balance * unitToSat).toFixed(0);

      // Payment Protocol URI (BIP-72)
      $scope.wallet.fetchPaymentRequest({
        url: uri.data.merchant
      }, function(err, merchantData) {
        $scope.loading = false;
        $scope.fetchingURL = null;

        if (err) {
          if (err.match('TIMEOUT')) {
            $scope.cancelSend('Payment server timed out');
          } else {
            $scope.cancelSend(err.toString());
          }

        } else if (merchantData && available < +merchantData.total) {
          $scope.cancelSend(err.toString('Insufficient funds'));
        } else {
          $scope.setForm(merchantData.domain, merchantData.unitTotal)
        }
        $timeout(function() {
          $scope.$digest();
        }, 1);
      });
    };

    $scope.openAddressBook = function() {
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

          $scope.cancel = function() {
            $scope.error = $scope.success = null;
            $scope.toggleForm();
          };

          $scope.toggleForm = function() {
            $scope.showForm = !$scope.showForm;
          };

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
                console.log('[send.js:583]', e); //TODO
                errorMsg = e.message;
              }

              if (errorMsg) {
                $scope.error = errorMsg;
              } else {
                $scope.toggleForm();
                $scope.success = 'New entry has been created';
              }
              $rootScope.$digest();
            }, 500);

            $timeout(function() {
              $scope.error = $scope.success = null;
            }, 5000);

            return;

          };

          $scope.close = function() {
            $modalInstance.dismiss('cancel');
          };
        },
      });

      modalInstance.result.then(function(addr) {
        $scope.address = addr;
      });
    };

  });
