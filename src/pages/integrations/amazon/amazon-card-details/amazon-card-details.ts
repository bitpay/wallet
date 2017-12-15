import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

@Component({
  selector: 'page-amazon-card-details',
  templateUrl: 'amazon-card-details.html',
})
export class AmazonCardDetailsPage {

  constructor(
    private logger: Logger,
    private viewCtrl: ViewController
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AmazonCardDetailsPage');
  }

  public goBack(): void {
    this.viewCtrl.dismiss();
  }

}
