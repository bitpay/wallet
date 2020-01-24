import { Component, Input } from '@angular/core';

@Component({
  selector: 'coin-icon',
  templateUrl: 'coin-icon.html'
})
export class CoinIconComponent {
  @Input()
  coin: string;
  @Input()
  network: string;

  constructor() {}
}
