import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';
import { timer } from 'rxjs';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';

@Directive({
  selector: '[externalize-links]'
})
export class ExternalizeLinks implements AfterViewInit, OnDestroy {
  constructor(
    private element: ElementRef,
    private externalLinkProvider: ExternalLinkProvider
  ) {}

  async ngAfterViewInit() {
    await timer(500).toPromise();
    this.getAllLinks().forEach(aTag =>
      aTag.addEventListener('click', this.handleClick.bind(this))
    );
  }

  ngOnDestroy() {
    this.getAllLinks().forEach(aTag => {
      aTag.removeEventListener('click', this.handleClick.bind(this));
    });
  }

  private getAllLinks() {
    return this.element.nativeElement.querySelectorAll('a');
  }

  private handleClick(event) {
    event.preventDefault();
    this.openExternalLink(event.srcElement.href);
  }

  private openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }
}
