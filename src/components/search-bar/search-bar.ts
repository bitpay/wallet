import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Content } from 'ionic-angular';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  host: { class: 'search-bar' },
  selector: 'search-bar',
  template: `
    <ion-input
      [placeholder]="placeholder"
      (input)="onSearch($event)"
    ></ion-input>
  `
})
export class SearchBarComponent implements OnInit {
  @Input()
  placeholder: string;

  @Input()
  scrollArea: Content;

  @Output()
  search: EventEmitter<string> = new EventEmitter<string>();

  debouncer: Subject<string> = new Subject<string>();

  ngOnInit() {
    this.debouncer
      .pipe(debounceTime(200))
      .subscribe(value => this.search.emit(value));

    this.scrollArea &&
      this.scrollArea.ionScroll.subscribe(() => {
        const activeElement = document.activeElement as HTMLElement;
        activeElement && activeElement.blur && activeElement.blur();
      });
  }

  onSearch($event) {
    this.debouncer.next($event);
  }
}
