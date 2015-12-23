'use strict';

angular.module('copayApp.controllers').controller('termOfUseController',
  function($scope, uxLanguage) {

    $scope.lang = uxLanguage.currentLanguage;

  });
