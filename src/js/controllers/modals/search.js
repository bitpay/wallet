'use strict';

angular.module('copayApp.controllers').controller('searchController', function($scope) {
  var self = $scope.self;
  $scope.search = '';

  $scope.cancel = function() {
    $scope.searchModal.hide();
  };
});
