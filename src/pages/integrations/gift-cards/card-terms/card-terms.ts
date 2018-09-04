import { Component, Input } from '@angular/core';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { CardName } from '../../../../providers/gift-card/gift-card';

@Component({
  selector: 'card-terms',
  templateUrl: 'card-terms.html'
})
export class CardTermsComponent {
  CardName = CardName;

  @Input()
  cardName: CardName;

  constructor(private externalLinkProvider: ExternalLinkProvider) {}

  openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }
}
