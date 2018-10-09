import { Component } from '@angular/core';
import { App, NavController } from 'ionic-angular';

import * as _ from 'lodash';

// Pages
import { TabsPage } from '../../../tabs/tabs';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-settings',
  templateUrl: 'shapeshift-settings.html'
})
export class ShapeshiftSettingsPage {
  private serviceName: string = 'shapeshift';
  public showInHome;
  public service;
  public shapeshiftUser;

  constructor(
    private app: App,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private shapeshiftProvider: ShapeshiftProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
  }

  ionViewDidLoad() {
    this.shapeshiftProvider.init((err, data) => {
      if (err || _.isEmpty(data)) {
        if (err) {
          this.logger.error(err);
          err = err.errors ? err.errors[0].message : err;
          this.popupProvider
            .ionicAlert('Error connecting to ShapeShift', err)
            .then(() => {
              this.shapeshiftProvider.logout();
              this.navCtrl.popToRoot({ animate: false });
            });
        }
        return;
      }
      let accessToken = data.accessToken;
      this.shapeshiftProvider.getAccount(accessToken, (err, account) => {
        if (err) this.logger.error(err);
        this.shapeshiftUser = account.data;
      });
    });
  }

  public showInHomeSwitch(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showInHome }
    };
    this.homeIntegrationsProvider.updateConfig(
      this.serviceName,
      this.showInHome
    );
    this.configProvider.set(opts);
  }

  public revokeToken() {
    this.popupProvider
      .ionicConfirm(
        'ShapeShift',
        'Are you sure you would like to log out of your ShapeShift account?'
      )
      .then(res => {
        if (res) {
          this.shapeshiftProvider.logout();
          this.app.getRootNavs()[0].setRoot(TabsPage);
        }
      });
  }
}
