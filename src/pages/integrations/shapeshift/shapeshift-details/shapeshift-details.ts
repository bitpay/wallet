import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-details',
  templateUrl: 'shapeshift-details.html',
})
export class ShapeshiftDetailsPage {

  public ssData: any

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private shapeshiftProvider: ShapeshiftProvider,
    private viewCtrl: ViewController,
    private logger: Logger
  ) {
    this.ssData = this.navParams.data.ssData;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ShapeshiftDetailsPage');
  }

  public remove() {
    this.shapeshiftProvider.saveShapeshift(this.ssData, {
      remove: true
    }, (err) => {
      this.close();
    });
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public openTransaction(id: string) {
    var url;
    if (this.ssData.outgoingType.toUpperCase() == 'BTC') {
      url = "https://insight.bitpay.com/tx/" + id;
    } else if (this.ssData.outgoingType.toUpperCase() == 'BCH') {
      url = "https://bch-insight.bitpay.com/#/tx/" + id;
    } else {
      return;
    }
    this.externalLinkProvider.open(url);
  }

}
