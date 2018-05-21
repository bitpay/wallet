import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import { CustomModalComponent } from './custom-modal/custom-modal';
import {
  ExpandableHeaderComponent,
  ExpandableHeaderFooterComponent,
  ExpandableHeaderPrimaryComponent
} from './expandable-header/expandable-header';
@NgModule({
  declarations: [
    ExpandableHeaderComponent,
    ExpandableHeaderFooterComponent,
    ExpandableHeaderPrimaryComponent,
    CustomModalComponent
  ],
  imports: [IonicModule.forRoot({}), TranslateModule.forRoot({})],
  exports: [
    ExpandableHeaderComponent,
    ExpandableHeaderFooterComponent,
    ExpandableHeaderPrimaryComponent,
    CustomModalComponent
  ],
  entryComponents: [CustomModalComponent]
})
export class ComponentsModule {}
