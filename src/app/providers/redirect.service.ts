import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import _ from 'lodash';
import { PreviousRouteService } from './previous-route/previous-route';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {

  constructor(
    private router: Router,
    private previousRouteService: PreviousRouteService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const previousUrl = this.previousRouteService.getPreviousUrl();
    const currentUrl = this.previousRouteService.getCurrentUrl();
    if (currentUrl == '/lock-method') {
      if (previousUrl == '/import-wallet' || previousUrl == '/select-currency') {
        this.router.navigate(['/feature-education'], { replaceUrl: true });
      }
    }
    return true;
  }
}