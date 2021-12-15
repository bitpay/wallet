import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from '../pages/home/home';
import { ScanPage } from '../pages/scan/scan';
import { AddressbookPage } from '../pages/settings/addressbook/addressbook';
import { SettingsPage } from '../pages/settings/settings';
import { WalletsPage } from '../pages/wallets/wallets';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        component: HomePage
      },
      {
        path: 'wallets',
        component: WalletsPage
      },
      {
        path: 'scan',
        component: ScanPage
      },
      {
        path: 'address-book',
        component: AddressbookPage,
      },
      {
        path: 'setting',
        component: SettingsPage
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
