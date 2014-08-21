'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('SendController',
  function($scope, $rootScope, $window, $timeout, $anchorScroll, $modal, isMobile, notification, controllerUtils) {
    $scope.title = 'Send';
    $scope.loading = false;
    var satToUnit = 1 / config.unitToSatoshi;
    $scope.defaultFee = bitcore.TransactionBuilder.FEE_PER_1000B_SAT * satToUnit;
    $scope.unitToBtc = config.unitToSatoshi / bitcore.util.COIN;
    $scope.minAmount = config.limits.minAmountSatoshi * satToUnit;

    $scope.loadTxs = function() {
      var opts = {
        pending: true,
        skip: null
      };
      controllerUtils.updateTxs(opts);
      setTimeout(function() {
        $scope.loading = false;
        $rootScope.$digest();
      }, 0);
    }

    $scope.showAddressBook = function() {
      var w = $rootScope.wallet;
      var flag;
      if (w) {
        for (var k in w.addressBook) {
          if (w.addressBook[k]) {
            flag = true;
            break;
          }
        }
      }
      return flag;
    };

    if ($rootScope.pendingPayment) {
      var pp = $rootScope.pendingPayment;
      $scope.address = pp.address + '';
      var amount = pp.data.amount / config.unitToSatoshi * 100000000;
      $scope.amount = amount;
      $scope.commentText = pp.data.message;
    }

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    $scope.isMobile = isMobile.any();

    $scope.submitForm = function(form) {
      if (form.$invalid) {
        var message = 'Unable to send transaction proposal.';
        notification.error('Error', message);
        return;
      }

      $scope.loading = true;

      var address = form.address.$modelValue;
      var amount = (form.amount.$modelValue * config.unitToSatoshi) | 0;
      var commentText = form.comment.$modelValue;

      var w = $rootScope.wallet;

      function done(ntxid, merchantData) {
        // If user is granted the privilege of choosing
        // their own amount, add it to the tx.
        if (merchantData && +merchantData.total === 0) {
          var txp = w.txProposals.get(ntxid);
          var tx = txp.builder.tx = txp.builder.tx || txp.builder.build();
          tx.outs[0].v = bitcore.Bignum(amount + '', 10).toBuffer({
            // XXX This may not work in node due
            // to the bignum only-big endian bug:
            endian: 'little',
            size: 1
          });
        }

        if (w.isShared()) {
          $scope.loading = false;
          var message = 'The transaction proposal has been created';
          if (merchantData) {
            if (merchantData.pr.ca) {
              message += ' This payment protocol transaction' + ' has been verified through ' + merchantData.pr.ca + '.';
            }
            message += ' Message from server: ' + merchantData.ack.memo;
            message += ' For merchant: ' + merchantData.pr.pd.payment_url;
          }
          notification.success('Success!', message);
          $scope.loadTxs();
        } else {
          w.sendTx(ntxid, function(txid, merchantData) {
            if (txid) {
              var message = 'Transaction id: ' + txid;
              if (merchantData) {
                if (merchantData.pr.ca) {
                  message += ' This payment protocol transaction' + ' has been verified through ' + merchantData.pr.ca + '.';
                }
                message += ' Message from server: ' + merchantData.ack.memo;
                message += ' For merchant: ' + merchantData.pr.pd.payment_url;
              }
              notification.success('Transaction broadcast', message);
            } else {
              notification.error('Error', 'There was an error sending the transaction.');
            }
            $scope.loading = false;
            $scope.loadTxs();
          });
        }
        $rootScope.pendingPayment = null;
      }

      var uri;
      if (address.indexOf('bitcoin:') === 0) {
        uri = new bitcore.BIP21(address).data;
      } else if (/^https?:\/\//.test(address)) {
        uri = {
          merchant: address
        };
      }

      if (uri && uri.merchant) {
        w.createPaymentTx({
          uri: uri.merchant,
          memo: commentText
        }, done);
      } else {
        w.createTx(address, amount, commentText, done);
      }

      // reset fields
      $scope.address = $scope.amount = $scope.commentText = null;
      form.address.$pristine = form.amount.$pristine = true;
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

      var str = (data.indexOf('bitcoin:') === 0) ? data.substring(8) : data;
      $scope.$apply(function() {
        $scope.address = str;
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

          var bip21 = new bitcore.BIP21(result.text);
          $scope.address = bip21.address + '';
          $scope.commentText = bip21.data.message;

          if (bip21.data.amount) {
            $scope.amount = bip21.data.amount * bitcore.util.COIN * satToUnit;
          }

          $rootScope.$digest();
        },
        function onError(error) {
          alert('Scanning error');
        });
    }

    $scope.toggleAddressBookEntry = function(key) {
      var w = $rootScope.wallet;
      w.toggleAddressBookEntry(key);
    };

    $scope.copyAddress = function(address) {
      $scope.address = address;
      $anchorScroll();
    };

    $scope.openAddressBookModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'views/modals/address-book.html',
        windowClass: 'tiny',
        controller: function($scope, $modalInstance) {

          $scope.submitAddressBook = function(form) {
            if (form.$invalid) {
              notification.error('Form Error', 'Please complete required fields');
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
        var w = $rootScope.wallet;

        $timeout(function() {
          $scope.loading = false;
          var errorMsg;
          try {
            w.setAddressBook(entry.address, entry.label);
          } catch (e) {
            errorMsg = e.message;
          }

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

    $scope.getAvailableAmount = function() {
      return ((($rootScope.availableBalance * config.unitToSatoshi).toFixed(0) - bitcore.TransactionBuilder.FEE_PER_1000B_SAT) / config.unitToSatoshi);
    };

    $scope.topAmount = function(form) {
      $scope.amount = $scope.getAvailableAmount();
      form.amount.$pristine = false;
    };


    $scope.send = function(ntxid, cb) {
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.sendTx(ntxid, function(txid, merchantData) {
        if (!txid) {
          notification.error('Error', 'There was an error sending the transaction');
        } else {
          if (!merchantData) {
            notification.success('Transaction broadcast', 'Transaction id: ' + txid);
          } else {
            var message = 'Transaction ID: ' + txid;
            if (merchantData.pr.ca) {
              message += ' This payment protocol transaction' + ' has been verified through ' + merchantData.pr.ca + '.';
            }
            message += ' Message from server: ' + merchantData.ack.memo;
            message += ' For merchant: ' + merchantData.pr.pd.payment_url;
            notification.success('Transaction sent', message);
          }
        }

        if (cb) return cb();
        else $scope.loadTxs();
      });
    };

    $scope.sign = function(ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      w.sign(ntxid, function(ret) {
        if (!ret) {
          notification.error('Error', 'There was an error signing the transaction');
          $scope.loadTxs();
        } else {
          var p = w.txProposals.getTxProposal(ntxid);
          if (p.builder.isFullySigned()) {
            $scope.send(ntxid, function() {
              $scope.loadTxs();
            });
          } else
            $scope.loadTxs();
        }
      });
    };

    $scope.reject = function(ntxid) {
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.reject(ntxid);
      notification.warning('Transaction rejected', 'You rejected the transaction successfully');
      $scope.loading = false;
      $scope.loadTxs();
    };


    $scope.onChanged = function() {
      var scope = $scope;
      var value = scope.address || '';
      var uri;

      if (value.indexOf('bitcoin:') === 0) {
        uri = new bitcore.BIP21(value).data;
      } else if (/^https?:\/\//.test(value)) {
        uri = {
          merchant: value
        };
      }

      if (!uri || !uri.merchant) {
        return;
      }

      notification.info('Fetching Payment',
        'Retrieving Payment Request from ' + uri.merchant);

      // Payment Protocol URI (BIP-72)
      scope.wallet.fetchPaymentTx(uri.merchant, function(err, merchantData) {
        var balance = $rootScope.availableBalance;
        var available = +(balance * config.unitToSatoshi).toFixed(0);

        if (merchantData && available < +merchantData.total) {
          err = new Error('No unspent outputs available.');
          err.amount = merchantData.total;
        }

        if (err) {
          scope.sendForm.address.$isValid = false;

          if (err.amount) {
            scope.sendForm.amount.$setViewValue(+err.amount / config.unitToSatoshi);
            scope.sendForm.amount.$render();
            scope.sendForm.amount.$isValid = false;
            scope.notEnoughAmount = true;
            $rootScope.merchantError = true;
            var lastAddr = scope.sendForm.address.$viewValue;
            var unregister = scope.$watch('address', function() {
              if (scope.sendForm.address.$viewValue !== lastAddr) {
                delete $rootScope.merchantError;
                scope.sendForm.amount.$setViewValue('');
                scope.sendForm.amount.$render();
                unregister();
                if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest') {
                  $rootScope.$apply();
                }
              }
            });
          }

          notification.error('Error', err.message || 'Bad payment server.');

          if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest') {
            $rootScope.$apply();
          }
          return;
        }

        merchantData.unitTotal = (+merchantData.total / config.unitToSatoshi) + '';
        merchantData.expiration = new Date(
          merchantData.pr.pd.expires * 1000).toISOString();

        $rootScope.merchant = merchantData;

        scope.sendForm.address.$isValid = true;

        scope.sendForm.amount.$setViewValue(merchantData.unitTotal);
        scope.sendForm.amount.$render();
        scope.sendForm.amount.$isValid = true;

        // If the address changes to a non-payment-protocol one,
        // delete the `merchant` property from the scope.
        var unregister = scope.$watch('address', function() {
          var val = scope.sendForm.address.$viewValue || '';
          var uri;
          if (val.indexOf('bitcoin:') === 0) {
            uri = new bitcore.BIP21(val).data;
          } else if (/^https?:\/\//.test(val)) {
            uri = {
              merchant: val
            };
          }
          if (!uri || !uri.merchant) {
            delete $rootScope.merchant;
            scope.sendForm.amount.$setViewValue('');
            scope.sendForm.amount.$render();
            unregister();
            if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest') {
              $rootScope.$apply();
            }
          }
        });

        if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest') {
          $rootScope.$apply();
        }

        notification.info('Payment Request',
          'Server is requesting ' + merchantData.unitTotal + ' ' + config.unitName + '.' + ' Message: ' + merchantData.pr.pd.memo);
      });
    };

  });
