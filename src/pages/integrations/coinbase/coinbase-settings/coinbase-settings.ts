import { Component } from '@angular/core';
import { App, NavController } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';
import { TabsPage } from '../../../tabs/tabs';

@Component({
  selector: 'page-coinbase-settings',
  templateUrl: 'coinbase-settings.html',
})
export class CoinbaseSettingsPage {

  private serviceName: string = 'coinbase';
  public showInHome: any;
  public service: any;
  public coinbaseAccount: any;
  public coinbaseUser: any;

  constructor(
    private app: App,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private coinbaseProvider: CoinbaseProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), { name: this.serviceName });
    this.showInHome = !!this.service[0].show;
  }

  ionViewDidLoad() {
    this.coinbaseProvider.init((err, data) => {
      if (err || _.isEmpty(data)) {
        if (err) {
          this.logger.error(err);
          let errorId = err.errors ? err.errors[0].id : null;
          err = err.errors ? err.errors[0].message : err;
          this.popupProvider.ionicAlert('Error connecting to Coinbase', err).then(() => {
            if (errorId == 'revoked_token') {
              this.coinbaseProvider.logout();
              this.navCtrl.popToRoot({ animate: false });
            }
          });
        }
        return;
      }
      let accessToken = data.accessToken;
      let accountId = data.accountId;
      this.coinbaseProvider.getAccount(accessToken, accountId, (err, account) => {
        this.coinbaseAccount = account.data[0];
      });
      this.coinbaseProvider.getCurrentUser(accessToken, (err, user) => {
        this.coinbaseUser = user.data;
      });
    });
  }

  public showInHomeSwitch(): void {
    let opts = {
      showIntegration: { [this.serviceName] : this.showInHome }
    };
    this.homeIntegrationsProvider.updateConfig(this.serviceName, this.showInHome);
    this.configProvider.set(opts);
  }

  public revokeToken() {
    this.popupProvider.ionicConfirm(
      'Coinbase',
      'Are you sure you would like to log out of your Coinbase account?'
    ).then((res) => {
      if (res) {
        this.coinbaseProvider.logout();
        this.app.getRootNavs()[0].setRoot(TabsPage);
      }
    });
  };

}
