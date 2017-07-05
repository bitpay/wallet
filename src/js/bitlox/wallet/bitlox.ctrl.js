(function(window, angular) {
  'use strict';

  angular.module('app.core')
      .controller('BitLoxCtrl', BitLoxCtrl);

  BitLoxCtrl.$inject = ['$rootScope', '$timeout', '$scope', '$state', '$log', '$stateParams', 'gettextCatalog', '$ionicHistory', '$ionicLoading', 'popupService', 'bitloxHidChrome', 'bitloxHidWeb', 'bitloxBleApi', 'platformInfo'];

  function BitLoxCtrl($rootScope, $timeout, $scope, $state, $log, $stateParams, gettextCatalog, $ionicHistory, $ionicLoading, popupService,  hidchrome, hidweb, bleapi, platformInfo) {

    var api = hidweb;
    if (platformInfo.isChromeApp) {
      api = hidchrome
    }
    else if(platformInfo.isMobile) {
      api = bleapi
    }
    $scope.api = api;
    if(platformInfo.isMobile) {
      api.initializeBle();
    }
    



  }
})(window, window.angular);
