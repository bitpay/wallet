import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import { PlatformInfo } from './platform-info.service';
import { TextService } from './text.service';
import { AlertController } from 'ionic-angular';

@Injectable()
export class PopupService {
  win: any = window;
  navigator: any = this.win.navigator;
  isCordova: boolean = false;

  constructor(
    public textService: TextService,
    public logger: Logger,
    public platformInfo: PlatformInfo,
    public alertCtrl: AlertController
  ) {
    this.isCordova = this.platformInfo.isCordova;
  }

  _ionicAlert(title, message, cb, buttonName) {
    if (!cb) cb = () => {};
    let alert = this.alertCtrl.create({
        title: title,
        message: message,
        buttons: [
          {
            text: buttonName || this.textService.gettextCatalog.getString('OK'),
            handler: () => {
              cb();
            }
          }
        ]
      });
      alert.present();
  };

  _ionicConfirm(title, message, okText, cancelText, cb) {
    let alert = this.alertCtrl.create({
        title: title,
        message: message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => {
              cb(false);
            }
          },
          {
            text: okText,
            handler: () => {
              cb(true);
            }
          }
        ]
      });
      alert.present();
  };

  _ionicPrompt(title, message, opts, cb) {
    opts = opts || {};
    let alert = this.alertCtrl.create({
      title: title,
      message: message,
      inputs: [
        {
          type: opts.inputType,
          placeholder: opts.inputPlaceholder
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            cb(false);
          }
        },
        {
          text: 'OK',
          handler: data => {
            cb(data[0]);
          }
        }
      ]
    });
    alert.present();
  };

  /*************** Cordova ****************/

  _cordovaAlert(title, message, cb, buttonName) {
    if (!cb) cb = () => {};
    this.navigator.notification.alert(message, cb, title, buttonName);
  };

  _cordovaConfirm(title, message, okText, cancelText, cb) {
    let onConfirm = (buttonIndex) => {
      if (buttonIndex == 2) return cb(true);
      else return cb(false);
    }
    okText = okText || this.textService.gettextCatalog.getString('OK');
    cancelText = cancelText || this.textService.gettextCatalog.getString('Cancel');
    this.navigator.notification.confirm(message, onConfirm, title, [cancelText, okText]);
  };

  _cordovaPrompt(title, message, opts, cb) {
    let onPrompt = (results) => {
      if (results.buttonIndex == 1) return cb(results.input1);
      else return cb();
    }
    this.navigator.notification.prompt(message, onPrompt, title, null, opts.defaultText);
  };

  /**
   * Show a simple alert popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {Callback} Function (optional)
   */

  showAlert(title, msg, cb, buttonName) {
    let message = (msg && msg.message) ? msg.message : msg;
    this.logger.warn(title ? (title + ': ' + message) : message);

    if (this.isCordova)
      this._cordovaAlert(title, message, cb, buttonName);
    else
      this._ionicAlert(title, message, cb, buttonName);
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

  showConfirm(title, message, okText, cancelText, cb) {
    this.logger.warn(title ? (title + ': ' + message) : message);

    if (this.isCordova)
      this._cordovaConfirm(title, message, okText, cancelText, cb);
    else
      this._ionicConfirm(title, message, okText, cancelText, cb);
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

  showPrompt(title, message, opts, cb) {
    this.logger.warn(title ? (title + ': ' + message) : message);

    opts = opts || {};

    if (this.isCordova && !opts.forceHTMLPrompt)
      this._cordovaPrompt(title, message, opts, cb);
    else
      this._ionicPrompt(title, message, opts, cb);
  };

}
