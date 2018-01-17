import { Component } from '@angular/core';
import { ModalController, NavController, Events } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';
import * as _ from 'lodash';

// Pages
import { ShapeshiftDetailsPage } from './shapeshift-details/shapeshift-details';
import { ShapeshiftShiftPage } from './shapeshift-shift/shapeshift-shift';

// Providers
import { ShapeshiftProvider } from '../../../providers/shapeshift/shapeshift';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

@Component({
  selector: 'page-shapeshift',
  templateUrl: 'shapeshift.html',
})
export class ShapeshiftPage {

  public shifts: any;
  public network: string;

  constructor(
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private shapeshiftProvider: ShapeshiftProvider
  ) {
    this.network = this.shapeshiftProvider.getNetwork();
    this.shifts = { data: {} };
    this.init();
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ShapeshiftPage');
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (walletId: string, type: string, n: any) => {
      if (type == 'NewBlock') this.updateShift(this.shifts);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private updateShift = _.debounce((shifts: any) => {
    if (_.isEmpty(shifts.data)) return;
    _.forEach(shifts.data, (dataFromStorage: any) => {
      this.shapeshiftProvider.getStatus(dataFromStorage.address, (err: any, st: any) => {
        if (err) return;

        this.shifts.data[st.address].status = st.status;
        this.shifts.data[st.address].transaction = st.transaction || null;
        this.shifts.data[st.address].incomingCoin = st.incomingCoin || null;
        this.shifts.data[st.address].incomingType = st.incomingType || null;
        this.shifts.data[st.address].outgoingCoin = st.outgoingCoin || null;
        this.shifts.data[st.address].outgoingType = st.outgoingType || null;
        this.shapeshiftProvider.saveShapeshift(this.shifts.data[st.address], null, (err: any) => {
          this.logger.debug("Saved shift with status: " + st.status);
        });
      });
    });
  }, 1000, {
      'leading': true
    });

  private init(): void {
    this.shapeshiftProvider.getShapeshift((err: any, ss: any) => {
      if (err) this.logger.error(err);
      this.shifts = { data: ss };
      this.updateShift(this.shifts);
    });
  }

  public update(): void {
    this.updateShift(this.shifts);
  }

  public openShiftModal(ssData: any) {
    let modal = this.modalCtrl.create(ShapeshiftDetailsPage, { ssData: ssData });

    modal.present();

    modal.onDidDismiss((data) => {
      this.init();
    });
  }

  public goTo(page: string): void {
    switch (page) {
      case 'Shift':
        this.navCtrl.push(ShapeshiftShiftPage);
        break;
    }
  }

}
