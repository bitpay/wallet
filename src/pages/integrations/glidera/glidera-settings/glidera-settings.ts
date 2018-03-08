import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

import * as _ from 'lodash';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { GlideraProvider } from '../../../../providers/glidera/glidera';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-glidera-settings',
  templateUrl: 'glidera-settings.html',
})
export class GlideraSettingsPage {

  private serviceName: string = 'glidera';
  public showAtHome: any;
  public service: any;
  public account: any;

  constructor(
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private glideraProvider: GlideraProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.account = {};
    this.service = _.filter(this.homeIntegrationsProvider.get(), { name: this.serviceName });
    this.showAtHome = !!this.service[0].show;
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
    title = title ? title : 'Error';
    this.logger.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  public integrationChange(): void {
    let opts = {
      showIntegration: { [this.serviceName] : this.showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(this.serviceName, this.showAtHome);
    this.configProvider.set(opts);
  }

  public revokeToken() {
    this.popupProvider.ionicConfirm(
      'Glidera',
      'Are you sure you would like to log out of your Glidera account?'
    ).then((res) => {
      if (res) {
        this.glideraProvider.remove();
        this.navCtrl.popToRoot({ animate: false }).then(() => {
          this.navCtrl.parent.select(0);
        });
      }
    });
  }

}
