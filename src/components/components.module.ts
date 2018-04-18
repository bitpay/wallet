import { NgModule } from '@angular/core';
import {
  ExpandableHeaderComponent,
  ExpandableHeaderFooterComponent,
  ExpandableHeaderPrimaryComponent
} from './expandable-header/expandable-header';
@NgModule({
  declarations: [
    ExpandableHeaderComponent,
    ExpandableHeaderFooterComponent,
    ExpandableHeaderPrimaryComponent
  ],
  imports: [],
  exports: [
    ExpandableHeaderComponent,
    ExpandableHeaderFooterComponent,
    ExpandableHeaderPrimaryComponent
  ]
})
export class ComponentsModule {}
