angular.module('copayApp.controllers').controller('signOutController', function(identityService) {

  identityService.signout();

});
