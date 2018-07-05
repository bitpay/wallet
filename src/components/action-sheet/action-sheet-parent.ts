import { ViewChild } from '@angular/core';
import { ActionSheetComponent } from './action-sheet';

export type dismissFunction = (data?: any) => void;
export class ActionSheetParent {
  public componentRef: any;
  public sheetType: string;
  public sheetTitle: string;
  public dismissFunction: dismissFunction;

  @ViewChild(ActionSheetComponent) actionSheet: ActionSheetComponent;

  public async present(): Promise<void> {
    return this.actionSheet.present(this.componentRef);
  }

  public async dismiss(data?: any): Promise<void> {
    await this.actionSheet.dismiss();
    this.dismissFunction && this.dismissFunction(data);
  }

  public onDidDismiss(func: dismissFunction) {
    this.dismissFunction = func;
  }
}
