import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

class MockSpeechSynthesisUtterance {
  lang = '';
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public text: string) {}
}

const speakMock = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
  queueMicrotask(() => utterance.onend?.());
});
const cancelMock = vi.fn();

Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  configurable: true,
  value: MockSpeechSynthesisUtterance
});

Object.defineProperty(globalThis, 'speechSynthesis', {
  configurable: true,
  value: {
    cancel: cancelMock,
    speak: speakMock
  }
});

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    speakMock.mockClear();
    cancelMock.mockClear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have JP Practice in the toolbar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar span')?.textContent).toContain('JP Practice');
  });

  it('shows the previous button only when random mode is off', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.vocab.set([
      {
        group: 'V',
        japaneseForm: 'いく',
        dictionaryForm: 'いく',
        teForm: 'いって',
        naiForm: 'いかない',
        taForm: 'いった',
        meaning: 'go',
        lesson: 1
      },
      {
        group: 'V',
        japaneseForm: 'くる',
        dictionaryForm: 'くる',
        teForm: 'きて',
        naiForm: 'こない',
        taForm: 'きた',
        meaning: 'come',
        lesson: 1
      }
    ]);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PREVIOUS');

    app.settings.isRandomMode.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('PREVIOUS');
  });

  it('moves backward through items in non-random mode', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.vocab.set([
      {
        group: 'V',
        japaneseForm: 'いく',
        dictionaryForm: 'いく',
        teForm: 'いって',
        naiForm: 'いかない',
        taForm: 'いった',
        meaning: 'go',
        lesson: 1
      },
      {
        group: 'V',
        japaneseForm: 'くる',
        dictionaryForm: 'くる',
        teForm: 'きて',
        naiForm: 'こない',
        taForm: 'きた',
        meaning: 'come',
        lesson: 1
      }
    ]);
    app.settings.isRandomMode.set(false);
    app.currentVerbIndex.set(1);

    app.previousWord();
    expect(app.currentWord()?.meaning).toBe('go');

    app.previousWord();
    expect(app.currentWord()?.meaning).toBe('come');
  });

  it.each(['CONJUGATION-SHADOW', 'ADJECTIVE-SHADOW'] as const)(
    'shows the cram toggle in %s mode',
    (mode) => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      app.settings.mode.set(mode);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cram');
    }
  );

  it.each([
    {
      mode: 'CONJUGATION-SHADOW' as const,
      populate: (app: App) => app.verbConjugations.set([{
        english: 'eat',
        dictionaryForm: 'たべる',
        negativeForm: 'たべない',
        pastForm: 'たべた',
        teForm: 'たべて'
      }]),
      expectedForms: ['たべる', 'たべない', 'たべた', 'たべて']
    },
    {
      mode: 'ADJECTIVE-SHADOW' as const,
      populate: (app: App) => app.adjectives.set([{
        english: 'good',
        dictionaryForm: 'いい',
        negativeForm: 'よくない',
        pastForm: 'よかった',
        teForm: 'よくて'
      }]),
      expectedForms: ['いい', 'よくない', 'よかった', 'よくて']
    }
  ])('auto-plays all forms once in $mode cram mode', async ({ mode, populate, expectedForms }) => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.settings.mode.set(mode);
    app.settings.shadowPauseMs.set(0);
    app.settings.shadowRepeatLoop.set(4);
    populate(app);

    speakMock.mockClear();
    cancelMock.mockClear();

    app.settings.isCramMode.set(true);
    fixture.detectChanges();
    await flushAsyncWork();

    expect(cancelMock).toHaveBeenCalledTimes(1);
    expect(speakMock.mock.calls.map(([utterance]) => utterance.text)).toEqual(expectedForms);
  });
});
