'use strict';
angular.module('copayApp.directives')
  .directive('validAddress', ['$rootScope', 'bitcore',
    function($rootScope, bitcore) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var URI = bitcore.URI;
          var Address = bitcore.Address
          var validator = function(value) {

            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            // Bip21 uri
            if (/^bitcoin:/.test(value)) {
              var uri, isAddressValidLivenet, isAddressValidTestnet;
              var isUriValid = URI.isValid(value);
              if (isUriValid) {
                uri = new URI(value);
                // Must be valid on the btc blockchain.
                isAddressValidLivenet = Address.isValid(uri.address.toString(), 'livenet/btc')
                isAddressValidTestnet = Address.isValid(uri.address.toString(), 'testnet/btc')
              }
              ctrl.$setValidity('validAddress', isUriValid && (isAddressValidLivenet || isAddressValidTestnet));
              return value;
            }

            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Regular Address
            // Detecting which blockchain is not important here.
            // Is a valid address if it's valid on any blockchain we support.
            var regularAddressLivenet = Address.isValid(value, 'livenet');
            var regularAddressTestnet = Address.isValid(value, 'testnet');
            ctrl.$setValidity('validAddress', (regularAddressLivenet || regularAddressTestnet));
            return value;
          };


          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validAmount', ['configService',
    function(configService, networkHelper) {

      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            // Support only livenet/btc
            var atomicUnit = networkHelper.getAtomicUnit('livenet/btc');
            var configNetwork = configService.getSync().currencyNetworks['livenet/btc'];
            var vNum = Number((value * configNetwork.unitToAtomicUnit).toFixed(atomicUnit.decimals));
            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
            }



            if (typeof vNum == "number" && vNum > 0) {
              if (vNum > Number.MAX_SAFE_INTEGER) {
                ctrl.$setValidity('validAmount', false);
              } else {
                var decimals = Number(configNetwork.unitDecimals);
                var sep_index = ('' + value).indexOf('.');
                var str_value = ('' + value).substring(sep_index + 1);
                if (sep_index >= 0 && str_value.length > decimals) {
                  ctrl.$setValidity('validAmount', false);
                  return;
                } else {
                  ctrl.$setValidity('validAmount', true);
                }
              }
            } else {
              ctrl.$setValidity('validAmount', false);
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('walletSecret', function(bitcore) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var validator = function(value) {
          if (value.length > 0) {
            var m = value.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/);
            ctrl.$setValidity('walletSecret', m ? true : false);
          }
          return value;
        };

        ctrl.$parsers.unshift(validator);
      }
    };
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.formData.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', ['addressbookService', 'lodash',
    function(addressbookService, lodash) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var addr = attrs.address;
          addressbookService.get(addr, function(err, ab) {
            if (ab) {
              var name = lodash.isObject(ab) ? ab.name : ab;
              element.append(name);
            } else {
              element.append(addr);
            }
          });
        }
      };
    }
  ])
  .directive('ignoreMouseWheel', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('mousewheel', function(event) {
          element[0].blur();
          $timeout(function() {
            element[0].focus();
          }, 1);
        });
      }
    }
  });
