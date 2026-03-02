import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class CardPhasesProvider {
  private allowedCountries = [
    'US',
    'AX',
    'AL',
    'AD',
    'AI',
    'AG',
    'AR',
    'AM',
    'AW',
    'AU',
    'AT',
    'AZ',
    'BS',
    'BH',
    'BB',
    'BY',
    'BE',
    'BZ',
    'BM',
    'BT',
    'BQ',
    'BA',
    'BR',
    'BN',
    'BG',
    'CA',
    'KY',
    'CL',
    'CN',
    'CO',
    'CR',
    'HR',
    'CW',
    'CY',
    'CZ',
    'DK',
    'DM',
    'DO',
    'EC',
    'SV',
    'EE',
    'FK',
    'FO',
    'FI',
    'FR',
    'GF',
    'GE',
    'DE',
    'GI',
    'GR',
    'GL',
    'GD',
    'GP',
    'GT',
    'GG',
    'GY',
    'HK',
    'HU',
    'IS',
    'ID',
    'IE',
    'IM',
    'IL',
    'IT',
    'JM',
    'JP',
    'JE',
    'JO',
    'KZ',
    'KR',
    'KW',
    'LV',
    'LI',
    'LT',
    'LU',
    'MK',
    'MY',
    'MV',
    'MT',
    'MQ',
    'MU',
    'MX',
    'MD',
    'MC',
    'MN',
    'ME',
    'MA',
    'NP',
    'NL',
    'NZ',
    'NI',
    'NO',
    'OM',
    'PA',
    'PG',
    'PY',
    'PE',
    'PH',
    'PL',
    'PT',
    'QA',
    'RE',
    'RO',
    'RU',
    'KN',
    'LC',
    'MF',
    'VC',
    'SM',
    'SA',
    'RS',
    'SC',
    'SG',
    'SX',
    'SK',
    'SI',
    'SB',
    'ZA',
    'ES',
    'SR',
    'SE',
    'CH',
    'TW',
    'TH',
    'TT',
    'TR',
    'TC',
    'UA',
    'AE',
    'GB',
    'UY',
    'VG'
  ];

  private otherCardCountries = ['AU', 'MX', 'CA'];
  constructor(private http: HttpClient) {}
  public getSession() {
    const url = 'https://bitpay.com/visa-api/session';
    return this.http.get(url);
  }

  public notify(email, country) {
    const url = 'https://bitpay.com/api/v2';
    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set(
      'Content-Type',
      'application/json; charset=utf-8'
    );
    const options = {
      headers: httpHeaders
    };

    let params = {
      email,
      country,
      cardType: country === 'US' ? 'USCard' : 'EuropeCard',
      created: new Date(),
      topic: 'debitCard'
    };

    if (this.otherCardCountries.includes(country)) {
      params = { ...params, cardType: 'OtherCard' };
    }

    const body = {
      method: 'interested',
      params: JSON.stringify(params)
    };
    return this.http.post(url, body, options);
  }

  public countries() {
    const url = 'https://bitpay.com/countries';

    return this.http.get(url).pipe(
      filter(c => this.allowedCountries.indexOf(c['shortCode']) !== -1),
      map(c => {
        return {
          label: c['name'],
          value: c['shortCode']
        };
      })
    );
  }
}
