import { Component, Input, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

export interface PinButton {
  value: string;
  letters: string;
}

@Component({
  selector: 'pin-pad',
  template: `
    <ion-row *ngFor="let row of buttonRows">
      <ion-col
        *ngFor="let button of row"
        (click)="onKeystroke(button.value)"
        [ngClass]="{ disabled: isValueDisabled(button.value) }"
        tappable
      >
        <div class="buttons-container" [ngSwitch]="button.value">
          <span *ngSwitchCase="'delete'">
            <img *ngIf="type === 'pin'" src="assets/img/tail-left.svg" />
            <img
              class="amount-delete"
              *ngIf="type === 'amount'"
              src="assets/img/icon-delete.svg"
            />
          </span>
          <span *ngSwitchCase="'.'">
            <span *ngIf="type === 'amount'">.</span>
          </span>
          <span *ngSwitchDefault>{{ button.value }}</span>
        </div>
        <div class="letters" *ngIf="type === 'pin'">{{ button.letters }}</div>
      </ion-col>
    </ion-row>
  `
})
export class PinPad {
  @Input()
  integersOnly: boolean = false;

  @Input()
  type: 'pin' | 'amount';

  keystrokeSubject: Subject<string> = new Subject<string>();

  @Output()
  keystroke: Observable<string> = this.keystrokeSubject.asObservable();
  public buttonRows: PinButton[][] = [
    [
      {
        value: '1',
        letters: ''
      },
      {
        value: '2',
        letters: 'ABC'
      },
      {
        value: '3',
        letters: 'DEF'
      }
    ],
    [
      {
        value: '4',
        letters: 'GHI'
      },
      {
        value: '5',
        letters: 'JKL'
      },
      {
        value: '6',
        letters: 'MNO'
      }
    ],
    [
      {
        value: '7',
        letters: 'PQRS'
      },
      {
        value: '8',
        letters: 'TUV'
      },
      {
        value: '9',
        letters: 'WXYZ'
      }
    ],
    [
      {
        value: '.',
        letters: ''
      },
      {
        value: '0',
        letters: ''
      },
      {
        value: 'delete',
        letters: ''
      }
    ]
  ];

  public onKeystroke(value: string): void {
    if (this.isValueDisabled(value)) {
      return;
    }
    this.keystrokeSubject.next(value);
  }

  public isValueDisabled(value: string) {
    return value === '.' && this.integersOnly;
  }
}
