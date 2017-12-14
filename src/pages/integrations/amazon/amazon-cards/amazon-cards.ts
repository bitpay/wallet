import { Component } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

@Component({
  selector: 'page-amazon-cards',
  templateUrl: 'amazon-cards.html',
})
export class AmazonCardsPage {

  constructor(
    private logger: Logger
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AmazonCardsPage');
  }

}
