import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'amount-picker',
  templateUrl: 'amount-picker.html'
})
export class AmountPickerComponent {
  @Input()
  currency: string;

  @Input()
  supportedAmounts: number[];

  @Output()
  amountChange: EventEmitter<number> = new EventEmitter();

  amountIndex: number;

  ngOnInit() {
    this.amountIndex = getMiddleIndex(this.supportedAmounts);
    this.getAmount() && this.amountChange.emit(this.getAmount());
  }

  getAmount() {
    return (
      (this.supportedAmounts && this.supportedAmounts[this.amountIndex]) || 0
    );
  }

  shouldShowButton(value: number) {
    return (
      this.supportedAmounts && this.supportedAmounts[this.amountIndex + value]
    );
  }

  changeAmount(indexValue: number) {
    this.amountIndex = this.amountIndex + indexValue;
    this.amountChange.emit(this.getAmount());
  }
}

function getMiddleIndex(arr: number[]) {
  return arr && Math.floor(arr.length / 2);
}
