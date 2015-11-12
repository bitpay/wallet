'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope) {
    $scope.appShortName = window.appShortName;
  });
