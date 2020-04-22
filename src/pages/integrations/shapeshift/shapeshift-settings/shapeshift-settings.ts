import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-settings',
  templateUrl: 'shapeshift-settings.html'
})
export class ShapeshiftSettingsPage {
  private accessToken;

  public shapeshiftUser;
  public unverifiedAccount: boolean;
  public loading: boolean;

  constructor(
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private shapeshiftProvider: ShapeshiftProvider,
    private externalLinkProvider: ExternalLinkProvider
  ) {}

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
