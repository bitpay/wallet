import { Component, ViewChild } from '@angular/core';
import { HomePage } from '../home/home';
import { ScanPage } from '../scan/scan';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  @ViewChild('tabs') tabs;

  homeRoot = HomePage;
  scanRoot = ScanPage;
}
