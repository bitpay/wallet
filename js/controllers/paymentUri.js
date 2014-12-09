var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('paymentUriController', function($rootScope, $scope, $routeParams, $location, go) {

  // Build bitcoinURI with querystring
  var query = [];
  angular.forEach($location.search(), function(value, key) {
    query.push(key + "=" + value);
  });
  var queryString = query ? query.join("&") : null;
  var bitcoinURI = $routeParams.data + ( queryString ? '?' + queryString : '');
  var uri = new bitcore.BIP21(bitcoinURI);

  if (uri && uri.address && (_.isString(uri.address) || uri.address.isValid()) ) {
    copay.logger.debug('Payment Intent:', bitcoinURI);
    $rootScope.pendingPayment = bitcoinURI;
  }

  go.home();
});
