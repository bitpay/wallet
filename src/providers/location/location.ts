import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class LocationProvider {
  public countryPromise: Promise<string>;
  constructor(public http: HttpClient) {
    this.getCountry();
  }

  getCountry(): Promise<string> {
    this.countryPromise = this.countryPromise
      ? this.countryPromise
      : this.http
          .get('https://bitpay.com/wallet-card/location')
          .map((res: { country: string }) => res.country)
          .toPromise()
          .catch(_ => 'US');
    return this.countryPromise;
  }
}
