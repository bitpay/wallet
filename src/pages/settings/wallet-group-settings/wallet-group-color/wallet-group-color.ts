import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

// providers
import { ConfigProvider } from '../../../../providers/config/config';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-group-color',
  templateUrl: 'wallet-group-color.html'
})
export class WalletGroupColorPage {
  public keyId;
  public colors;
  public currentColorIndex;
  public currentColor;

  constructor(
    private configProvider: ConfigProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private events: Events,
    private profileProvider: ProfileProvider
  ) {
    this.keyId = this.navParams.data.keyId;
    this.colors = this.profileProvider.getColorsGroup();
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletGroupColorPage');
  }

  ionViewWillEnter() {
    let colorFor = this.configProvider.get().colorFor[this.keyId] || this.profileProvider.getDefaultColor();
    this.currentColorIndex = _.indexOf(this.colors, colorFor);
  }

  public save(i) {
    let opts = {
      colorFor: {}
    };
    opts.colorFor[this.keyId] = this.colors[i];

    this.configProvider.set(opts);
    this.events.publish('Local/WalletListChange');
    this.goBack();
  }

  private goBack() {
    this.navCtrl.pop();
  }
}
