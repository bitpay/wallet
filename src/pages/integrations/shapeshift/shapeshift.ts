import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Pages
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

  private updateShift(shifts: any): void {
    if (_.isEmpty(shifts.data)) return;
    _.forEach(shifts.data, (dataFromStorage: any) => {
      this.shapeshiftProvider.getStatus(dataFromStorage.address, (err: any, st: any) => {
        if (err) return;

        this.shifts.data[st.address]['status'] = st.status;
        this.shapeshiftProvider.saveShapeshift(this.shifts.data[st.address], null, (err: any) => {
          this.logger.debug("Saved shift with status: " + st.status);
        });
      });
    });
  }

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

  public goTo(page: string): void {
    switch (page) {
      case 'Shift':
        this.navCtrl.push(ShapeshiftShiftPage);
        break;
    }
  }

}
