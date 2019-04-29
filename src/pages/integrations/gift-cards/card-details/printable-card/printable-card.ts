import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormatCurrencyPipe } from '../../../../../pipes/format-currency';
import {
  CardConfig,
  GiftCard
} from '../../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'printable-card',
  template: `
    <canvas #canvas width="595" height="842"></canvas>
    <img
      #barcode
      *ngIf="card.barcodeImage"
      [src]="card.barcodeImage"
      (load)="drawBarcode()"
    />
    <img
      #cardImage
      crossorigin="Anonymous"
      [src]="cardConfig.cardImage"
      (load)="drawCardImage()"
    />
  `
})
export class PrintableCardComponent {
  @Input()
  cardConfig: CardConfig;

  @Input()
  card: GiftCard;

  ctx: CanvasRenderingContext2D;

  @ViewChild('canvas')
  canvas: ElementRef;
  @ViewChild('barcode')
  barcode: ElementRef;
  @ViewChild('cardImage')
  cardImage: ElementRef;

  constructor(private formatCurrencyPipe: FormatCurrencyPipe) {}

  ngAfterViewInit() {
    this.initializeCanvas();
    this.writeText();
  }

  public getPrintableImage() {
    this.drawCardImage();
    return this.ctx.canvas.toDataURL();
  }

  private initializeCanvas() {
    this.ctx = (this.canvas.nativeElement as HTMLCanvasElement).getContext(
      '2d'
    );
    this.ctx.textAlign = 'center';
  }

  private writeText() {
    const ctx = this.ctx;
    const x = this.ctx.canvas.width / 2;

    // Amount
    ctx.font = '30px Roboto';
    ctx.fillStyle = 'black';
    const amount = this.formatCurrencyPipe.transform(
      this.card.amount,
      this.card.currency
    );
    ctx.fillText(amount + '', x, yPos(0));

    const BARCODE_HEIGHT = 45;
    const barcodeHeight = this.card.barcodeImage ? BARCODE_HEIGHT : 0;

    // Labels
    ctx.font = '12px Roboto';
    ctx.fillStyle = 'gray';
    ctx.fillText('Claim Code', x, yPos(200));
    this.card.pin &&
      ctx.fillText('Pin', x, yPos(320 - BARCODE_HEIGHT + barcodeHeight));

    // Card Number & Pin
    ctx.font = '14px Roboto';
    ctx.fillStyle = 'black';
    ctx.fillText(
      this.card.claimCode,
      x,
      yPos(278 - BARCODE_HEIGHT + barcodeHeight)
    );
    this.card.pin &&
      ctx.fillText(
        this.card.pin,
        x,
        yPos(348 - BARCODE_HEIGHT + barcodeHeight)
      );

    // Terms
    const maxWidth = 320;
    const lineHeight = 11;
    const x2 = this.ctx.canvas.width / 2;
    const y = 400;
    ctx.font = '8px Roboto';
    ctx.fillStyle = '#a6a6a6';
    wrapText(
      ctx,
      this.cardConfig.terms,
      x2,
      yPos(y - BARCODE_HEIGHT + barcodeHeight),
      maxWidth,
      lineHeight
    );
  }

  drawBarcode() {
    const img = this.barcode.nativeElement;
    const ctx = this.ctx;
    const scale = 1;
    const image = img;
    var x1 = (ctx.canvas.width - image.width * scale) / 2;
    ctx.drawImage(
      image,
      x1,
      yPos(210),
      image.width * scale,
      image.height * scale
    );
  }

  drawCardImage() {
    const ctx = this.ctx;
    const image = this.cardImage.nativeElement;
    const scale = 0.55;
    const x = (ctx.canvas.width - image.width * scale) / 2;
    ctx.drawImage(
      image,
      x,
      yPos(35),
      image.width * scale,
      image.height * scale
    );
  }
}

function yPos(y) {
  const topPadding = 150;
  return topPadding + y;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}
