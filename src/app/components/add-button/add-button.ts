import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  host: { class: 'add-button' },
  selector: 'add-button',
  templateUrl: 'add-button.html',
  styleUrls: ['add-button.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddButtonComponent {}
