import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { RateProvider } from '../../../providers/rate/rate';
import * as _ from 'lodash';

@Component({
  selector: 'page-alt-currency',
  templateUrl: 'alt-currency.html',
})
export class AltCurrencyPage {

  public completeAlternativeList: Array<any>;
  public searchedAltCurrency: string;
  public altCurrencyList: Array<any>;
  public loading: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private rate: RateProvider) {
    this.completeAlternativeList = [];
    this.altCurrencyList = [];
    this.rate.updateRates().then((data) => {
      this.completeAlternativeList = this.rate.listAlternatives(true);
      this.altCurrencyList = this.completeAlternativeList;
    })
    .catch((error) => {
      console.log("Error: ", error);
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AltCurrencyPage');
  }

  goBack() {
    this.navCtrl.pop();
  }

  altSelected(alt: any) {
    console.log("Alt selected: ", alt);
  }

  findCurrency(searchedAltCurrency: string) {
    this.altCurrencyList = _.filter(this.completeAlternativeList, (item) => {
      var val = item.name
      var val2 = item.isoCode;
      return _.includes(val.toLowerCase(), searchedAltCurrency.toLowerCase()) || _.includes(val2.toLowerCase(), searchedAltCurrency.toLowerCase());
    })
  }

}
