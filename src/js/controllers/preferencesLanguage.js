'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $timeout, go) {

    this.save = function(newLang) {
      $scope.$emit('Local/DefaultLanguage', newLang);
      $timeout(function() {
        go.preferences();
      }, 100);
    };
  });
