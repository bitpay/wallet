import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

@Component({
  selector: 'page-vault-color',
  templateUrl: 'vault-color.html'
})
export class VaultColorPage {
  public vaultColor;
  public colorCount: number[];
  public currentColorIndex: number;
  private retries: number;

  constructor(
    private navParams: NavParams,
    private logger: Logger,
    private viewCtrl: ViewController
  ) {
    this.retries = 3;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: VaultColorPage');
  }

  ionViewWillEnter() {
    const COLOR_COUNT = 14;
    this.vaultColor = this.navParams.data.vaultColor;
    this.colorCount = Array(COLOR_COUNT)
      .fill(0)
      .map((_, i) => i);
    this.setCurrentColorIndex(this.vaultColor);
  }

  public save(i): void {
    let color = this.indexToColor(i);
    if (!color) return;

    this.viewCtrl.dismiss(color);
  }

  private setCurrentColorIndex(color): void {
    try {
      this.currentColorIndex = this.colorToIndex(color);
    } catch (e) {
      // Wait for DOM to render and try again.
      setTimeout(() => {
        if (this.retries > 0) {
          this.retries -= 1;
          this.setCurrentColorIndex(color);
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
        document.getElementsByClassName('vault-color-' + i)[0]
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
