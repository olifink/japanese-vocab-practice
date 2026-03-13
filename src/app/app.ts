import { Component, signal, computed, effect, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { VocabService } from './services/vocab';

type PracticeMode = 'JP-EN' | 'EN-JP';
type LessonRangeMode = 'exact' | 'up-to';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatToolbarModule,
    MatIconModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatButtonToggleModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('nextButton', { read: ElementRef }) nextButton!: ElementRef<HTMLButtonElement>;

  private vocabService = inject(VocabService);
  vocab = this.vocabService.getVocab();

  mode = signal<PracticeMode>((localStorage.getItem('mode') as PracticeMode) || 'JP-EN');
  isRandomMode = signal<boolean>(localStorage.getItem('isRandomMode') === 'true');
  selectedLesson = signal<number | 'all'>(this.getInitialLesson());
  lessonRangeMode = signal<LessonRangeMode>((localStorage.getItem('lessonRangeMode') as LessonRangeMode) || 'exact');

  showSettings = signal<boolean>(false);

  currentVerbIndex = signal<number>(0);
  isRevealed = signal<boolean>(false);

  filteredVocab = computed(() => {
    const allVocab = this.vocab();
    const lesson = this.selectedLesson();
    const rangeMode = this.lessonRangeMode();

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

  lessons = computed(() => {
    const allVocab = this.vocab();
    const uniqueLessons = [...new Set(allVocab.map(v => v.lesson))].sort((a, b) => a - b);
    return uniqueLessons;
  });

  constructor() {
    this.vocabService.loadVocab();

    // Reset index when filter changes
    effect(() => {
      this.selectedLesson();
      this.lessonRangeMode();
      this.currentVerbIndex.set(0);
      this.isRevealed.set(false);
    });

    // Persist settings
    effect(() => {
      localStorage.setItem('mode', this.mode());
      localStorage.setItem('isRandomMode', this.isRandomMode().toString());
      localStorage.setItem('selectedLesson', this.selectedLesson().toString());
      localStorage.setItem('lessonRangeMode', this.lessonRangeMode());
    });
  }

  private getInitialLesson(): number | 'all' {
    const saved = localStorage.getItem('selectedLesson');
    if (!saved || saved === 'all') return 'all';
    const num = parseInt(saved, 10);
    return isNaN(num) ? 'all' : num;
  }

  nextWord() {
    const list = this.filteredVocab();
    if (this.isRandomMode() && list.length > 1) {
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
