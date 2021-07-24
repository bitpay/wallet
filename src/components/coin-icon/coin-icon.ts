import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'coin-icon',
  templateUrl: 'coin-icon.html'
})
export class CoinIconComponent implements OnInit {
  @Input()
  coin: string;
  @Input()
  network: string;

  public assetUrl = 'assets/img/currencies/';

  ngOnInit() {
    if (this.network === 'testnet' && ['ltc'].includes(this.coin)) {
      this.assetUrl += 'testnet/';
    }

    this.assetUrl += `${this.coin}.svg`;
  }
}
