import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from "@angular/core";


@Injectable()
export class CardPhasesProvider {
  constructor(private http: HttpClient) {

  }
  public getSession() {
    return this.http.get(`https://bitpay.com/visa-api/session`);
  }

  public notify(csrfToken, body) {

    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set('x-csrf-token', csrfToken);
    const options = {
      headers: httpHeaders
    };
    return this.http.post(`https://bitpay.com/visa-api/interested`, body, options);
  }
}