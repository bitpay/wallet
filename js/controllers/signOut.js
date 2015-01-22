angular.module('copayApp.controllers').controller('signOutController', function(identityService) {

  console.log('En el controller del sign out');

  identityService.signout();

});
