import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ConfigProvider } from '../../../../providers/config/config';

@Component({
  selector: 'page-wallet-color',
  templateUrl: 'wallet-color.html',
})
export class WalletColorPage {

  public wallet: any;
  public colorCount: Array<number>;
  public currentColorIndex: number;
  private config: any;
  private retries: number = 3;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private logger: Logger
  ) {

  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletColorPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.config = this.configProvider.get();
    this.colorCount = Array(this.getColorCount()).fill(0).map((x, i) => i);
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
    this.navCtrl.pop();
  }

  private getColorCount() {
    let count = window.getComputedStyle(document.getElementsByClassName('wallet-color-count')[0]).content;
    return parseInt(count.replace(/[^0-9]/g, ''));
  };

  private getColorDefault(): string {
    return this.rgb2hex((window as any).getComputedStyle(document.getElementsByClassName('wallet-color-default')[0]).color);
  }

  private setCurrentColorIndex(): void {
    try {
      this.currentColorIndex = this.colorToIndex(this.config.colorFor[this.wallet.credentials.walletId] || this.getColorDefault());
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

  private colorToIndex(color: string): any {
    for (let i = 0; i < this.colorCount.length; i++) {
      if (this.indexToColor(i) == color.toLowerCase()) {
        return i;
      }
    }
    return undefined;
  }

  private indexToColor(i: number): string {
    // Expect an exception to be thrown if can't getComputedStyle().
    return this.rgb2hex((window as any).getComputedStyle(document.getElementsByClassName('wallet-color-' + i)[0]).backgroundColor);
  }

  private rgb2hex(rgb: any): string {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
      ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
  }

}