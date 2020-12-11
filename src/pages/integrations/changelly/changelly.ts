import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { ChangellyDetailsPage } from './changelly-details/changelly-details';

// Proviers
import { ChangellyProvider } from '../../../providers/changelly/changelly';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';
import { ThemeProvider } from '../../../providers/theme/theme';

@Component({
  selector: 'page-changelly',
  templateUrl: 'changelly.html'
})
export class ChangellyPage {
  public loading: boolean;
  public swapTxs: any[];
  public showInHome;
  public service;

  constructor(
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private modalCtrl: ModalController,
    // private navParams: NavParams,
    private changellyProvider: ChangellyProvider,
    public themeProvider: ThemeProvider
  ) {}

  ionViewDidLoad() {
    this.swapTxs = [];
    this.logger.info('Loaded: ChangellyPage');
  }

  ionViewWillEnter() {
    this.init();
  }

  private init() {
    this.loading = true;
    this.changellyProvider
      .getChangelly()
      .then(changellyData => {
        // if (
        //   !_.isEmpty(this.navParams.data) &&
        //   this.navParams.data.paymentId &&
        //   changellyData[this.navParams.data.paymentId]
        // ) {
        //   changellyData[this.navParams.data.paymentId].status =
        //     this.navParams.data.success === 'true' ? 'success' : 'failed';
        //   this.changellyProvider
        //     .saveChangelly(changellyData[this.navParams.data.paymentId], null)
        //     .catch(() => {
        //       this.logger.warn('Could not update payment request status');
        //     });
        // }

        const swapTxs: any = {};
        Object.assign(swapTxs, changellyData);
        this.swapTxs = Object.values(swapTxs);
        console.log('===============this.swapTxs: ', this.swapTxs);

        this.updateStatus()
          .then(data => {
            console.log('===============this.updateStatus data: ', data);
          })
          .catch(err => {
            console.log('===============this.updateStatus err: ', err);
          });

        this.loading = false;
      })
      .catch(err => {
        this.loading = false;
        if (err) this.logger.error(err);
      });
  }

  public updateStatus() {
    let updates = [];
    this.swapTxs.forEach(tx => {
      if (['finished', 'failed', 'refunded', 'expired'].includes(tx.status))
        return;

      updates.push(this.changellyProvider.getStatus(tx.exchangeTxId));
    });

    return Promise.all(updates);
  }

  public openChangellyModal(swapTxData) {
    const modal = this.modalCtrl.create(ChangellyDetailsPage, {
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
