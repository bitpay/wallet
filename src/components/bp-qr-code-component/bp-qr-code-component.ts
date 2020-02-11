import { Component, Input } from '@angular/core';
import { CurrencyProvider } from '../../providers/currency/currency';

@Component({
  selector: 'bp-qr-code-component',
  templateUrl: 'bp-qr-code-component.html'
})
export class BpQrCodeComponent {
  @Input()
  data;
  @Input()
  coin;

  constructor(private currencyProvider: CurrencyProvider) {}

  public isERCToken(coin) {
    return this.currencyProvider.isERCToken(coin);
  }
}
