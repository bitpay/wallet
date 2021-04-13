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
  private isCordova: boolean;
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
        showOption: this.appName === 'copay' ? false : true,
        nextView: {
          name: 'AmountPage',
          params: {
            fromBuyCrypto: true,
            nextPage: 'CryptoOrderSummaryPage',
            currency: this.configProvider.get().wallet.settings
              .alternativeIsoCode
          }
        },
        logEvent: 'buy_crypto_button_clicked'
      },
      exchange: {
        imgSrc: `assets/img/footer-menu/exchange.svg`,
        mainLabel: this.translate.instant('Exchange'),
        secondaryLabel: this.translate.instant('Swap crypto for another'),
        showOption: this.appName === 'copay' ? false : true,
        nextView: {
          name: 'ExchangeCryptoPage',
          params: {
            currency: this.configProvider.get().wallet.settings
              .alternativeIsoCode
          }
        },
        logEvent: 'exchange_crypto_button_clicked'
      },
      receive: {
        imgSrc: `assets/img/footer-menu/receive.svg`,
        mainLabel: this.translate.instant('Receive'),
        secondaryLabel: this.translate.instant(
          'Get crypto from another wallet'
        ),
        showOption: true,
        nextView: {
          name: 'CryptoCoinSelectorPage',
          params: {
            title: this.translate.instant('Select destination wallet'),
            action: 'receive',
            fromFooterMenu: true
          }
        }
      },
      send: {
        imgSrc: `assets/img/footer-menu/send.svg`,
        mainLabel: this.translate.instant('Send'),
        secondaryLabel: this.translate.instant('Send crypto to another wallet'),
        showOption: true,
        nextView: {
          name: 'CryptoCoinSelectorPage',
          params: {
            title: this.translate.instant('Select source wallet'),
            action: 'send',
            fromFooterMenu: true
          }
        }
      },
      buyGiftCards: {
        imgSrc: `assets/img/footer-menu/buy-gift-card.svg`,
        mainLabel: this.translate.instant('Buy Gift Cards'),
        secondaryLabel: this.translate.instant('Buy gift cards with crypto'),
        showOption: this.appName === 'copay' ? false : true,
        nextView: {
          name: 'CardCatalogPage',
          params: {}
        }
      },
      scan: {
        imgSrc: `assets/img/footer-menu/scan.svg`,
        mainLabel: this.translate.instant('Scan'),
        secondaryLabel: this.translate.instant('Scan QR code'),
        showOption: this.isCordova,
        nextView: {
          name: 'ScanPage',
          params: {}
        }
      }
    };
  }

  public optionClicked(opt) {
    if (opt.logEvent) {
      this.analyticsProvider.logEvent(opt.logEvent, {
        from: 'footerMenu'
      });
    }
    this.dismiss(opt.nextView);
  }
}
