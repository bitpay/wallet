import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';

// Pages
import { OneInchDetailsPage } from './one-inch-details/one-inch-details';

// Proviers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ExchangeCryptoProvider } from '../../../providers/exchange-crypto/exchange-crypto';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { LocationProvider } from '../../../providers/location/location';
import { Logger } from '../../../providers/logger/logger';
import { OneInchProvider } from '../../../providers/one-inch/one-inch';
import { ThemeProvider } from '../../../providers/theme/theme';

@Component({
  selector: 'page-one-inch',
  templateUrl: 'one-inch.html'
})
export class OneInchPage {
  public loading: boolean;
  public swapTxs: any[];
  public showInHome;
  public service;

  constructor(
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private exchangeCryptoProvider: ExchangeCryptoProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private locationProvider: LocationProvider,
    private modalCtrl: ModalController,
    private oneInchProvider: OneInchProvider,
    public themeProvider: ThemeProvider
  ) {}

  ionViewDidLoad() {
    this.swapTxs = [];
    this.logger.info('Loaded: OneInchPage');
  }

  ionViewWillEnter() {
    this.init();
  }

  private init() {
    this.loading = true;
    this.oneInchProvider
      .getOneInch()
      .then(oneInchData => {
        const swapTxs: any = {};
        Object.assign(swapTxs, oneInchData);
        this.swapTxs = Object.values(swapTxs);
        this.loading = false;

        this.locationProvider.getCountry().then(country => {
          const opts = { country };
          this.exchangeCryptoProvider
            .checkServiceAvailability('1inch', opts)
            .then(isAvailable => {
              if (!isAvailable) {
                const oneInchDisabledWarningSheet = this.actionSheetProvider.createInfoSheet(
                  '1inch-disabled-warning'
                );
                oneInchDisabledWarningSheet.present();
              }
            })
            .catch(err => {
              if (err) this.logger.error(err);
            });
        });
      })
      .catch(err => {
        if (err) this.logger.error(err);
      });
  }

  public openOneInchModal(swapTxData) {
    const modal = this.modalCtrl.create(OneInchDetailsPage, {
      swapTxData
    });

    modal.present();

    modal.onDidDismiss(() => {
      this.init();
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
