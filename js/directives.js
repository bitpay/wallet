'use strict';

var bitcore = require('bitcore');
var Address = bitcore.Address;
var bignum = bitcore.Bignum;
var preconditions = require('preconditions').singleton();

angular.module('copayApp.directives')

.directive('validAddress', ['$rootScope',
  function($rootScope) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var validator = function(value) {

          // If we're setting the domain, ignore the change.
          if ($rootScope.merchant && $rootScope.merchant.domain && value === $rootScope.merchant.domain) {
            ctrl.$setValidity('validAddress', true);
            return value;
          }

          // Regular url
          if (/^https?:\/\//.test(value)) {
            ctrl.$setValidity('validAddress', true);
            return value;
          }


          // Bip21 uri
          if (/^bitcoin:/.test(value)) {
            var uri = new bitcore.BIP21(value);
            var hasAddress = uri.address && uri.isValid() && uri.address.network().name === $rootScope.wallet.getNetworkName();
            ctrl.$setValidity('validAddress', uri.data.merchant || hasAddress);
            return value;
          }

          // Regular Address
          var a = new Address(value);
          ctrl.$setValidity('validAddress', a.isValid() && a.network().name === $rootScope.wallet.getNetworkName());
          return value;
        };


        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);
      }
    };
  }
])
  .directive('enoughAmount', ['$rootScope',
    function($rootScope) {
      var w = $rootScope.wallet;
      preconditions.checkState(w);
      preconditions.checkState(w.settings.unitToSatoshi);

      var feeSat = Number(bitcore.TransactionBuilder.FEE_PER_1000B_SAT);
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            var availableBalanceNum = Number(($rootScope.availableBalance * w.settings.unitToSatoshi).toFixed(0));
            var vNum = Number((value * w.settings.unitToSatoshi).toFixed(0));

            if (typeof vNum == "number" && vNum > 0) {
              vNum = vNum + feeSat;
              if (availableBalanceNum < vNum || isNaN(availableBalanceNum)) {
                ctrl.$setValidity('enoughAmount', false);
                scope.notEnoughAmount = true;
              } else {
                ctrl.$setValidity('enoughAmount', true);
                scope.notEnoughAmount = null;
              }
            } else {
              scope.notEnoughAmount = null;
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('walletSecret', ['walletFactory',
    function(walletFactory) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var validator = function(value) {
            ctrl.$setValidity('walletSecret', Boolean(walletFactory.decodeSecret(value)));
            return value;
          };

          ctrl.$parsers.unshift(validator);
        }
      };
    }
  ])
  .directive('loading', function() {
    return {
      restrict: 'A',
      link: function($scope, element, attr) {
        var a = element.html();
        var text = attr.loading;
        element.on('click', function() {
          element.html('<i class="size-21 fi-bitcoin-circle icon-rotate spinner"></i> ' + text + '...');
        });
        $scope.$watch('loading', function(val) {
          if (!val) {
            element.html(a);
          }
        });
      }
    }
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        if (!scope.wallet) return;

        var address = attrs.address;
        var contact = scope.wallet.addressBook[address];
        if (contact && !contact.hidden) {
          element.append(contact.label);
          attrs['tooltip'] = attrs.address;
        } else {
          element.append(address);
        }
      }
    };
  })
  .directive('highlightOnChange', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.$watch(attrs.highlightOnChange, function(newValue, oldValue) {
          element.addClass('highlight');
          setTimeout(function() {
            element.removeClass('highlight');
          }, 500);
        });
      }
    }
  })
  .directive('checkStrength', function() {
    return {
      replace: false,
      restrict: 'EACM',
      require: 'ngModel',
      link: function(scope, element, attrs) {

        var MIN_LENGTH = 8;
        var MESSAGES = ['Very Weak', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        var COLOR = ['#dd514c', '#dd514c', '#faa732', '#faa732', '#5eb95e', '#5eb95e'];

        function evaluateMeter(password) {
          var passwordStrength = 0;
          var text;
          if (password.length > 0) passwordStrength = 1;
          if (password.length >= MIN_LENGTH) {
            if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/))) {
              passwordStrength++;
            } else {
              text = ', add mixed case';
            }
            if (password.match(/\d+/)) {
              passwordStrength++;
            } else {
              if (!text) text = ', add numerals';
            }
            if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) {
              passwordStrength++;
            } else {
              if (!text) text = ', add punctuation';
            }
            if (password.length > 12) {
              passwordStrength++;
            } else {
              if (!text) text = ', add characters';
            }
          } else {
            text = ', that\'s short';
          }
          if (!text) text = '';

          return {
            strength: passwordStrength,
            message: MESSAGES[passwordStrength] + text,
            color: COLOR[passwordStrength]
          }
        }

        scope.$watch(attrs.ngModel, function(newValue, oldValue) {
          if (newValue && newValue !== '') {
            var info = evaluateMeter(newValue);
            element.css({
              'border-color': info.color
            });
            scope[attrs.checkStrength] = info.message;
          }
        });
      }
    };
  })
  .directive('openExternal', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          window.open('bitcoin:' + attrs.address, '_blank');
        });
      }
    }
  })
// From https://gist.github.com/asafge/7430497
.directive('ngReallyClick', [

  function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          var message = attrs.ngReallyMessage;
          if (message && confirm(message)) {
            scope.$apply(attrs.ngReallyClick);
          }
        });
      }
    }
  }
])
  .directive('match', function() {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        match: '='
      },
      link: function(scope, elem, attrs, ctrl) {
        scope.$watch(function() {
          return (ctrl.$pristine && angular.isUndefined(ctrl.$modelValue)) || scope.match === ctrl.$modelValue;
        }, function(currentValue) {
          ctrl.$setValidity('match', currentValue);
        });
      }
    };
  })
  .directive('clipCopy', function() {
    ZeroClipboard.config({
      moviePath: './lib/zeroclipboard/ZeroClipboard.swf',
      trustedDomains: ['*'],
      allowScriptAccess: 'always',
      forceHandCursor: true
    });

    return {
      restric: 'A',
      scope: {
        clipCopy: '=clipCopy'
      },
      link: function(scope, elm) {
        var client = new ZeroClipboard(elm);

        client.on('load', function(client) {

          client.on('datarequested', function(client) {
            client.setText(scope.clipCopy);
          });

          client.on('complete', function(client, args) {
            elm.removeClass('btn-copy').addClass('btn-copied').html('Copied!');
            setTimeout(function() {
              elm.addClass('btn-copy').removeClass('btn-copied').html('');
            }, 1000);
          });
        });
        client.on('wrongflash noflash', function() {
          elm.removeClass('btn-copy').html('');
          ZeroClipboard.destroy();
        });

      }
    };
  });
