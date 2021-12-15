import { Injectable } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({
    providedIn: "root"
})
export class PreviousRouteService {

    private previousUrl: string;
    private currentUrl: string;

    constructor(private router: Router) {

        this.currentUrl = this.router.url;
        this.previousUrl = null;

        this.router.events
                    .pipe(filter((event: any) => event instanceof RoutesRecognized), pairwise())
                    .subscribe((events: RoutesRecognized[]) => {
                        this.previousUrl = events[0].urlAfterRedirects;
                        this.currentUrl = events[1].urlAfterRedirects;
                    });

    }

    public getPreviousUrl() {
        return this.previousUrl;
    }
    public getCurrentUrl() {
        return this.currentUrl;
    }
};