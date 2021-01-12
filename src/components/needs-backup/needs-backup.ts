import { Component, ComponentRef } from '@angular/core';
import { InfoSheetComponent } from '../../components/info-sheet/info-sheet';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

// Providers
import { InfoSheetType } from '../../providers/action-sheet/action-sheet';
import { DomProvider } from '../../providers/dom/dom';

@Component({
  selector: 'needs-backup',
  templateUrl: 'needs-backup.html'
})
export class NeedsBackupComponent extends ActionSheetParent {
  constructor(private domProvider: DomProvider) {
    super();
  }

  public createInfoSheet(type: InfoSheetType, params?): InfoSheetComponent {
    return this.setupSheet<InfoSheetComponent>(InfoSheetComponent, type, params)
      .instance;
  }

  private setupSheet<T extends ActionSheetParent>(
    componentType: { new (...args): T },
    sheetType?: string,
    params?
  ): ComponentRef<T> {
    const sheet = this.domProvider.appendComponentToBody<T>(componentType);
    sheet.instance.componentRef = sheet;
    sheet.instance.sheetType = sheetType;
    sheet.instance.params = params;
    return sheet;
  }
}
