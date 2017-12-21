import { Component } from '@angular/core';
import { NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Pages
import { MercadoLibreCardDetailsPage } from '../mercado-libre-card-details/mercado-libre-card-details';

// Provider
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-mercado-libre-cards',
  templateUrl: 'mercado-libre-cards.html',
})
export class MercadoLibreCardsPage {

  public giftCards: any;
  public card: any;
  public invoiceId;

  constructor(
    private mercadoLibreProvider: MercadoLibreProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibreCardsPage');
    this.updatePendingGiftCards();
  }

  ionViewWillEnter() {
    this.invoiceId = this.navParams.data.invoiceId;
    this.updateGiftCards().then(() => {
      if (this.invoiceId) {
        let card = _.find(this.giftCards, {
          invoiceId: this.invoiceId
        });
        if (_.isEmpty(card)) {
          this.popupProvider.ionicAlert(null, 'Card not found');
          return;
        }
        this.openCardModal(card);
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private updateGiftCards(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mercadoLibreProvider.getPendingGiftCards((err: any, gcds: any) => {
        if (err) {
          this.popupProvider.ionicAlert('Could not get gift cards', err);
          return reject(err);
        }
        this.giftCards = gcds;
        return resolve();
      });
    });
  }

  public updatePendingGiftCards = _.debounce(() => {
    this.updateGiftCards().then(() => {
      let gcds = this.giftCards;
      _.forEach(gcds, (dataFromStorage: any) => {
        if (dataFromStorage.status == 'PENDING' || dataFromStorage.status == 'invalid') {
          this.logger.debug("Creating / Updating gift card");

          this.mercadoLibreProvider.createGiftCard(dataFromStorage, (err: any, giftCard: any) => {

            if (err) {
              this.logger.error('Error creating gift card:', err);
              giftCard = {};
              giftCard.status = 'FAILURE';
            }

            if (giftCard.status != 'PENDING') {
              let newData: any = {};

              if (!giftCard.status) dataFromStorage.status = null; // Fix error from server

              let cardStatus = giftCard.cardStatus;
              if (cardStatus && (cardStatus != 'active' && cardStatus != 'inactive' && cardStatus != 'expired'))
                giftCard.status = 'FAILURE';

              _.merge(newData, dataFromStorage, giftCard);

              this.mercadoLibreProvider.savePendingGiftCard(newData, null, (err: any) => {
                this.logger.debug("Saving new gift card");
                this.updateGiftCards();
              });
            }
          });
        }
      });
    }).catch((err: any) => {
      this.logger.error(err);
    });

  }, 1000, {
      'leading': true
    });

  public openCardModal(card: any): void {
    this.card = card;

    let modal = this.modalCtrl.create(MercadoLibreCardDetailsPage, { card: this.card });
    modal.present();

    modal.onDidDismiss(() => {
      this.updatePendingGiftCards();
    })
  }

}
