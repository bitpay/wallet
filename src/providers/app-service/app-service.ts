import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class AppService {
  private jsonPath: string = '../assets/appConfig.json';

  constructor(public http: Http) {}

  getCommitHash() {
    return this.http.get(this.jsonPath)
      .map((res:Response) => res.json().commitHash);
  }

  getName() {
    return this.http.get(this.jsonPath)
      .map((res:Response) => res.json().nameCase);
  }

  getDescription() {
    return this.http.get(this.jsonPath)
      .map((res:Response) => res.json().description);
  }

  getVersion() {
    return this.http.get(this.jsonPath)
      .map((res:Response) => res.json().version);
  }

}
