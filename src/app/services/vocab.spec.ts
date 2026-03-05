import { TestBed } from '@angular/core/testing';

import { Vocab } from './vocab';

describe('Vocab', () => {
  let service: Vocab;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Vocab);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
