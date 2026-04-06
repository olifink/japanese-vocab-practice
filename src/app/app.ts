import { Component, signal, computed, effect, inject, ViewChild, ElementRef, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VocabService, type AdjectiveItem, type VerbConjugationItem } from './services/vocab';
import { SettingsService } from './services/settings';
import { SettingsDialog } from './settings-dialog';
import { NumbersPracticeComponent } from './numbers-practice/numbers-practice';
import { DatePracticeComponent } from './date-practice/date-practice';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDialogModule,
    NumbersPracticeComponent,
    DatePracticeComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('nextButton', { read: ElementRef }) nextButton!: ElementRef<HTMLButtonElement>;

  private vocabService = inject(VocabService);
  private dialog = inject(MatDialog);
  settings = inject(SettingsService);

  vocab = this.vocabService.getVocab();
  verbConjugations = this.vocabService.getVerbConjugations();
  adjectives = this.vocabService.getAdjectives();

  currentVerbIndex = signal<number>(0);
  isRevealed = signal<boolean>(false);
  private shadowPlaybackRequestId = 0;

  filteredVocab = computed(() => {
    const allVocab = this.vocab();
    const lesson = this.settings.selectedLesson();
    const rangeMode = this.settings.lessonRangeMode();

    if (lesson === 'all') return allVocab;

    if (rangeMode === 'up-to' && this.isNumericLesson(lesson)) {
      return allVocab.filter(v => this.isNumericLesson(v.lesson) && v.lesson <= lesson);
    }

    return allVocab.filter(v => v.lesson === lesson);
  });

  currentWord = computed(() => {
    const list = this.filteredVocab();
    if (list.length === 0) return null;
    return list[this.currentVerbIndex() % list.length];
  });

  currentConjugation = computed(() => {
    const list = this.verbConjugations();
    if (list.length === 0) return null;
    return list[this.currentVerbIndex() % list.length];
  });

  currentAdjective = computed(() => {
    const list = this.adjectives();
    if (list.length === 0) return null;
    return list[this.currentVerbIndex() % list.length];
  });

  isShadowMode = computed(() =>
    this.settings.mode() === 'CONJUGATION-SHADOW' || this.settings.mode() === 'ADJECTIVE-SHADOW');

  isNumbersMode = computed(() => this.settings.mode() === 'NUMBERS');
  isDateMode = computed(() => this.settings.mode() === 'DATE');

  currentShadowItem = computed(() => {
    if (this.settings.mode() === 'ADJECTIVE-SHADOW') return this.currentAdjective();
    if (this.settings.mode() === 'CONJUGATION-SHADOW') return this.currentConjugation();
    return null;
  });

  activeItemCount = computed(() => {
    if (this.settings.mode() === 'CONJUGATION-SHADOW') return this.verbConjugations().length;
    if (this.settings.mode() === 'ADJECTIVE-SHADOW') return this.adjectives().length;
    return this.filteredVocab().length;
  });

  canGoPrevious = computed(() => !this.settings.isRandomMode() && this.activeItemCount() > 1);

  isNumericLesson(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  }

  constructor() {
    this.vocabService.loadVocab();
    this.vocabService.loadVerbConjugations();
    this.vocabService.loadAdjectives();

    // Reset index when filter changes
    effect(() => {
      this.settings.mode();
      this.settings.selectedLesson();
      this.settings.lessonRangeMode();
      this.currentVerbIndex.set(0);
      this.isRevealed.set(!this.isShadowMode() && this.settings.isCramMode());
    });

    // In cram mode, always show the answer and auto-play Japanese audio for the current card.
    effect(() => {
      const isCramMode = this.settings.isCramMode();
      const word = this.currentWord();

      if (this.isShadowMode() || this.isNumbersMode() || this.isDateMode() || !isCramMode || !word) {
        return;
      }

      this.isRevealed.set(true);
      this.speak(word.japaneseForm);
    });

    effect(() => {
      const isCramMode = this.settings.isCramMode();
      const shadowItem = this.currentShadowItem();

      if (!isCramMode || !shadowItem) {
        return;
      }

      untracked(() => {
        void this.playShadowForms(shadowItem, 1);
      });
    });
  }

  speak(text: string | undefined): void {
    if (!text || !('speechSynthesis' in window)) return;
    this.shadowPlaybackRequestId += 1;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    speechSynthesis.speak(utterance);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private speakUtterance(text: string): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  }

  private getShadowForms(item: VerbConjugationItem | AdjectiveItem): string[] {
    return [item.masuForm, item.dictionaryForm, item.negativeForm, item.pastForm, item.pastNegativeForm, item.teForm].filter(Boolean);
  }

  private async playShadowForms(item: VerbConjugationItem | AdjectiveItem, repeatCount: number): Promise<void> {
    if (!item || !('speechSynthesis' in window)) return;

    this.shadowPlaybackRequestId += 1;
    const requestId = this.shadowPlaybackRequestId;
    speechSynthesis.cancel();

    const forms = this.getShadowForms(item);
    const pauseMs = this.settings.shadowPauseMs();

    for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
      for (let formIndex = 0; formIndex < forms.length; formIndex += 1) {
        if (this.shadowPlaybackRequestId !== requestId) {
          return;
        }

        await this.speakUtterance(forms[formIndex]);

        if (pauseMs > 0 && (formIndex < forms.length - 1 || repeatIndex < repeatCount - 1)) {
          await this.wait(pauseMs);
        }
      }
    }
  }

  async speakActiveForms(): Promise<void> {
    const item = this.currentShadowItem();
    if (!item) return;

    await this.playShadowForms(item, this.settings.shadowRepeatLoop());
  }

  openSettings() {
    this.dialog.open(SettingsDialog, {
      width: '400px'
    });
  }

  revealAnswer() {
    this.isRevealed.set(true);
  }

  private getActiveItems() {
    const mode = this.settings.mode();
    return mode === 'CONJUGATION-SHADOW'
      ? this.verbConjugations()
      : mode === 'ADJECTIVE-SHADOW'
        ? this.adjectives()
        : this.filteredVocab();
  }

  private stopPlayback(): void {
    this.shadowPlaybackRequestId += 1;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  private updateCurrentIndex(step: 1 | -1): void {
    const list = this.getActiveItems();
    if (list.length === 0) return;

    if (step === 1 && this.settings.isRandomMode() && list.length > 1) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * list.length);
      } while (newIndex === this.currentVerbIndex() % list.length);
      this.currentVerbIndex.set(newIndex);
    } else {
      this.currentVerbIndex.update(i => (i + step + list.length) % list.length);
    }

    this.isRevealed.set(!this.isShadowMode() && this.settings.isCramMode());
  }

  nextWord() {
    this.stopPlayback();
    this.updateCurrentIndex(1);

    // Focus the next button (or the reveal button will be focused by default if it's the only one)
    setTimeout(() => {
      this.nextButton?.nativeElement?.focus();
    });
  }

  previousWord() {
    this.stopPlayback();
    this.updateCurrentIndex(-1);
  }
}
