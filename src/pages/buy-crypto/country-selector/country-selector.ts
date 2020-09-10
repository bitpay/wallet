import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

// Providers
import { BitPayProvider } from '../../../providers/bitpay/bitpay';
import { Logger } from '../../../providers/logger/logger';
import { PersistenceProvider } from '../../../providers/persistence/persistence';

import * as _ from 'lodash';

@Component({
  selector: 'page-country-selector',
  templateUrl: 'country-selector.html'
})
export class CountrySelectorPage {
  public completeCountryList;
  public searchedCountry: string;
  public countryList;
  public commonCountriesList;
  public useAsModal;

  private PAGE_COUNTER: number = 3;
  private SHOW_LIMIT: number = 10;

  constructor(
    private logger: Logger,
    private viewCtrl: ViewController,
    private persistenceProvider: PersistenceProvider,
    private navParams: NavParams,
    private bitPayProvider: BitPayProvider
  ) {
    this.completeCountryList = [];
    this.countryList = [];
    this.commonCountriesList = [
      {
        name: 'United States',
        phonePrefix: '+1',
        shortCode: 'US',
        threeLetterCode: 'USA'
      }
    ];

    this.completeCountryList = this.navParams.data.countryList;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CountrySelectorPage');
  }

  ionViewWillEnter() {
    this.useAsModal = this.navParams.data.useAsModal;
    if (_.isEmpty(this.completeCountryList)) {
      this.bitPayProvider.get(
        '/countries',
        ({ data }) => {
          this.persistenceProvider.setCountries(data);
          this.completeCountryList = data;
          this.countryList = this.completeCountryList.slice(0, 20);
        },
        () => {}
      );
    } else {
      this.countryList = this.completeCountryList.slice(0, 20);
    }
  }

  public loadCountries(loading): void {
    if (this.countryList.length === this.completeCountryList.length) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.countryList = this.completeCountryList.slice(
        0,
        this.PAGE_COUNTER * this.SHOW_LIMIT
      );
      this.PAGE_COUNTER++;

      if (this.searchedCountry) this.findCountry();

      loading.complete();
    }, 300);
  }

  public save(selectedCountry): void {
    this.viewCtrl.dismiss({ selectedCountry });
  }

  public findCountry(): void {
    this.countryList = _.filter(this.completeCountryList, item => {
      var val = item.name;
      var val2 = item.threeLetterCode;
      return (
        _.includes(val.toLowerCase(), this.searchedCountry.toLowerCase()) ||
        _.includes(val2.toLowerCase(), this.searchedCountry.toLowerCase())
      );
    });
  }

  public close() {
    this.viewCtrl.dismiss();
  }
}
