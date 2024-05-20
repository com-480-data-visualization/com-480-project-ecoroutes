import { TestBed } from '@angular/core/testing';

import { BarPlotService } from './bar-plot.service';

describe('BarPlotService', () => {
  let service: BarPlotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarPlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
