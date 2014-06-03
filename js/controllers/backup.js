'use strict';

angular.module('copay.backup').controller('BackupController',
  function($scope, $rootScope, $location, $window, $timeout) {
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

    $scope.email = function() {
      var email = prompt('Please enter your email addres.');
      var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

      if (email && email !== '') {
        if (!email.match(mailformat)) {
          alert('Enter a valid email address');
        } else {
          var body = _getEncryptedWallet();
          var subject = ($rootScope.wallet.name ? $rootScope.wallet.name + ' - ' : '') + $rootScope.wallet.id;
          var href = 'mailto:' + email + '?'
           + 'subject=[Copay Backup] ' + subject + '&'
           + 'body=' + body;

          var newWin = $window.open(href, '_blank', 'scrollbars=yes,resizable=yes,width=10,height=10');

          if (newWin) {
            $timeout(function() {
              newWin.close();
            }, 1000);
          }
        }
      }
    };

  });
