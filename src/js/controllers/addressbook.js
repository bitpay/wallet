'use strict';

angular.module('copayApp.controllers').controller('addressbookListController', function($scope, $log, $timeout, bitcore, addressbookService, lodash, popupService, gettextCatalog, platformInfo) {

    var contacts;

    var initAddressbook = function() {
        addressbookService.list(function(err, ab) {
            console.log("addressbookService", ab);
            if (err) $log.error(err);

            $scope.isEmptyList = lodash.isEmpty(ab);

            if (!$scope.isEmptyList) $scope.showAddIcon = true;
            else $scope.showAddIcon = false;

            contacts = [];
            lodash.each(ab, function(v, k) {
                if (!v.coin || !v.network) {
                    var addr = new bitcore.Address(k);
                    v.coin = addr.network.coin;
                    v.network = addr.network.name;
                }

                contacts.push({
                    name: lodash.isObject(v) ? v.name : v,
                    address: k,
                    coin: v.coin,
                    network: v.network,
                    email: lodash.isObject(v) ? v.email : null
                });
            });

            $scope.addressbook = lodash.clone(contacts);
            $timeout(function() {
                $scope.$apply();
            });
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

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
        $scope.isChromeApp = platformInfo.isChromeApp;
        $scope.showAddIcon = false;
        $scope.addrSearch = { value: null };
        initAddressbook();
    });

});