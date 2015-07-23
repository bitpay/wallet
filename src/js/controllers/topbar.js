'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($rootScope, $scope, $timeout, $modal, isCordova, isMobile, go) {   

  this.goHome = function() {
    go.walletHome();
  };

});
