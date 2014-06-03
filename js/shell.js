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
  if (typeof module !== 'undefined') module = { exports: null };

  // are we running in copay shell?
  if (window.process && process.type === 'renderer') initCopayShellBindings();

  function controller(name) {
    return angular.element(
      document.querySelectorAll(
        '[ng-controller="' + name + '"], [data-ng-controller="' + name + '"]'
      )
    ).scope();
  };

  function initCopayShellBindings() {

    var ipc = require('ipc');

    ipc.on('address:create', function(data) {
      location.href = '#/addresses';
      controller('AddressesController').newAddr();
    });

    ipc.on('transactions:send', function(data) {
      location.href = '#/send';
    });

    ipc.on('transactions:all', function(data) {
      location.href = '#/transactions';
      controller('TransactionsController').show();
    });

    ipc.on('transactions:pending', function(data) {
      location.href = '#/transactions';
      controller('TransactionsController').show(true);
    });

    ipc.on('backup:download', function(data) {

    });

    ipc.on('backup:email', function(data) {

    });

  };

})();
