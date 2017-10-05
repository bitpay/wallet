'use strict';

angular.module('copayApp.services').service('popupService', function($log, $ionicPopup, platformInfo, gettextCatalog) {

  var isCordova = platformInfo.isCordova;
  var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

  /*************** Ionic ****************/

  var _ionicAlert = function(title, message, cb, okText) {
    if (!cb) cb = function() {};
    $ionicPopup.alert({
      title: title,
      subTitle: message,
      okType: 'button-clear button-positive',
      okText: okText || gettextCatalog.getString('OK'),
    }).then(cb);
  };

  var _ionicConfirm = function(title, message, okText, cancelText, cb) {
    $ionicPopup.confirm({
      title: title,
      subTitle: message,
      cancelText: cancelText,
      cancelType: 'button-clear button-positive',
      okText: okText,
      okType: 'button-clear button-positive'
    }).then(function(res) {
      return cb(res);
    });
  };

  var _ionicPrompt = function(title, message, opts, cb) {
    opts = opts || {};
    $ionicPopup.prompt({
      title: title,
      subTitle: message,
      cssClass: opts.class,
      template: '<input ng-model="data.response" type="' + opts.inputType + '" value ="" autocomplete="off" autofocus>',
      inputPlaceholder: opts.inputPlaceholder,
      defaultText: opts.defaultText
    }).then(function(res) {
      return cb(res);
    });
  };

  /*************** Cordova ****************/

  var _cordovaAlert = function(title, message, cb, okText) {
    if (!cb) cb = function() {};
    title = title ? title : '';
    okText = okText || gettextCatalog.getString('OK');
    navigator.notification.alert(message, cb, title, okText);
  };

  var _cordovaConfirm = function(title, message, okText, cancelText, cb) {
    var onConfirm = function(buttonIndex) {
      if (buttonIndex == 2) return cb(true);
      else return cb(false);
    }
    okText = okText || gettextCatalog.getString('OK');
    cancelText = cancelText || gettextCatalog.getString('Cancel');
    title = title ? title : '';
    navigator.notification.confirm(message, onConfirm, title, [cancelText, okText]);
  };

  var _cordovaPrompt = function(title, message, opts, cb) {
    var onPrompt = function(results) {
      if (results.buttonIndex == 1) return cb(results.input1);
      else return cb();
    }
    var okText = gettextCatalog.getString('OK');
    var cancelText = gettextCatalog.getString('Cancel');
    title = title ? title : '';
    navigator.notification.prompt(message, onPrompt, title, [okText, cancelText], opts.defaultText);
  };

  /**
   * Show a simple alert popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {Callback} Function (optional)
   */

  this.showAlert = function(title, msg, cb, okText) {
    var message = (msg && msg.message) ? msg.message : msg;
    $log.warn(title ? (title + ': ' + message) : message);

    if (isCordova)
      _cordovaAlert(title, message, cb, okText);
    else
      _ionicAlert(title, message, cb, okText);
  };

  /**
   * Show a simple confirm popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {String} okText (optional)
   * @param {String} cancelText (optional)
   * @param {Callback} Function
   * @returns {Callback} OK: true, Cancel: false
   */

  this.showConfirm = function(title, message, okText, cancelText, cb) {
    $log.warn(title ? (title + ': ' + message) : message);

    if (isCordova)
      _cordovaConfirm(title, message, okText, cancelText, cb);
    else
      _ionicConfirm(title, message, okText, cancelText, cb);
  };

  /**
   * Show a simple prompt popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {Object} Object{ inputType, inputPlaceholder, defaultText } (optional)
   * @param {Callback} Function
   * @returns {Callback} Return the value of the input if user presses OK
   */

  this.showPrompt = function(title, message, opts, cb) {
    $log.warn(title ? (title + ': ' + message) : message);

    opts = opts ||  {};

    if (isCordova && !isWindowsPhoneApp && !opts.forceHTMLPrompt)
      _cordovaPrompt(title, message, opts, cb);
    else
      _ionicPrompt(title, message, opts, cb);
  };


});
