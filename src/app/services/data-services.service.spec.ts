import { TestBed, inject } from '@angular/core/testing';

import { DataServicesService } from './data-services.service';

describe('DataServicesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataServicesService]
    });
  });

  it('should be created', inject([DataServicesService], (service: DataServicesService) => {
    expect(service).toBeTruthy();
  }));
});
