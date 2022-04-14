import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';

export enum AlertType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  danger = 'danger',
  love = 'love',
  safeguard = 'safeguard'
}

@Component({
  selector: 'info-sheet-template',
  templateUrl: 'info-sheet-template.html',
})
export class InfoSheetTemplate {
  @Input()
  type: AlertType | any;

  @Input()
  sheetSecondBtnGroup: any = 'false';

  @Input()
  isShowTitle: any = 'true';

  private dismissSubject = new Subject<void>();
  public onDismiss = this.dismissSubject.asObservable();

  dismiss(option) {
    this.dismissSubject.next(option);
  }
}
