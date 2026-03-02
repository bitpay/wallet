import { Component, Input } from '@angular/core';
import { hasPromotion } from '../../../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'card-description',
  templateUrl: 'card-description.html'
})
export class CardDescriptionComponent {
  @Input()
  cardConfig: CardConfig;

  hasPromotion = hasPromotion;

  prepForMarkdown(markdown: string) {
    return markdown && markdown.replace(/•/gm, '-');
  }
}
