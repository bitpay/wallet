'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('SendController',
  function($scope, $rootScope, $window, $location, $timeout, $anchorScroll, $modal, isMobile) {
    $scope.title = 'Send';
    $scope.loading = false;
    var satToUnit = 1 / config.unitToSatoshi;
    $scope.defaultFee = bitcore.TransactionBuilder.FEE_PER_1000B_SAT * satToUnit;
    $scope.unitToBtc = config.unitToSatoshi / bitcore.util.COIN;

    $scope.showAddressBook = function() {
      var w = $rootScope.wallet;
      var flag;
      if (w) {
        for (var k in w.addressBook) {
          if (w.addressBook[k].copayerId != -1) {
            flag = true;
            break;
          }
        }
      }
      return flag;
    };

    // Detect protocol
    $scope.isHttp = ($window.location.protocol.indexOf('http') === 0);

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    $scope.isMobile = isMobile.any();

    $scope.submitForm = function(form) {
      if (form.$invalid) {
        $rootScope.$flashMessage = {
          message: 'Unable to send a transaction proposal. Please, try again',
          type: 'error'
        };
        return;
      }

      $scope.loading = true;

      var address = form.address.$modelValue;
      var amount = (form.amount.$modelValue * config.unitToSatoshi) | 0;
      var commentText = form.comment.$modelValue;

      var w = $rootScope.wallet;

      w.createTx(address, amount, commentText, function(ntxid) {
        if (w.totalCopayers > 1) {
          $scope.loading = false;
          $rootScope.$flashMessage = {
            message: 'The transaction proposal has been created',
            type: 'success'
          };
          $rootScope.$digest();
        } else {
          w.sendTx(ntxid, function(txid) {
            $rootScope.$flashMessage = txid ? {
              type: 'success',
              message: 'Transaction broadcasted. txid: ' + txid
            } : {
              type: 'error',
              message: 'There was an error sending the Transaction'
            };
            $scope.loading = false;
            $scope.update();
          });
        }
      });

      // reset fields
      $scope.address = $scope.amount = $scope.comment = null;
      form.address.$pristine = form.amount.$pristine = form.comment.$pristine = true;
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

    $scope.deleteAddressBook = function(addressBook) {
      var w = $rootScope.wallet;
      $timeout(function() {
        var errorMsg;
        try {
          w.deleteAddressBook(addressBook);
        } catch (e) {
          errorMsg = e.message;
        }

        $rootScope.$flashMessage = {
          message: errorMsg ? errorMsg : 'Entry removed successful',
          type: errorMsg ? 'error' : 'success'
        };
        $rootScope.$digest();
      }, 500);
    };

    $scope.copyAddress = function(address) {
      $scope.address = address;
      $anchorScroll();
    };

    $scope.openAddressBookModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'addressBookModal.html',
        windowClass: 'tiny',
        controller: function($scope, $modalInstance) {

          $scope.submitAddressBook = function(form) {
            if (form.$invalid) {
              $rootScope.$flashMessage = {
                message: 'Complete required fields, please',
                type: 'error'
              };
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

          $rootScope.$flashMessage = {
            message: errorMsg ? errorMsg : 'New entry has been created',
            type: errorMsg ? 'error' : 'success'
          };
          $rootScope.$digest();
        }, 500);
        $anchorScroll();
        // reset fields
        $scope.newaddress = $scope.newlabel = null;
      });
    };

    $scope.topAmount = function() {
      var maxSat = ($rootScope.availableBalance * config.unitToSatoshi).toFixed(0) - bitcore.TransactionBuilder.FEE_PER_1000B_SAT;
      $scope.amount = maxSat / config.unitToSatoshi;
    };
  });
