'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('SendController',
  function($scope, $rootScope, $window, $timeout, $anchorScroll, $modal, isMobile, notification, controllerUtils) {
    $scope.title = 'Send';
    $scope.loading = false;
    var satToUnit = 1 / config.unitToSatoshi;
    $scope.defaultFee = bitcore.TransactionBuilder.FEE_PER_1000B_SAT * satToUnit;
    $scope.unitToBtc = config.unitToSatoshi / bitcore.util.COIN;

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
      $scope.address = pp.address;
      var amount = pp.amount / config.unitToSatoshi * 100000000;
      $scope.amount = amount;
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

      function done(ntxid, ca) {
        var txp = w.txProposals.txps[ntxid];
        var merchantData = txp.merchant;
        if (w.isShared()) {
          $scope.loading = false;
          var message = 'The transaction proposal has been created';
          if (ca) {
            message += '.\nThis payment protocol transaction'
              + 'has been verified through ' + ca + '.';
          }
          notification.success('Success!', message);
          $scope.loadTxs();
        } else {
          w.sendTx(ntxid, function(txid, ca) {
            if (txid) {
              notification.success('Transaction broadcast', 'Transaction id: ' + txid);
              if (ca) {
                notification.success('Root Certificate', ca);
              }
            } else {
              notification.error('Error', 'There was an error sending the transaction.');
            }
            $scope.loading = false;
            $scope.loadTxs();
          });
        }
        $rootScope.pendingPayment = null;
      }

      var uri = address.indexOf('bitcoin:') === 0
        && copay.HDPath.parseBitcoinURI(address);

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
                  //alert(JSON.stringify(qrcode.process(context)));
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

          debugger;
          var bip21 = copay.HDPath.parseBitcoinURI(result.text);
          $scope.address = bip21.address;

          if (bip21.amount) {
            $scope.amount = bip21.amount * bitcore.util.COIN * satToUnit;
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
      w.sendTx(ntxid, function(txid) {
        if (!txid) {
          notification.error('Error', 'There was an error sending the transaction');
        } else {
          notification.success('Transaction broadcast', 'Transaction id: '+txid);
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

  });
