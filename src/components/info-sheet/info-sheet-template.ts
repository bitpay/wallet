import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';

export enum AlertType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  danger = 'danger'
}

@Component({
  selector: 'info-sheet-template',
  templateUrl: 'info-sheet-template.html'
})
export class InfoSheetTemplate {
  @Input() type: AlertType = AlertType.info;
  @Input() option: boolean;

  private dismissSubject = new Subject<void>();
  public onDismiss = this.dismissSubject.asObservable();

  dismiss(option) {
    this.dismissSubject.next(option);
  }
}
