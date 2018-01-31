import { Component } from '@angular/core';
import { NavParams, NavController, ModalController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

import { HomePage } from '../../../home/home';
import { GlideraProvider } from '../../../../providers/glidera/glidera';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-glidera-settings',
  templateUrl: 'glidera-settings.html',
})
export class GlideraSettingsPage {

  public account: any;

  constructor(
    private navParams: NavParams,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private glideraProvider: GlideraProvider
  ) {
    this.account = {};
  }

  ionViewDidEnter() {
    this.glideraProvider.init((err, glidera) => {
      if (err || !glidera) {
        if (err) this.showErrorAndBack('Error connecting Glidera', err);
        return;
      }
      this.account.token = glidera.token;
      this.account.permissions = glidera.permissions;
      this.account.status = glidera.status;
      this.glideraProvider.updateStatus(this.account);
    });
  }

  private showErrorAndBack(title: string, msg: any) {
    title = title ? title : 'Error'; // TODO: gettextCatalog
    this.logger.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError = function (title: string, msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      title = title || 'Error'; // TODO: gettextCatalog
      this.logger.error(msg);
      msg = (msg && msg.errors) ? msg.errors[0].message : msg;
      this.popupProvider.ionicAlert(title, msg).then(() => {
        return resolve();
      });
    });
  }

  public revokeToken() {
    this.popupProvider.ionicConfirm(
      'Glidera',
      'Are you sure you would like to log out of your Glidera account?'
    ).then((res) => {
      if (res) {
        this.glideraProvider.remove();
        this.navCtrl.popToRoot();
      }
    });
  }

}
