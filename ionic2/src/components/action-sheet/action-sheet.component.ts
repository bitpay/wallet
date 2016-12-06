import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'action-sheet',
  template: `
  <div
    class="bp-action-sheet__backdrop"
    [ngClass]="{'fade-in': shown}"
    (click)="hide()">
  </div>
  <div class="bp-action-sheet__sheet" [ngClass]="{'slide-up': shown}">
    <ng-content></ng-content>
  </div>
  `
})
export class ActionSheetComponent {
  // scope.$watch('show', function() {
  //   if(scope.show) {
  //     $timeout(function() { scope.revealMenu = true; }, 100);
  //   } else {
  //     scope.revealMenu = false;
  //   }
  // });
  @Input() shown: boolean = false;
  @Output() onHide: EventEmitter<boolean> = new EventEmitter();

  hide() {
    this.shown = false;
    this.onHide.emit(true);
  }
  show() {
    this.shown = true
  }

}
