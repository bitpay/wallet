import { Component, Input } from '@angular/core';
import { CardName } from '../../../../../providers/gift-card/gift-card';

@Component({
  selector: 'sales-pitch',
  templateUrl: 'sales-pitch.html'
})
export class SalesPitchComponent {
  CardName = CardName;

  @Input()
  cardName: string;
}
