import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { AppProvider } from '../../providers/app/app';
import { ConfigProvider } from '../../providers/config/config';
import { PlatformProvider } from '../../providers/platform/platform';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'footer-menu',
  templateUrl: 'footer-menu.html'
})
export class FooterMenuComponent extends ActionSheetParent {
  public optionsMenu: object;
  public isCordova: boolean;
  public clipboardData: string;
  private appName: string;

  constructor(
    private translate: TranslateService,
    private appProvider: AppProvider,
    private platformProvider: PlatformProvider,
    private configProvider: ConfigProvider,
    private analyticsProvider: AnalyticsProvider
  ) {
    super();
    this.appName = this.appProvider.info.name;
    this.isCordova = this.platformProvider.isCordova;
    this.optionsMenu = {
      buyCrypto: {
        imgSrc: `assets/img/footer-menu/buy-crypto.svg`,
        mainLabel: this.translate.instant('Buy Crypto'),
        secondaryLabel: this.translate.instant('Buy crypto with cash'),
        showOption: this.appName === 'bitpay' && this.isCordova ? true : false,
        nextView: {
          name: 'AmountPage',
          params: {
            fromBuyCrypto: true,
            nextPage: 'CryptoOrderSummaryPage',
            currency: this.configProvider.get().wallet.settings
              .alternativeIsoCode
          }
        },
        logEvent: 'menu_buy_crypto_button_clicked'
      },
      exchange: {
        imgSrc: `assets/img/footer-menu/exchange.svg`,
        mainLabel: this.translate.instant('Swap'),
        secondaryLabel: this.translate.instant('Swap crypto for another'),
        showOption: this.appName === 'bitpay' && this.isCordova ? true : false,
        nextView: {
          name: 'ExchangeCryptoPage',
          params: {
            currency: this.configProvider.get().wallet.settings
              .alternativeIsoCode
          }
        },
        logEvent: 'menu_exchange_crypto_button_clicked'
      },
      receive: {
        imgSrc: `assets/img/footer-menu/receive.svg`,
        mainLabel: this.translate.instant('Receive'),
        secondaryLabel: this.translate.instant(
          'Get crypto from another wallet'
        ),
        showOption: true,
        nextView: {
          name: 'CoinAndWalletSelectorPage',
          params: {
            walletSelectorTitle: this.translate.instant(
              'Select destination wallet'
            ),
            action: 'receive',
            fromFooterMenu: true
          }
        },
        logEvent: 'menu_receive_crypto_clicked'
      },
      send: {
        imgSrc: `assets/img/footer-menu/send.svg`,
        mainLabel: this.translate.instant('Send'),
        secondaryLabel: this.translate.instant('Send crypto to another wallet'),
        showOption: true,
        nextView: {
          name: 'CoinAndWalletSelectorPage',
          params: {
            walletSelectorTitle: this.translate.instant('Select source wallet'),
            action: 'send',
            fromFooterMenu: true
          }
        },
        logEvent: 'menu_send_crypto_clicked'
      }
    };
  }

  ngOnInit() {
    this.clipboardData = this.params.clipboardData;
  }

  public optionClicked(opt) {
    if (opt.logEvent) {
      this.analyticsProvider.logEvent(opt.logEvent, {
        from: 'footerMenu'
      });
    }
    this.dismiss(opt.nextView);
  }

  public openScanPage() {
    this.analyticsProvider.logEvent('scan_button_clicked', {
      from: 'footerMenu'
    });
    const nextView = {
      name: 'ScanPage',
      params: {
        fromFooterMenu: true
      }
    };
    this.dismiss(nextView);
  }

  public processClipboardData() {
    this.analyticsProvider.logEvent('clipboard_clicked', {
      from: 'footerMenu'
    });
    const nextView = {
      params: {
        fromFooterMenu: true
      }
    };
    this.dismiss(nextView);
  }
}
