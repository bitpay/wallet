'use strict';
var bitcore = require('bitcore');
var preconditions = require('preconditions').singleton();

angular.module('copayApp.controllers').controller('SendController',
  function($scope, $rootScope, $window, $timeout, $modal, $filter, isMobile, notification, rateService) {
    var w = $rootScope.wallet;
    preconditions.checkState(w);
    preconditions.checkState(w.settings.unitToSatoshi);

    $rootScope.title = w.isShared() ? 'Create Transaction Proposal' : 'Send';
    $scope.loading = false;
    $scope.error = $scope.success = null;
    var satToUnit = 1 / w.settings.unitToSatoshi;
    $scope.defaultFee = bitcore.TransactionBuilder.FEE_PER_1000B_SAT * satToUnit;
    $scope.unitToBtc = w.settings.unitToSatoshi / bitcore.util.COIN;
    $scope.unitToSatoshi = w.settings.unitToSatoshi;

    $scope.alternativeName = w.settings.alternativeName;
    $scope.alternativeIsoCode = w.settings.alternativeIsoCode;

    $scope.isRateAvailable = false;
    $scope.rateService = rateService;
    $scope.showScanner = false;
    $scope.myId = w.getMyCopayerId();
    $scope.isMobile = isMobile.any();

    rateService.whenAvailable(function() {
      $scope.isRateAvailable = true;
      $scope.$digest();
    });

    $scope.setAlternativeAmount = function(w, tx, cb) {
      rateService.whenAvailable(function() {
        _.each(tx.outs, function(out) {
          var valueSat = out.valueSat * w.settings.unitToSatoshi;
          out.alternativeAmount =  $filter('noFractionNumber')(rateService.toFiat(valueSat, $scope.alternativeIsoCode), 2);
          out.alternativeIsoCode = $scope.alternativeIsoCode;
        });
        if (cb) return cb(tx);
      });
    };


    $scope.updateTxs = _.throttle(function(cb) {
      var w = $rootScope.wallet;
      if (!w || !cb) return;

      var res = w.getPendingTxProposals();
      _.each(res.txs, function(tx) {
        $scope.setAlternativeAmount(w, tx);
        if (tx.merchant) {
          var url = tx.merchant.request_url;
          var domain = /^(?:https?)?:\/\/([^\/:]+).*$/.exec(url)[1];
          tx.merchant.domain = domain;
        }
        if (tx.outs) {
          _.each(tx.outs, function(out) {
            out.valueSat = out.value;
            out.value = $filter('noFractionNumber')(out.value);
          });
        }        
      });
      return cb(res.txs);
    },  1000);

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
              (rateService.toFiat(newValue * w.settings.unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
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
          _onChanged();
        },
        enumerable: true,
        configurable: true
      });


    $scope.init = function() {
      $rootScope.pendingTxCount = 0;
      $scope.updateTxs(function(txps) {
        $scope.txps = txps;
      });
      var w = $rootScope.wallet;
      w.on('txProposalEvent', function() {
        $scope.updateTxs(function(txps) {
          $scope.txps = txps;
        });
      });
    };

    $scope.$on("$destroy", function(){
      var w = $rootScope.wallet;
      w.removeListener('txProposalEvent', function() { 
        $scope.updateTxs(function(txps) {
          $scope.txps = txps;
        });
      });
    });

    $scope.showAddressBook = function() {
      return w && _.keys(w.addressBook).length > 0;
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    if (!window.cordova && !navigator.getUserMedia)
      $scope.disableScanner = 1;

    $scope._showError = function(err) {
      copay.logger.error(err);

      var msg = err.toString();
      if (msg.match('BIG'))
        msg = 'The transaction have too many inputs. Try creating many transactions  for smaller amounts'

      if (msg.match('totalNeededAmount'))
        msg = 'Not enough funds'

      var message = 'The transaction' + (w.isShared() ? ' proposal' : '') +
        ' could not be created: ' + msg;

      $scope.error = message;
      $scope.loading = false;
      $scope.updateTxs(function(txps) {
        $scope.txps = txps;
      });
    };

    $scope.submitForm = function(form) {
      if (form.$invalid) {
        $scope.error = 'Unable to send transaction proposal';
        return;
      }

      $scope.loading = true;

      var address = form.address.$modelValue;
      var amount = parseInt((form.amount.$modelValue * w.settings.unitToSatoshi).toFixed(0));
      var commentText = form.comment.$modelValue;


      var payInfo;
      if (address.indexOf('bitcoin:') === 0) {
        payInfo = (new bitcore.BIP21(address)).data;
      } else if (/^https?:\/\//.test(address)) {
        payInfo = {
          merchant: address
        };
      }

      // If we're setting the domain, ignore the change.
      if ($rootScope.merchant && $rootScope.merchant.domain && address === $rootScope.merchant.domain) {
        payInfo = {
          merchant: $rootScope.merchant.request_url
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
        $scope.updateTxs(function(txps) {
          $scope.txps = txps;
        });
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

    $scope.toggleAddressBookEntry = function(key) {
      w.toggleAddressBookEntry(key);
    };

    $scope.copyAddress = function(address) {
      $scope.address = address;
    };

    $scope.openAddressBookModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'views/modals/address-book.html',
        windowClass: 'tiny',
        controller: function($scope, $modalInstance) {

          $scope.submitAddressBook = function(form) {
            if (form.$invalid) {
              return;
            }
            var entry = {
              "address": form.newaddress.$modelValue,
              "label": form.newlabel.$modelValue
            };
            form.newaddress.$pristine = form.newlabel.$pristine = true;
            $modalInstance.close(entry);
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        },
      });

      modalInstance.result.then(function(entry) {

        $timeout(function() {
          $scope.loading = false;
          var errorMsg;
          try {
            w.setAddressBook(entry.address, entry.label);
          } catch (e) {
            errorMsg = e.message;
          }

          // TODO change this notifications
          if (errorMsg) {
            notification.error('Error', errorMsg);
          } else {
            notification.success('Success', 'New entry has been created');
          }
          $rootScope.$digest();
        }, 500);
        // reset fields
        $scope.newaddress = $scope.newlabel = null;
      });
    };

    $scope.setTopAmount = function() {
      $scope.amount = $rootScope.topAmount;
    };

    $scope.notifyStatus = function(status) {
      if (status == copay.Wallet.TX_BROADCASTED)
        notification.success('Success', 'Transaction broadcasted!');
      else if (status == copay.Wallet.TX_PROPOSAL_SENT)
        notification.success('Success', 'Transaction proposal created');
      else if (status == copay.Wallet.TX_SIGNED)
        notification.success('Success', 'Transaction proposal was signed');
      else if (status == copay.Wallet.TX_SIGNED_AND_BROADCASTED)
        notification.success('Success', 'Transaction signed and broadcasted!');
      else
        notification.error('Error', 'Unknown error occured');
    };


    $scope.send = function(ntxid, cb) {
      $scope.error = $scope.success = null;
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      w.issueTx(ntxid, function(err, txid, status) {
        $scope.notifyStatus(status);
        if (cb) return cb();
        else { 
          $scope.updateTxs(function(txps) {
            $scope.txps = txps;
          });
        }
      });
    };

    $scope.sign = function(ntxid) {
      $scope.loading = true;
      $scope.error = $scope.success = null;
      w.signAndSend(ntxid, function(err, id, status) {
        $scope.loading = false;
        $scope.notifyStatus(status);
        $scope.updateTxs(function(txps) {
        $scope.txps = txps;
      });
      });
    };

    $scope.reject = function(ntxid) {
      w.reject(ntxid);
      notification.warning('Transaction rejected', 'You rejected the transaction successfully');
      $scope.updateTxs(function(txps) {
        $scope.txps = txps;
      });
    };

    $scope.clearMerchant = function(callback) {
      // TODO: Find a better way of detecting
      // whether we're in the Send scope or not.
      if (!$scope.sendForm || !$scope.sendForm.address) {
        delete $rootScope.merchant;
        $rootScope.merchantError = false;
        $scope.isPayUri = false;
        if (callback) callback();
        return;
      }
      var val = $scope.sendForm.address.$viewValue || '';
      var uri;
      // If we're setting the domain, ignore the change.
      if ($rootScope.merchant && $rootScope.merchant.domain && val === $rootScope.merchant.domain) {
        uri = {
          merchant: $rootScope.merchant.request_url
        };
      }
      if (val.indexOf('bitcoin:') === 0) {
        uri = new bitcore.BIP21(val).data;
      } else if (/^https?:\/\//.test(val)) {
        uri = {
          merchant: val
        };
      }
      if (!uri || !uri.merchant) {
        delete $rootScope.merchant;
        $scope.sendForm.amount.$setViewValue('');
        $scope.sendForm.amount.$render();
        if (callback) callback();
        if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest') {
          $rootScope.$apply();
        }
      }
    };

    $scope.cancelSend = function(form) {
      delete $rootScope.merchant;
      $rootScope.merchantError = false;
      $scope.isPayUri = false;
      form.address.$setViewValue('');
      form.address.$render();
      form.amount.$setViewValue('');
      form.amount.$render();
      form.comment.$setViewValue('');
      form.comment.$render();
      form.$setPristine();
    }; 

    var _onChanged = function(pp) { 
      var value;

      if (pp) {
        $scope.isPayUri = true;
        var amount = (pp.data && pp.data.amount) ? pp.data.amount * 100000000 * satToUnit : 0;
        $scope.commentText = pp.data.message;
        if (pp.data.merchant) {
          value = 'bitcoin:' + pp.address.data + '?amount=' + amount + '&r=' + pp.data.r;
        }
        else {
          value = pp.address + '';
          $timeout(function() {
            $scope.amount = amount;
          }, 1000);
          $scope.address = value;
        }
      }

      value = value || $scope.address || '';
      var uri;

      $scope.error = $scope.success = null;
      // If we're setting the domain, ignore the change.
      if ($rootScope.merchant && $rootScope.merchant.domain && value === $rootScope.merchant.domain) {
        return;
      }

      if (value.indexOf('bitcoin:') === 0) {
        uri = new bitcore.BIP21(value);
      } else if (/^https?:\/\//.test(value)) {
        uri = {
          data : {
            merchant: value
          }
        };
      }

      if (!uri || !uri.data.merchant) {
        if (uri && uri.address) {
          var amount = (uri.data && uri.data.amount) ? uri.data.amount * 100000000 * satToUnit : 0;
          var address = uri.address.data;
          if (amount && address) {
            $scope.isPayUri = true;
          }
          $timeout(function() {
            $scope.amount = amount;
          }, 1000);
          $scope.commentText = uri.data.message;
          $scope.address = address;
        }
        return;
      }

      var apply = function() {
        if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest') {
          $rootScope.$apply();
        }
      };

      $scope.fetchingURL = uri.data.merchant;
      $scope.loading = true;
      apply();

      var timeout = setTimeout(function() {
        timeout = null;
        $scope.fetchingURL = null;
        $scope.loading = false;
        $scope.sendForm.address.$setViewValue('');
        $scope.sendForm.address.$render();
        $scope.sendForm.address.$isValid = false;
        $scope.error = 'Payment server timed out';
        apply();
      }, 10 * 1000);

      // Payment Protocol URI (BIP-72)
      $scope.wallet.fetchPaymentRequest({
        url: uri.data.merchant
      }, function(err, merchantData) {
        if (!timeout) return;
        clearTimeout(timeout);

        $scope.loading = false;
        $scope.fetchingURL = null;
        apply();

        var balance = $rootScope.availableBalance;
        var available = +(balance * w.settings.unitToSatoshi).toFixed(0);
        if (merchantData && available < +merchantData.total) {
          err = new Error('Insufficient funds.');
          err.amount = merchantData.total;
        }

        if (err) {
          if (err.amount) {
            $scope.sendForm.amount.$setViewValue(+err.amount / w.settings.unitToSatoshi);
            $scope.sendForm.amount.$render();
            $scope.sendForm.amount.$isValid = false;
            $scope.notEnoughAmount = true;
            $rootScope.merchantError = true;
            var lastAddr = $scope.sendForm.address.$viewValue;
            var unregister = $scope.$watch('address', function() {
              if ($scope.sendForm.address.$viewValue !== lastAddr) {
                delete $rootScope.merchantError;
                $scope.isPayUri = false;
                $scope.sendForm.amount.$setViewValue('');
                $scope.sendForm.amount.$render();
                unregister();
                apply();
              }
            });
          } else {
            $scope.sendForm.address.$setViewValue('');
            $scope.sendForm.address.$render();
          }
          $scope.sendForm.address.$isValid = false;
          copay.logger.error(err);

          $scope.error = 'Could not fetch payment request';

          apply();
          return;
        }

        var url = merchantData.request_url;
        var domain = /^(?:https?)?:\/\/([^\/:]+).*$/.exec(url)[1];

        merchantData.unitTotal = (+merchantData.total / w.settings.unitToSatoshi) + '';
        merchantData.expiration = new Date(
          merchantData.pr.pd.expires * 1000);
        merchantData.domain = domain;

        $rootScope.merchant = merchantData;

        $scope.sendForm.address.$setViewValue(domain);
        $scope.sendForm.address.$render();
        $scope.sendForm.address.$isValid = true;

        $scope.sendForm.amount.$setViewValue(merchantData.unitTotal);
        $scope.sendForm.amount.$render();
        $scope.sendForm.amount.$isValid = true;

        // If the address changes to a non-payment-protocol one,
        // delete the `merchant` property from the scope.
        var unregister = $rootScope.$watch(function() {
          $scope.clearMerchant(unregister);
        });

        apply();
      });
    };

    if ($rootScope.pendingPayment) {
      var value;
      var pp = $rootScope.pendingPayment; 
      _onChanged(pp);
    }

  });
