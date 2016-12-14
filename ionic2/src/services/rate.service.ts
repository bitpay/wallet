import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import lodash from 'lodash';

@Injectable()
export class RateService {

UNAVAILABLE_ERROR: string = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
UNSUPPORTED_CURRENCY_ERROR: string = 'Currency not supported';

opts: any;
httprequest: any;
SAT_TO_BTC: number;
BTC_TO_SAT: number;

_isAvailable: boolean;
_rates: any;
_alternatives: any[];
_queued: any[];

constructor(
  public http: Http,
  public ngZone: NgZone
) {

  this.SAT_TO_BTC = 1 / 1e8;
  this.BTC_TO_SAT = 1e8;


  this._isAvailable = false;
  this._rates = {};
  this._alternatives = [];
  this._queued = [];

  this.fetchCurrencies();
}

fetchCurrencies() {
  let backoffSeconds = 5;
  let updateFrequencySeconds = 5 * 60;
  let rateServiceUrl = 'https://bitpay.com/api/rates';

  let retrieve = () => {
    //log.info('Fetching exchange rates');
    this.http.get(rateServiceUrl).toPromise().then((res) => {
      lodash.each(res, (currency) => {
        this._rates[currency.code] = currency.rate;
        this._alternatives.push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });
      this._isAvailable = true;
      lodash.each(this._queued, (callback) => {
        setTimeout(callback, 1);
      });
      this.ngZone.runOutsideAngular(() => {
        setTimeout(retrieve, updateFrequencySeconds * 1000);
      });
    }).catch((err) => {
      //log.debug('Error fetching exchange rates', err);
      setTimeout(() => {
        backoffSeconds *= 1.5;
        retrieve();
      }, backoffSeconds * 1000);
      return;
    });
  };

  retrieve();
};

getRate(code) {
  return this._rates[code];
};

getAlternatives() {
  return this._alternatives;
};

isAvailable() {
  return this._isAvailable;
};

whenAvailable(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

toFiat(satoshis, code) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code);
};

fromFiat(amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code) * this.BTC_TO_SAT;
};

listAlternatives() {
  if (!this.isAvailable()) {
    return [];
  }

  return lodash.map(this.getAlternatives(), (item) => {
    return {
      name: item.name,
      isoCode: item.isoCode
    };
  });
}
}
