var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('paymentUriController', function($rootScope, $scope, $routeParams, $location, go) {

  // Build bitcoinURI with querystring
  var query = [];
  angular.forEach($location.search(), function(value, key) {
    query.push(key + "=" + value);
  });
  var queryString = query ? "?" + query.join("&") : "";
  var bitcoinURI = $routeParams.data + queryString;
  var uri = new bitcore.BIP21(bitcoinURI);

  if (uri.isValid()) {
    $rootScope.pendingPayment = bitcoinURI;
  }

  go.home();
});
