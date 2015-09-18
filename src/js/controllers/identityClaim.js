'use strict';

angular.module('copayApp.controllers').controller('identityClaimController', 
  function($scope, $rootScope, gettextCatalog, storageService) {
    var self = this;

    delete self.identityError;
    self.id = $rootScope.identityId;
    self.claim = $rootScope.identityClaim;

    self.updateClaim = function() {
      delete self.identityError;
      var form = $scope.claimForm;
      if (form && form.claimValue) {
        var newValue = form.claimValue.$modelValue;
        if (newValue != self.claim.value) {
          if (self.claim.isID) {
            return self.renameIdentity(newValue);
          }
          storageService.getIdentity(self.id, function(err, identity) {
            if (err) {
              self.identityError = err;
            } else if (identity) {
              self.claim.updateClaim(identity, newValue);
              storageService.setIdentity(self.id, identity, function(err) {
                if (err) {
                  self.identityError = err;
                } else {
                  self.claim.value = newValue;
                  $rootScope.$root.go('identity');
                }
              });
            }
          });
        }
      }
    };

    self.removeClaim = function() {
      delete self.identityError;
      if (self.claim.required) {
        self.identityError = gettextCatalog('Cannot remove');
      } else {
        storageService.getIdentity(self.id, function(err, identity) {
          if (err) {
            self.identityError = err;
          } else if (identity) {
            self.claim.removeClaim(identity);
            storageService.setIdentity(self.id, identity, function(err) {
              if (err) {
                self.identityError = err;
              } else {
                delete self.claim;
                $rootScope.$root.go('identity');
              }
            });
          }
        });
      }
    };

    self.renameIdentity = function(newID) {
      delete self.identityError;
      if (!self.claim.isID) {
        self.identityError = gettextCatalog('Unexpected error')
      } else {
        storageService.getIdentity(self.id, function(err, identity) {
          if (err) {
            self.identityError = err;
          } else if (identity) {
            self.claim.updateClaim(identity, newID);
            storageService.setIdentity(newID, identity, function(err) {
              if (err) {
                self.identityError = err;
              } else {
                storageService.removeIdentity(self.id, function(err) {
                  if (err) {
                    self.identityError = err;
                  } else {
                    self.id = newID;
                    self.claim.value = newID;
                    $rootScope.$root.go('identity');
                  }
                });
              }
            });
          }
        });
      }
    };
  });
