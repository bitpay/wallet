'use strict';

angular.module('copay.directives')
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
              $rootScope.flashMessage = {};
            });
          }, 5000);
        }
      };
    }
  ])
  .directive('enoughAmount', ['$rootScope',
    function($rootScope) {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            var vStr = new String(value);
            var vNum = Number(vStr);
            if (typeof vNum == "number" && vNum > 0) {
              if ($rootScope.availableBalance <= vNum) {
                ctrl.$setValidity('enoughAmount', false);
                scope.notEnoughAmount = 'Insufficient funds!';
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
  }).directive('avatar', function($rootScope, controllerUtils) {
    return {
      link: function(scope, element, attrs) {
        var peer = JSON.parse(attrs.peer)
        var peerId = peer.peerId;
        var nick = peer.nick;
        element.addClass('video-small');
        var muted = controllerUtils.getVideoMutedStatus(peerId);
        if (muted) {
          element.attr("muted", true);
        }
      }
    }
  });
