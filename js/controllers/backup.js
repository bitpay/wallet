'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, $location, $window, $timeout, $modal) {
    $scope.title = 'Backup';

    var _getEncryptedWallet = function() {
      var wallet = $rootScope.wallet.toEncryptedObj();
      return wallet;
    };

    $scope.download = function() {
      var timestamp = +(new Date);
      var walletName = ($rootScope.wallet.name ? $rootScope.wallet.name : '') + '-' + $rootScope.wallet.id ;
      var filename = walletName + '-' + timestamp + '.json.aes';
      var wallet = _getEncryptedWallet();
      var blob = new Blob([wallet], {type: 'text/plain;charset=utf-8'});
      // show a native save dialog if we are in the shell
      // and pass the wallet to the shell to convert to node Buffer
      if (window.cshell) {
        return window.cshell.send('backup:download', {
          name: walletName,
          wallet: wallet
        });
      }
      // otherwise lean on the browser implementation
      saveAs(blob, filename);
    };

  $scope.openModal = function () {
    var modalInstance = $modal.open({
      templateUrl: 'backupModal.html',
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.then(sendEmail);
  };

  var sendEmail = function(email) {
    var body = _getEncryptedWallet();
    var subject = ($rootScope.wallet.name ? $rootScope.wallet.name + ' - ' : '') + $rootScope.wallet.id;
    var href = 'mailto:' + email + '?'
     + 'subject=[Copay Backup] ' + subject + '&'
     + 'body=' + body;

    if (window.cshell) {
      return window.cshell.send('backup:email', href);
    }

    var newWin = $window.open(href, '_blank', 'scrollbars=yes,resizable=yes,width=10,height=10');

    if (newWin) {
      $timeout(function() {
        newWin.close();
      }, 1000);
    }
  };
});

var ModalInstanceCtrl = function ($scope, $modalInstance) {

  $scope.submit = function (form) {
    $modalInstance.close($scope.email);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};
