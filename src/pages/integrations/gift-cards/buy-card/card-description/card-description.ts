import { Component, Input } from '@angular/core';
import {
  CardConfig,
  CardName
} from '../../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'card-description',
  templateUrl: 'card-description.html'
})
export class CardDescriptionComponent {
  CardName = CardName;

  @Input()
  cardConfig: CardConfig;

  prepForMarkdown(markdown: string) {
    return markdown && markdown.replace(/•/gm, '-');
  }
}
