import { TestBed } from '@angular/core/testing';

import { MapRoutesService } from './map-routes.service';

describe('MapRoutesService', () => {
  let service: MapRoutesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapRoutesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
