import { Component, Input } from '@angular/core';

@Component({
  selector: 'address-item-content',
  templateUrl: 'address-item-content.component.html'
})
export class AddressItemContent {
  @Input()
  entry: any;

  public getEmail(): void {
    return this.entry.email;
  }

  public getName(): void {
    return this.entry.name;
  }
}
