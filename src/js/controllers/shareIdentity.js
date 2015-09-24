'use strict';

angular.module('copayApp.controllers').controller('shareIdentityController',
  function($scope, $rootScope, $modal, storageService, gettext, lodash) {

  var self = this;
  delete self.error;

  self.setForm = function(data) {
    var form = $scope.shareForm || self.form;
    if (data.fields) {
      form.fields.$setViewValue(data.fields);
      form.fields.$isValid = true;
      form.fields.$render();
    }
    if (data.identityID) {
      form.identityID.$setViewValue(data.identityID);
      form.identityID.$isValid = true;
      form.identityID.$render();
    }
    if (data.url) {
      form.url.$setViewValue(data.url);
      form.url.$isValid = true;
      form.url.$render();
    }
  };

  self.openIdentitiesModal = function(identities) {
    var animatedSlideUp = 'full animated slideInUp';

    var ModalInstanceCtrl = function($scope, $modalInstance) {
      storageService.getIdentityIDs(function(err, identityIDs) {
        if (err) {
          self.error = err;
        } else {
          $scope.identityIDs = identityIDs;
        }
      });

      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };

      $scope.selectIdentity = function(identityID) {
        $modalInstance.close(identityID);
      };
    };

    var modalInstance = $modal.open({
      templateUrl: 'views/modals/identities.html',
      windowClass: animatedSlideUp,
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.finally(function() {
      var m = angular.element(document.getElementsByClassName('reveal-modal'));
      m.addClass('slideOutDown');
    });

    modalInstance.result.then(function(identityID) {
      if (identityID) {
        self.setForm( { identityID: identityID });
      }
    });
  };

  self.onQrCodeScanned = function(data) {
    self.parseQrCodeData(data, function(err, request) {
      if (err) {
        self.error = gettext(err);
      } else {
        self.setForm(request);
      }
    });
  };

  self.parseQrCodeData = function(data, callback) {
    var prefix = 'identity:';
    var requestRegex = /^identity:[1][01][A-Z]{0,26}$/;
    if (!requestRegex.test(data)) {
      callback('Invalid QR Code data');
    } else {
      var request = data.substr(prefix.length);
      var format = request[0];
      var trusted = request[1];
      var codes = lodash.uniq(request.substr(2));
      var fields = lodash.map(codes, Identity.getFieldByCode);
      callback(null, { fields: fields });
    }
  };

  self.openScanScreen = function() {
  };

  self.share = function(form) {
  };
});
