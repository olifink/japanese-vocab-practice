import { Component, signal, computed, effect, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VocabService } from './services/vocab';
import { SettingsService } from './services/settings';
import { SettingsDialog } from './settings-dialog';

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
    MatDialogModule
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

  activeItemCount = computed(() => {
    if (this.settings.mode() === 'CONJUGATION-SHADOW') {
      return this.verbConjugations().length;
    }
    return this.filteredVocab().length;
  });

  isNumericLesson(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  }

  constructor() {
    this.vocabService.loadVocab();
    this.vocabService.loadVerbConjugations();

    // Reset index when filter changes
    effect(() => {
      this.settings.mode();
      this.settings.selectedLesson();
      this.settings.lessonRangeMode();
      this.currentVerbIndex.set(0);
      this.isRevealed.set(false);
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

  async speakConjugationForms(): Promise<void> {
    const item = this.currentConjugation();
    if (!item || !('speechSynthesis' in window)) return;

    this.shadowPlaybackRequestId += 1;
    const requestId = this.shadowPlaybackRequestId;
    speechSynthesis.cancel();

    const forms = [item.dictionaryForm, item.negativeForm, item.pastForm, item.teForm].filter(Boolean);
    const pauseMs = this.settings.shadowPauseMs();
    const repeatCount = this.settings.shadowRepeatLoop();

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

  openSettings() {
    this.dialog.open(SettingsDialog, {
      width: '400px'
    });
  }

  nextWord() {
    this.shadowPlaybackRequestId += 1;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    const list = this.settings.mode() === 'CONJUGATION-SHADOW'
      ? this.verbConjugations()
      : this.filteredVocab();
    if (list.length === 0) return;

    if (this.settings.isRandomMode() && list.length > 1) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * list.length);
      } while (newIndex === this.currentVerbIndex() % list.length);
      this.currentVerbIndex.set(newIndex);
    } else {
      this.currentVerbIndex.update(i => (i + 1) % list.length);
    }

    this.isRevealed.set(false);

    // Focus the next button (or the reveal button will be focused by default if it's the only one)
    setTimeout(() => {
      this.nextButton?.nativeElement?.focus();
    });
  }
}
