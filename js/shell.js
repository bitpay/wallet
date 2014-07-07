/*
 ** copay-shell integration
 */
(function() {
  /*
   ** This is a monkey patch for when Copay is running from
   ** within Copay-Shell (atom-shell). Since the renderer (the frontend)
   ** receives context from Node.js, we get a `module.exports` contruct
   ** available to us. Because of this, some libs (specifically Moment.js)
   ** attempt to assume their CommonJS form and bind to this. This causes
   ** there to be no references in the window to these libs, so let's trick
   ** the renderer into thinking that we are _not_ in a CommonJS environment.
   */
  if (typeof module !== 'undefined') module = {
    exports: false
  };

  // are we running in copay shell?
  if (window.process && process.type === 'renderer') {
    window.cshell = initCopayShellBindings();
  } else {
    return;
  }

  function controller(name) {
    return angular.element(
      document.querySelectorAll(
        '[ng-controller="' + name + '"], [data-ng-controller="' + name + '"]'
      )
    ).scope();
  };

  function needsWalletLogin(ipc) {
    ipc.send('alert', 'info', 'Please select a wallet.');
  };

  function initCopayShellBindings() {

    var ipc = require('ipc');
    var clipb = require('clipboard');

    // atom shell forces to implement the clipboard (on osx) on our own - thanks obama.

    Mousetrap.stopCallback = function() {
      return false
    };

    Mousetrap.bind('command+c', function(e) {
      clipb.writeText(window.getSelection().toString());
    });

    Mousetrap.bind('command+v', function(e) {
      if (document.activeElement) {
        document.activeElement.value = clipb.readText();
        document.activeElement.dispatchEvent(new Event('change'));
      }
    });

    // handle messages
    ipc.on('address:create', function(data) {
      location.href = '#/addresses';
      var ctrl = controller('AddressesController');
      if (!ctrl) return needsWalletLogin(ipc);
      ctrl.newAddr();
    });

    ipc.on('transactions:send', function(data) {
      location.href = '#/send';
      var ctrl = controller('SendController');
      if (!ctrl) return needsWalletLogin(ipc);
    });

    ipc.on('transactions:all', function(data) {
      location.href = '#/transactions';
      var ctrl = controller('TransactionsController');
      if (!ctrl) return needsWalletLogin(ipc);
      ctrl.show();
    });

    ipc.on('transactions:pending', function(data) {
      location.href = '#/transactions';
      var ctrl = controller('TransactionsController');
      if (!ctrl) return needsWalletLogin(ipc);
      ctrl.show(true);
    });

    ipc.on('backup:download', function(data) {
      location.href = '#/backup';
      var ctrl = controller('BackupController');
      if (!ctrl) return needsWalletLogin(ipc);
      ctrl.download();
    });

    ipc.on('backup:email', function(data) {
      location.href = '#/backup';
      var ctrl = controller('BackupController');
      if (!ctrl) return needsWalletLogin(ipc);
      ctrl.openModal();
    });

    ipc.on('backup:import:data', function(data) {
      location.href = '#/import';
      var ctrl = controller('ImportController');
      if (!ctrl) return;
      ctrl.backupText = data;
      ctrl.openPasteArea();
      ctrl.$apply();
    });

    ipc.on('backup:import', function(data) {
      location.href = '#/import';
    });

    // let the shell know when an error occurs
    window.onerror = function(err) {
      ipc.send('error', err);
    };

    return ipc;
  };

})();
