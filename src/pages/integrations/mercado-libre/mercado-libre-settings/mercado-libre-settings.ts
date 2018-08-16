import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { MercadoLibreCardDetailsPage } from './../mercado-libre-card-details/mercado-libre-card-details';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { Logger } from '../../../../providers/logger/logger';
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';

@Component({
  selector: 'page-mercado-libre-settings',
  templateUrl: 'mercado-libre-settings.html'
})
export class MercadoLibreSettingsPage {
  private serviceName: string;
  public showInHome;
  public service;
  public archivedGiftCards;
  public card;
  public showArchivedCards: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private mercadoLibreProvider: MercadoLibreProvider,
    private modalCtrl: ModalController
  ) {
    this.serviceName = 'mercadolibre';
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
    this.init();
  }

  private init(): void {
    this.mercadoLibreProvider.getPendingGiftCards((err, gcds) => {
      if (err) this.logger.error(err);
      this.filterArchivedGiftCards(gcds);
      this.showArchivedCards = !_.isEmpty(this.archivedGiftCards);
    });
  }

  public showInHomeSwitch(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showInHome }
    };
    this.homeIntegrationsProvider.updateConfig(
      this.serviceName,
      this.showInHome
    );
    this.configProvider.set(opts);
  }

  private filterArchivedGiftCards(giftCards): void {
    this.archivedGiftCards = _.pickBy(giftCards, gcdValue => {
      return gcdValue.archived;
    });
  }

  public openCardModal(card): void {
    this.card = card;

    let modal = this.modalCtrl.create(MercadoLibreCardDetailsPage, {
      card: this.card
    });
    modal.present();
    modal.onDidDismiss(() => {
      this.init();
    });
  }
}
