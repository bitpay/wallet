import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'apx-chart',
  templateUrl: './chart-component.html'
})
export class ChartComponent implements OnInit, OnChanges {
  @Input() chart;
  @Input() annotations;
  @Input() colors: string[];
  @Input() dataLabels;
  @Input() series;
  @Input() stroke;
  @Input() labels: string[];
  @Input() legend;
  @Input() fill;
  @Input() tooltip;
  @Input() plotOptions;
  @Input() responsive;
  @Input() markers;
  @Input() xaxis;
  @Input() yaxis;
  @Input() grid;
  @Input() states;
  @Input() title;
  @Input() subtitle;
  @Input() theme;

  @ViewChild('chart') private chartElement: ElementRef;
  private chartObj: any;

  ngOnInit() {
    setTimeout(() => {
      this.createElement();
    }, 0);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    setTimeout(() => {
      this.createElement();
    }, 0);
  }

  private createElement() {
    const options: any = {};

    if (this.annotations) {
      options.annotations = this.annotations;
    }
    if (this.chart) {
      options.chart = this.chart;
    }
    if (this.colors) {
      options.colors = this.colors;
    }
    if (this.dataLabels) {
      options.dataLabels = this.dataLabels;
    }
    if (this.series) {
      options.series = this.series;
    }
    if (this.stroke) {
      options.stroke = this.stroke;
    }
    if (this.labels) {
      options.labels = this.labels;
    }
    if (this.legend) {
      options.legend = this.legend;
    }
    if (this.fill) {
      options.fill = this.fill;
    }
    if (this.tooltip) {
      options.tooltip = this.tooltip;
    }
    if (this.plotOptions) {
      options.plotOptions = this.plotOptions;
    }
    if (this.responsive) {
      options.responsive = this.responsive;
    }
    if (this.markers) {
      options.markers = this.markers;
    }
    if (this.xaxis) {
      options.xaxis = this.xaxis;
    }
    if (this.yaxis) {
      options.yaxis = this.yaxis;
    }
    if (this.grid) {
      options.grid = this.grid;
    }
    if (this.states) {
      options.states = this.states;
    }
    if (this.title) {
      options.title = this.title;
    }
    if (this.subtitle) {
      options.subtitle = this.subtitle;
    }
    if (this.theme) {
      options.theme = this.theme;
    }

    if (this.chartObj) {
      this.chartObj.destroy();
    }

    this.chartObj = new ApexCharts(this.chartElement.nativeElement, options);

    this.render();
  }

  public render(): Promise<void> {
    return this.chartObj.render();
  }

  public updateOptions(
    options: any,
    redrawPaths: boolean,
    animate: boolean,
    updateSyncedCharts: boolean
  ): Promise<void> {
    return this.chartObj.updateOptions(
      options,
      redrawPaths,
      animate,
      updateSyncedCharts
    );
  }

  public updateSeries(newSeries, animate: boolean) {
    this.chartObj.updateSeries(newSeries, animate);
  }

  public toggleSeries(seriesName: string) {
    this.chartObj.toggleSeries(seriesName);
  }

  public addXaxisAnnotation(
    options: any,
    pushToMemory?: boolean,
    context?: any
  ) {
    this.chartObj.addXaxisAnnotation(options, pushToMemory, context);
  }

  public addYaxisAnnotation(
    options: any,
    pushToMemory?: boolean,
    context?: any
  ) {
    this.chartObj.addYaxisAnnotation(options, pushToMemory, context);
  }

  public addPointAnnotation(
    options: any,
    pushToMemory?: boolean,
    context?: any
  ) {
    this.chartObj.addPointAnnotation(options, pushToMemory, context);
  }

  public addText(options: any, pushToMemory?: boolean, context?: any) {
    this.chartObj.addText(options, pushToMemory, context);
  }

  public dataURI() {
    return this.chartObj.dataURI();
  }
}
