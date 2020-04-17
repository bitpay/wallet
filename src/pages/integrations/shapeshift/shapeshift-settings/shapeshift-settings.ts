import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';
import { ThemeProvider } from '../../../../providers/theme/theme';

@Component({
  selector: 'page-shapeshift-settings',
  templateUrl: 'shapeshift-settings.html'
})
export class ShapeshiftSettingsPage {
  private serviceName: string = 'shapeshift';
  private accessToken;

  public showInHome;
  public service;
  public shapeshiftUser;
  public unverifiedAccount: boolean;
  public loading: boolean;
  public headerColor: string;

  constructor(
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private platform: Platform,
    private logger: Logger,
    private shapeshiftProvider: ShapeshiftProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private themeProvider: ThemeProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
    this.headerColor = '#0d172c';
  }

  ionViewWillEnter() {
    if (this.platform.is('cordova')) {
      this.themeProvider.useCustomStatusBar(this.headerColor);
    }
  }

  ionViewWillLeave() {
    if (this.platform.is('cordova')) {
      this.themeProvider.useDefaultStatusBar();
    }
  }

  ionViewDidLoad() {
    this.loading = true;
    this.shapeshiftProvider.init((err, data) => {
      if (!err && !data) {
        this.loading = false;
        return;
      }
      if (err) {
        this.logger.error(err);
        this.loading = false;
        this.unverifiedAccount = err == 'unverified_account' ? true : false;
        return;
      }

      this.accessToken = data.accessToken;
      this.shapeshiftProvider.getAccount(this.accessToken, (err, account) => {
        this.loading = false;
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
          this.shapeshiftProvider.getStoredToken(accessToken => {
            this.shapeshiftProvider.logout(accessToken);
            this.navCtrl.popToRoot();
          });
        }
      });
  }

  public openAuthenticateWindow() {
    let url = 'https://portal.shapeshift.io/me/fox/dashboard';
    this.externalLinkProvider.open(url);
  }
}
