import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VocabService } from './vocab';

describe('VocabService', () => {
  let service: VocabService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VocabService
      ]
    });
    service = TestBed.inject(VocabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
