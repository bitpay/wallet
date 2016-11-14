'use strict';

angular.module('copayApp.services').service('popupService', function($log, $ionicPopup, platformInfo, platformService) {

  var isCordova = platformInfo.isCordova;
  var awaitingDialogResponse = [];

  function addDialogListener(callback){
    var id = awaitingDialogResponse.push(callback) - 1;
    return id;
  }

  if(platformService.electron){
    platformService.electron.ipcRenderer.on('alert-dialog-closed', handleDialogResponse);
    platformService.electron.ipcRenderer.on('confirm-dialog-closed', handleDialogResponse);
  }
  function handleDialogResponse(e, id, args) {
    var callback = awaitingDialogResponse[id];
    awaitingDialogResponse = awaitingDialogResponse.splice(id, 1);
    callback(args);
  }

  this.showAlert = function(title, msg, cb, buttonText) {
    if (!cb) cb = function() {};
    if (!buttonText) {
      // TODO: no button in this app should use generic text
      $log.warn('Using generic buttonText');
      buttonText = 'OK';
    }
    var message = (msg && msg.message) ? msg.message : msg;
    var opts = {
      title: title,
      message: message,
      buttonText: buttonText
    }
    $log.debug('Alert:', JSON.stringify(opts));

    if (isCordova) {
      navigator.notification.alert(message, cb, title, buttonText);
    } else if (platformService.electron) {
      var id = addDialogListener(cb);
      platformService.electron.ipcRenderer.send('open-alert-dialog', id, opts);
    } else {
      // Fallback only – use Ionic alert
      $ionicPopup.alert({
        title: title,
        subTitle: message,
        okType: 'button-clear button-positive',
        okText: buttonText,
      }).then(cb);
    }
  };

  this.showConfirm = function(title, message, confirmText, cancelText, cb, actionIsDiscouraged) {
    if (!cb) cb = function() {};
    var opts = {
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      actionIsDiscouraged: actionIsDiscouraged
    }
    $log.debug('Confirm:', JSON.stringify(opts));

    if (isCordova) {
      var button1 = cancelText
      var button2 = confirmText
      var confirmedIndex = 2;
      if(actionIsDiscouraged){
        button1 = confirmText
        button2 = cancelText
        var confirmedIndex = 1;
      }
      var onConfirm = function(buttonIndex) {
        var confirmed = false;
        if(buttonIndex === confirmedIndex) {
          confirmed = true;
        }
        cb(confirmed);
      }
      navigator.notification.confirm(message, onConfirm, title, [button1, button2]);
    } else if (platformService.electron) {
      var onResponse = function(res){
        if(res.confirmed) return cb(true);
        else return cb(false);
      }
      var id = addDialogListener(onResponse);
      platformService.electron.ipcRenderer.send('open-confirm-dialog', id, opts);
    } else {
      // Fallback only – use Ionic alert
      $ionicPopup.confirm({
        title: title,
        subTitle: message,
        cancelText: cancelText,
        cancelType: 'button-clear button-positive',
        okText: confirmText,
        okType: 'button-clear button-positive'
      }).then(function(res) {
        return cb(res);
      });
    }
  };

  this.showPrompt = function(title, message, opts, cb) {
    $log.warn(title ? (title + ': ' + message) : message);

    opts = opts || {};

    if (isCordova && !opts.forceHTMLPrompt) {
      var onPrompt = function(results) {
        if (results.buttonIndex == 1) return cb(results.input1);
        else return cb();
      }
      navigator.notification.prompt(message, onPrompt, title, null, opts.defaultText);
    // TODO: } if (platformService.electron && !opts.forceHTMLPrompt) {
    } else {
      opts = opts || {};
      $ionicPopup.prompt({
        title: title,
        subTitle: message,
        inputType: opts.inputType,
        inputPlaceholder: opts.inputPlaceholder,
        defaultText: opts.defaultText
      }).then(function(res) {
        return cb(res);
      });
    }
  };

});
