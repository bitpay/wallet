import { Component, Input } from '@angular/core';
import {
  CardConfig,
  CardName
} from '../../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'redeem-instructions',
  templateUrl: 'redeem-instructions.html'
})
export class RedeemInstructionsComponent {
  CardName = CardName;

  @Input()
  cardConfig: CardConfig;

  @Input()
  params: any;
}
