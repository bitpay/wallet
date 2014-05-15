'use strict';

angular.module('copay.footer').controller('FooterController', function($scope, $http) {

    if (config.themes && Array.isArray(config.themes) && config.themes[0]) {
      $scope.themes = config.themes;
    }
    else {
      $scope.themes = ['default'];
    }

    $scope.theme = 'css/tpl-' + $scope.themes[0] + '.css';

    $scope.change_theme = function(name) {
      $scope.theme = 'css/tpl-' + name + '.css';
    };
    $scope.version = copay.version;
  });
