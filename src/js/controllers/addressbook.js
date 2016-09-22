'use strict';

angular.module('copayApp.controllers').controller('addressbookListController', function($scope, $log, $timeout, addressbookService, lodash, popupService) {

  var contacts;

  var initAddressbook = function() {
    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.isEmptyList = lodash.isEmpty(ab);

      contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null
        });
      });

      $scope.addressbook = lodash.clone(contacts);
    });
  };

  $scope.findAddressbook = function(search) {
    if (!search || search.length < 2) {
      $scope.addressbook = contacts;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter(contacts, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.addressbook = result;
  };

  $scope.remove = function(addr) {
    $timeout(function() {
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        initAddressbook();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.$on("$ionicView.enter", function(event, data){
    initAddressbook();
  });

});
