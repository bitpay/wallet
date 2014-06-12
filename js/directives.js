'use strict';

angular.module('copayApp.directives')
  .directive('validAddress', [

    function() {

      var bitcore = require('bitcore');
      var Address = bitcore.Address;

      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var validator = function(value) {
            var a = new Address(value);
            ctrl.$setValidity('validAddress', a.isValid());
            return value;
          };

          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('notification', ['$rootScope', 
    function($rootScope) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs, ctrl) {
          setTimeout(function() {
            scope.$apply(function() {
              $rootScope.$flashMessage = {};
            });
          }, 5000);
        }
      };
    }
  ])
  .directive('enoughAmount', ['$rootScope',
    function($rootScope) {
      var bitcore = require('bitcore');
      var feeSat = bitcore.TransactionBuilder.FEE_PER_1000B_SAT;
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            var availableBalanceNum = ($rootScope.availableBalance * bitcore.util.COIN).toFixed(0);
            var vNum = Number((value * bitcore.util.COIN).toFixed(0)) + feeSat;
            if (typeof vNum == "number" && vNum > 0) {
              if (availableBalanceNum < vNum) {
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
            ctrl.$setValidity('walletSecret',  Boolean(walletFactory.decodeSecret(value)));
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
  .directive('avatar', function($rootScope, controllerUtils) {
    return {
      link: function(scope, element, attrs) {
        var peer = JSON.parse(attrs.peer)
        var peerId = peer.peerId;
        var nick = peer.nick;
        element.addClass('video-small');
        var muted = controllerUtils.getVideoMutedStatus(peerId);
        if (true || muted) { // mute everyone for now
          element.attr("muted", true);
        }
      }
    }
  })
  .directive('checkStrength', function() {
    return {
      replace: false,
      restrict: 'EACM',
      require: 'ngModel',
      link: function(scope, element, attrs) {
        var _grep = function(elems, callback, invert) {
          var callbackInverse,
              matches = [],
              i = 0,
              length = elems.length,
              callbackExpect = !invert;

          // Go through the array, only saving the items
          // that pass the validator function
          for (; i < length; i++) {
            callbackInverse = !callback(elems[i], i);
            if (callbackInverse !== callbackExpect) {
              matches.push(elems[i]);
            }
          }

          return matches;
        };

        var strength = {
          messages: ['too weak', 'weak', 'weak', 'medium', 'strong'],
          colors: ['#c0392b', '#e74c3c', '#d35400', '#f39c12', '#27ae60'],
          mesureStrength: function (p) {
            var _force = 0;
            var _regex = /[$-/:-?{-~!"^_`\[\]]/g;
            var _lowerLetters = /[a-z]+/.test(p);
            var _upperLetters = /[A-Z]+/.test(p);
            var _numbers = /[0-9]+/.test(p);
            var _symbols = _regex.test(p);
            var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];
            var _passedMatches = _grep(_flags, function (el) { return el === true; }).length;
            
            _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
            _force += _passedMatches * 10;
            
            // penality (short password)
            _force = (p.length <= 6) ? Math.min(_force, 10) : _force;
            
            // penality (poor variety of characters)
            _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
            _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
            _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;
            return _force;
          },
          getColor: function (s) {
            var idx = 0;
            
            if (s <= 10) { idx = 0; }
            else if (s <= 20) { idx = 1; }
            else if (s <= 30) { idx = 2; }
            else if (s <= 40) { idx = 3; }
            else { idx = 4; }
            
            return { idx: idx + 1, col: this.colors[idx], message: this.messages[idx] };
          }
        };

        scope.$watch(attrs.ngModel, function (newValue, oldValue) {
          if (newValue && newValue !== '') {
            var c = strength.getColor(strength.mesureStrength(newValue));
            element.css({ 'border-color': c.col });
            scope[attrs.checkStrength] = c.message;
          }
        });
      }
    };
  });
