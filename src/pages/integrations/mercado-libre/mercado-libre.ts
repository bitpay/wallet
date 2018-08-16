import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { AmountPage } from '../../send/amount/amount';
import { MercadoLibreCardDetailsPage } from './mercado-libre-card-details/mercado-libre-card-details';

// Providers
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { MercadoLibreProvider } from '../../../providers/mercado-libre/mercado-libre';
import { PopupProvider } from '../../../providers/popup/popup';
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-mercado-libre',
  templateUrl: 'mercado-libre.html'
})
export class MercadoLibrePage {
  public giftCards;
  public network: string;
  public showMainView: boolean;

  private updateGiftCard: boolean;
  public card;
  public invoiceId: string;

  constructor(
    private navCtrl: NavController,
    private mercadoLibreProvider: MercadoLibreProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private timeProvider: TimeProvider,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private popupProvider: PopupProvider
  ) {
    this.showMainView = true;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibrePage');
    this.network = this.mercadoLibreProvider.getNetwork();
    this.init().then(() => {
      if (this.giftCards) {
        this.updatePendingGiftCards();
      }
    });
  }

  ionViewWillEnter() {
    if (this.giftCards) {
      this.invoiceId = this.navParams.data.invoiceId;
      this.updateGiftCards()
        .then(() => {
          if (this.invoiceId) {
            let card = _.find(this.giftCards, {
              invoiceId: this.invoiceId
            });
            if (_.isEmpty(card)) {
              this.popupProvider.ionicAlert(null, 'Card not found');
              return;
            }
            this.openCardModal(card);
            this.invoiceId = this.navParams.data.invoiceId = null;
            this.updateGiftCard = this.checkIfCardNeedsUpdate(card);
          }
        })
        .catch(err => {
          this.logger.error('Mercado Libre: could not update gift cards', err);
        });
    }
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private init(): Promise<any> {
    return new Promise(resolve => {
      this.mercadoLibreProvider.getPendingGiftCards((err, gcds) => {
        if (err) this.logger.error(err);
        this.filterArchivedGiftCards(gcds);
        resolve();
      });
    });
  }

  private filterArchivedGiftCards(giftCards): void {
    this.giftCards = _.pickBy(giftCards, gcdValue => {
      return !gcdValue.archived;
    });
    this.showMainView = _.isEmpty(this.giftCards);
  }

  public goTo(page: string): void {
    switch (page) {
      case 'Amount':
        this.navCtrl.push(AmountPage, {
          nextPage: 'BuyMercadoLibrePage',
          currency: 'BRL',
          fixedUnit: true
        });
        break;
    }
  }

  private checkIfCardNeedsUpdate(card) {
    // Continues normal flow (update card)
    if (card.status == 'PENDING') {
      return true;
    }
    // Check if card status FAILURE for 24 hours
    if (
      card.status == 'FAILURE' &&
      this.timeProvider.withinPastDay(card.date)
    ) {
      return true;
    }
    // Success: do not update
    return false;
  }

  private updateGiftCards(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mercadoLibreProvider.getPendingGiftCards((err, gcds) => {
        if (err) {
          this.popupProvider.ionicAlert('Could not get gift cards', err);
          return reject(err);
        }
        this.filterArchivedGiftCards(gcds);
        return resolve();
      });
    });
  }

  public updatePendingGiftCards = _.debounce(
    () => {
      this.updateGiftCards()
        .then(() => {
          let gcds = this.giftCards;
          _.forEach(gcds, dataFromStorage => {
            this.updateGiftCard = this.checkIfCardNeedsUpdate(dataFromStorage);

            if (this.updateGiftCard) {
              this.logger.debug('Creating / Updating gift card');

              this.mercadoLibreProvider.createGiftCard(
                dataFromStorage,
                (err, giftCard) => {
                  if (err) {
                    this.logger.error('Error creating gift card:', err);
                    giftCard = giftCard || {};
                    giftCard['status'] = 'FAILURE';
                  }

                  if (giftCard.status != 'PENDING') {
                    let newData = {};

                    if (!giftCard.status) dataFromStorage.status = null; // Fix error from server

                    let cardStatus = giftCard.cardStatus;
                    if (
                      cardStatus &&
                      (cardStatus != 'active' &&
                        cardStatus != 'inactive' &&
                        cardStatus != 'expired')
                    )
                      giftCard.status = 'FAILURE';

                    _.merge(newData, dataFromStorage, giftCard);

                    this.mercadoLibreProvider.savePendingGiftCard(
                      newData,
                      null,
                      () => {
                        this.logger.debug('Mercado Libre gift card updated');
                        this.updateGiftCards();
                      }
                    );
                  }
                }
              );
            }
          });
        })
        .catch(err => {
          this.logger.error(err);
        });
    },
    1000,
    {
      leading: true
    }
  );

  public openCardModal(card): void {
    this.card = card;

    let modal = this.modalCtrl.create(MercadoLibreCardDetailsPage, {
      card: this.card
    });
    modal.present();

    modal.onDidDismiss(() => {
      this.updatePendingGiftCards();
    });
  }
}
