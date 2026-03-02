import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class DownloadProvider {
  constructor(private logger: Logger) {
    this.logger.debug('DownloadProvider initialized');
  }

  public download(ew, fileName: string): Promise<any> {
    return new Promise(async resolve => {
      await Observable.timer(1000).toPromise();
      let a = document.createElement('a');
      let blob = this.newBlob(ew, 'text/plain;charset=utf-8');
      let url = window.URL.createObjectURL(blob);

      document.body.appendChild(a);

      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      return resolve();
    });
  }

  public newBlob(data, datatype: string) {
    let out;
    try {
      this.logger.debug('Trying to blob data');
      out = new Blob([data], {
        type: datatype
      });
    } catch (e) {
      if (e.name == 'InvalidStateError') {
        // InvalidStateError (tested on FF13 WinXP)
        this.logger.debug('Invalid state Error: Trying to blob data again');
        out = new Blob([data], {
          type: datatype
        });
      } else {
        // We're screwed, blob constructor unsupported entirely
        this.logger.error('Error: blob constructor unsupported entirely');
      }
    }
    return out;
  }
}
