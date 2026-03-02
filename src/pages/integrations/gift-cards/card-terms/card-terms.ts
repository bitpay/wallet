import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'card-terms',
  templateUrl: 'card-terms.html'
})
export class CardTermsComponent implements OnInit {
  cardConfig: CardConfig;
  cardTerms: string;

  @ViewChild(MarkdownComponent)
  markdown: MarkdownComponent;

  @Input()
  cardName: string;

  constructor(private giftCardProvider: GiftCardProvider) {}

  async ngOnInit() {
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.cardName);
    const terms = this.cardConfig.terms;
    this.cardTerms =
      terms &&
      linkifyTerms(terms)
        .replace('Terms and Conditions', '')
        .replace(/\n•/gm, '')
        .replace(/\*/gm, '&ast;')
        .replace(/[ ]{5}/gm, '');
  }
}

function linkifyUrl(url: string) {
  return `[${url}](https://${url})`;
}

function linkifyTerms(terms: string) {
  const urlRegex = /[\w\/\-\:]+\.[\w\/\-\:]+((\.[\w\/\-\:]+)?)+/gm;
  const allUrls = terms.match(urlRegex) || [];
  const urlsWithoutProtocol = allUrls.filter(
    m => m && !m.startsWith('http') && !m.startsWith('www.') && m.length > 3
  );
  const termsWithPlaceholders = urlsWithoutProtocol.reduce(
    (newTerms, url, index) => newTerms.replace(url, getPlaceholder(index)),
    terms
  );
  const linkifiedTerms = urlsWithoutProtocol.reduce(
    (newTerms, url, index) =>
      newTerms.replace(getPlaceholder(index), linkifyUrl(url)),
    termsWithPlaceholders
  );
  return linkifiedTerms;
}

function getPlaceholder(index: number): string {
  return `---${index}`;
}
