import { Component, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { PersistenceProvider } from '../../providers';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  private showPriceChart: boolean;
  @ViewChild('priceCard')
  priceCard;
  constructor(private persistenceProvider: PersistenceProvider) { }

  ionViewWillEnter() {
    this.checkPriceChart();
  }

  private updateCharts() {
    if (this.showPriceChart && this.priceCard) this.priceCard.updateCharts();
  }

  private debounceRefreshHomePage = _.debounce(
    async () => {
    },
    5000,
    {
      leading: true
    }
  );

  private checkPriceChart() {
    this.persistenceProvider.getHiddenFeaturesFlag().then(res => {
      this.showPriceChart = res === 'enabled' ? true : false;
      this.updateCharts();
    });
  }

  public doRefresh(refresher): void {
    this.debounceRefreshHomePage();
    setTimeout(() => {
      this.updateCharts();
      refresher.complete();
    }, 2000);
  }
}
