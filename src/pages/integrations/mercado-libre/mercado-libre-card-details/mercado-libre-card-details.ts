import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Provider
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-mercado-libre-card-details',
  templateUrl: 'mercado-libre-card-details.html',
})
export class MercadoLibreCardDetailsPage {

  constructor(
    private mercadoLibreProvider: MercadoLibreProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private viewCtrl: ViewController
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibreCardDetailsPage');
  }

}
