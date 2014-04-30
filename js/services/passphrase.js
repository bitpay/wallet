'use strict';

var passphrase;
angular.module('copay.passphrase').factory('Passphrase', function($rootScope) {
  passphrase = passphrase || new copay.Passphrase(config);
  return passphrase;
});
