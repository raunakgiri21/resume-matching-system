import { TestBed } from '@angular/core/testing';

import { Placements } from './placements';

describe('Placements', () => {
  let service: Placements;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Placements);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
