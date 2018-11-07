import { Component } from '@angular/core';
import { CardName } from '../../../../providers/gift-card/gift-card.types';
import { offeredGiftCards } from '../../../../providers/gift-card/offered-cards';

@Component({
  selector: 'preload-card-images',
  template: `
    <img style="display: none" *ngFor="let image of cardImages" [src]="image">
  `
})
export class PreloadCardImages {
  cardImages: string[] = [];
  constructor() {
    this.cardImages = this.getGiftCardImages();
  }

  getGiftCardImages() {
    const imagesPerCard = offeredGiftCards
      .filter(c => c.name !== CardName.venue)
      .map(c => [c.icon, c.cardImage]);
    return imagesPerCard.reduce(
      (allImages, imagesPerCard) => [...allImages, ...imagesPerCard],
      []
    );
  }
}
