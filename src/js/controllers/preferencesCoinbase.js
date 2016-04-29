'use strict';

angular.module('copayApp.controllers').controller('preferencesCoinbaseController', 
  function($scope, $modal, $timeout, applicationService, coinbaseService, animationService) {

    this.revokeToken = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.ok = function() {
          $modalInstance.close(true);
        };
        $scope.cancel = function() {
          $modalInstance.dismiss();
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/coinbase-confirmation.html',
        windowClass: animationService.modalAnimated.slideRight,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          coinbaseService.logout(network, function() {
            $timeout(function() {
              applicationService.restart();
            }, 1000);
          });
        }
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });
    };

  });
