import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';

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
        const swapTxs: any = {};
        Object.assign(swapTxs, changellyData);
        this.swapTxs = Object.values(swapTxs);
        this.loading = false;
      })
      .catch(err => {
        this.loading = false;
        if (err) this.logger.error(err);
      });
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
