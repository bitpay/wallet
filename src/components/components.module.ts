import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import {
  ExpandableHeaderComponent,
  ExpandableHeaderFooterComponent,
  ExpandableHeaderPrimaryComponent
} from './expandable-header/expandable-header';
import { MiniModalComponent } from './mini-modal/mini-modal';
@NgModule({
  declarations: [
    ExpandableHeaderComponent,
    ExpandableHeaderFooterComponent,
    ExpandableHeaderPrimaryComponent,
    MiniModalComponent
  ],
  imports: [IonicModule.forRoot({}), TranslateModule.forRoot({})],
  exports: [
    ExpandableHeaderComponent,
    ExpandableHeaderFooterComponent,
    ExpandableHeaderPrimaryComponent,
    MiniModalComponent
  ],
  entryComponents: [MiniModalComponent]
})
export class ComponentsModule {}
