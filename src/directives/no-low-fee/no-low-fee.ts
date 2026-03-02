import { Directive, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// Provider
import { ConfigProvider } from '../../providers/config/config';
import { PopupProvider } from '../../providers/popup/popup';

@Directive({
  selector: '[no-low-fee]', // Attribute selector
  host: {
    '(click)': 'noLowFee()'
  }
})
export class NoLowFee {
  private configWallet;

  constructor(
    private configProvider: ConfigProvider,
    private elem: ElementRef,
    private logger: Logger,
    private navCtrl: NavController,
    private popupProvider: PopupProvider
  ) {
    this.logger.debug('NoLowFee Directive initialized');
    this.configWallet = this.configProvider.get().wallet;
  }

  public noLowFee(): void {
    if (
      this.configWallet.settings.feeLevel &&
      this.configWallet.settings.feeLevel.match(/conomy/)
    ) {
      this.logger.debug(
        'Economy Fee setting... disabling link:' +
          this.elem.nativeElement.innerText
      );
      this.popupProvider
        .ionicAlert(
          'Low Fee Error',
          'Please change your Bitcoin Network Fee Policy setting to Normal or higher to use this service'
        )
        .then(() => {
          this.navCtrl.pop();
        });
    }
  }
}
