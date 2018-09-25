import { Component } from '@angular/core';
import { Events, ModalController, NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { ShapeshiftDetailsPage } from './shapeshift-details/shapeshift-details';
import { ShapeshiftShiftPage } from './shapeshift-shift/shapeshift-shift';

// Providers
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { ShapeshiftProvider } from '../../../providers/shapeshift/shapeshift';
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-shapeshift',
  templateUrl: 'shapeshift.html'
})
export class ShapeshiftPage {
  public shifts;
  public network: string;

  constructor(
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private shapeshiftProvider: ShapeshiftProvider,
    private timeProvider: TimeProvider
  ) {
    this.network = this.shapeshiftProvider.getNetwork();
    this.shifts = { data: {} };
    this.init();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded:  ShapeshiftPage');
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (_, type: string) => {
      if (type == 'NewBlock') this.updateShift(this.shifts);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private updateShift = _.debounce(
    shifts => {
      if (_.isEmpty(shifts.data)) return;
      _.forEach(shifts.data, dataFromStorage => {
        if (!this.checkIfShiftNeedsUpdate(dataFromStorage)) return;

        this.shapeshiftProvider.getStatus(
          dataFromStorage.address,
          (err, st) => {
            if (err) return;

            this.shifts.data[st.address].status = st.status;
            this.shifts.data[st.address].transaction = st.transaction || null;
            this.shifts.data[st.address].incomingCoin = st.incomingCoin || null;
            this.shifts.data[st.address].incomingType = st.incomingType || null;
            this.shifts.data[st.address].outgoingCoin = st.outgoingCoin || null;
            this.shifts.data[st.address].outgoingType = st.outgoingType || null;
            this.shapeshiftProvider.saveShapeshift(
              this.shifts.data[st.address],
              null,
              () => {
                this.logger.debug('Saved shift with status: ' + st.status);
              }
            );
          }
        );
      });
    },
    1000,
    {
      leading: true
    }
  );

  private checkIfShiftNeedsUpdate(shiftData) {
    // Continues normal flow (update shiftData)
    if (shiftData.status == 'received') {
      return true;
    }
    // Check if shiftData status FAILURE for 24 hours
    if (
      (shiftData.status == 'failed' || shiftData.status == 'no_deposits') &&
      this.timeProvider.withinPastDay(shiftData.date)
    ) {
      return true;
    }
    // If status is complete: do not update
    // If status fails or do not receive deposits for more than 24 hours: do not update
    return false;
  }

  private init(): void {
    this.shapeshiftProvider.getShapeshift((err, ss) => {
      if (err) this.logger.error(err);
      if (ss) this.shifts = { data: ss };
      this.updateShift(this.shifts);
    });
  }

  public update(): void {
    this.updateShift(this.shifts);
  }

  public openShiftModal(ssData) {
    let modal = this.modalCtrl.create(ShapeshiftDetailsPage, { ssData });

    modal.present();

    modal.onDidDismiss(() => {
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
