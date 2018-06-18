import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../../../providers/config/config';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-color',
  templateUrl: 'wallet-color.html'
})
export class WalletColorPage {
  public wallet;
  public colorCount: number[];
  public currentColorIndex: number;
  private retries: number;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private events: Events
  ) {
    this.retries = 3;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletColorPage');
  }

  ionViewWillEnter() {
    const COLOR_COUNT = 14;
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.colorCount = Array(COLOR_COUNT)
      .fill(0)
      .map((_, i) => i);
    this.setCurrentColorIndex();
  }

  public save(i): void {
    let color = this.indexToColor(i);
    if (!color) return;

    let opts = {
      colorFor: {}
    };
    opts.colorFor[this.wallet.credentials.walletId] = color;

    this.configProvider.set(opts);
    this.events.publish('wallet:updated', this.wallet.credentials.walletId);
    this.navCtrl.pop();
  }

  private setCurrentColorIndex(): void {
    try {
      this.currentColorIndex = this.colorToIndex(this.wallet.color);
    } catch (e) {
      // Wait for DOM to render and try again.
      setTimeout(() => {
        if (this.retries > 0) {
          this.retries -= 1;
          this.setCurrentColorIndex();
        }
      }, 100);
    }
  }

  private colorToIndex(color: string) {
    for (let i = 0; i < this.colorCount.length; i++) {
      if (this.indexToColor(i) == color.toLowerCase()) {
        return i;
      }
    }
    return undefined;
  }

  private indexToColor(i: number): string {
    // Expect an exception to be thrown if can't getComputedStyle().
    return this.rgb2hex(
      (window as any).getComputedStyle(
        document.getElementsByClassName('wallet-color-' + i)[0]
      ).backgroundColor
    );
  }

  private rgb2hex(rgb): string {
    rgb = rgb.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    );
    return rgb && rgb.length === 4
      ? '#' +
          ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : '';
  }
}
