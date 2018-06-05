import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-details',
  templateUrl: 'shapeshift-details.html'
})
export class ShapeshiftDetailsPage {
  public ssData;

  private defaults;

  constructor(
    private configProvider: ConfigProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private shapeshiftProvider: ShapeshiftProvider,
    private viewCtrl: ViewController,
    private logger: Logger
  ) {
    this.defaults = this.configProvider.getDefaults();
    this.ssData = this.navParams.data.ssData;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ShapeshiftDetailsPage');
  }

  public remove() {
    this.shapeshiftProvider.saveShapeshift(
      this.ssData,
      {
        remove: true
      },
      () => {
        this.close();
      }
    );
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public openTransaction(id: string) {
    var url;
    if (this.ssData.outgoingType.toUpperCase() == 'BTC') {
      url = 'https://' + this.defaults.blockExplorerUrl.btc + '/tx/' + id;
    } else if (this.ssData.outgoingType.toUpperCase() == 'BCH') {
      url = 'https://' + this.defaults.blockExplorerUrl.bch + '/tx/' + id;
    } else {
      return;
    }
    this.externalLinkProvider.open(url);
  }
}
