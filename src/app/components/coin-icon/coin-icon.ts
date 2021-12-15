import { Component, Input } from '@angular/core';

@Component({
  selector: 'coin-icon',
  templateUrl: 'coin-icon.html',
  styleUrls: ['coin-icon.scss'],
})
export class CoinIconComponent {
  @Input()
  coin: string;
  @Input()
  network: string;

  constructor() {}
}
