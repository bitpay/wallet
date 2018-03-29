'use strict';

angular.module('copayApp.controllers').controller('preferencesNavTechController',
  function($scope, $log, $timeout, $ionicHistory, navTechService ) {

    $scope.navTechServers = [];
    $scope.navTechAddress = '';
    $scope.navTechAddError = false;

    $scope.saveNavTechAddress = function(address) {
      navTechService.addNode(address, function(error, servers) {
        if (error) {
          $scope.navTechAddError = true;
          return $log.error(error);
        }
        $scope.navTechServers = servers;
        $scope.navTechAddError = false;
      })
    }

    $scope.removeNavTechAddress = function(address) {
      navTechService.removeNode(address, function(error, servers) {
        if (error) {
          return $log.error(error);
        }
        $scope.navTechServers = servers;
      })
    }

    $scope.$on("$ionicView.enter", function(event, data) {
      navTechService.getNavTechServers(function(err, servers) {
        if (servers && servers.length > 0) {
          $scope.navTechServers = servers;
        }
      })
    });
  });
