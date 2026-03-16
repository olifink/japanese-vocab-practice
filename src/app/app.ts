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

  currentVerbIndex = signal<number>(0);
  isRevealed = signal<boolean>(false);

  filteredVocab = computed(() => {
    const allVocab = this.vocab();
    const lesson = this.settings.selectedLesson();
    const rangeMode = this.settings.lessonRangeMode();

    if (lesson === 'all') return allVocab;

    if (rangeMode === 'up-to') {
      return allVocab.filter(v => v.lesson <= (lesson as number));
    }
    return allVocab.filter(v => v.lesson === lesson);
  });

  currentWord = computed(() => {
    const list = this.filteredVocab();
    if (list.length === 0) return null;
    return list[this.currentVerbIndex() % list.length];
  });

  constructor() {
    this.vocabService.loadVocab();

    // Reset index when filter changes
    effect(() => {
      this.settings.selectedLesson();
      this.settings.lessonRangeMode();
      this.currentVerbIndex.set(0);
      this.isRevealed.set(false);
    });
  }

  speak(text: string | undefined): void {
    if (!text || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    speechSynthesis.speak(utterance);
  }

  openSettings() {
    this.dialog.open(SettingsDialog, {
      width: '400px'
    });
  }

  nextWord() {
    const list = this.filteredVocab();
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
