import { Component, Input } from '@angular/core';
import { CardConfig } from '../../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'redeem-instructions',
  templateUrl: 'redeem-instructions.html'
})
export class RedeemInstructionsComponent {
  @Input()
  cardConfig: CardConfig;

  @Input()
  params: any;
}
