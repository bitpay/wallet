import { Component, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { EventEmitter } from 'selenium-webdriver';

export interface PinButton {
  value: string;
  letters: string;
}

@Component({
  selector: 'pin-pad',
  template: `
    <ion-row *ngFor="let row of rows">
      <ion-col *ngFor="let button of row" (click)="onKeystroke(button.value)">
        <div>
          <span *ngIf="button.value !== 'delete'">{{button.value}}</span>
          <img *ngIf="button.value === 'delete'" src="assets/img/tail-left.svg">
        </div>
        <div>{{button.letters}}</div>
      </ion-col>
    </ion-row>
  `
})
export class PinPad {
  keystrokeSubject: Subject<string> = new Subject<string>();
  @Output()
  keystroke: Observable<string> = this.keystrokeSubject.asObservable();
  private buttons: PinButton[] = [
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
    },
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
    },
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
    },
    {
      value: '',
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
  ];

  rows: PinButton[][] = this.getRows();

  private getRows(): PinButton[][] {
    return this.buttons.reduce((rows, button, index) => {
      const rowNum = Math.ceil((index + 1) / 3);
      const rowIndex = rowNum - 1;
      const currentRow = rows[rowIndex];
      const updatedRow = !currentRow ? [button] : [...currentRow, button];
      rows[rowIndex] = updatedRow;
      return rows;
    }, []);
  }

  public onKeystroke(value: string): void {
    this.keystrokeSubject.next(value);
  }
}
