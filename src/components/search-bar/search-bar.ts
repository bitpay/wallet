import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Content } from 'ionic-angular';

@Component({
  host: { class: 'search-bar' },
  selector: 'search-bar',
  template: `
    <ion-input [placeholder]="placeholder" (input)="onSearch($event)"></ion-input>
  `
})
export class SearchBarComponent implements OnInit {
  @Input()
  placeholder: string;

  @Input()
  scrollArea: Content;

  @Output()
  search: EventEmitter<string> = new EventEmitter();

  ngOnInit() {
    this.scrollArea &&
      this.scrollArea.ionScroll.subscribe(() => {
        const activeElement = document.activeElement as HTMLElement;
        activeElement && activeElement.blur && activeElement.blur();
      });
  }

  onSearch($event) {
    this.search.emit($event);
  }
}
