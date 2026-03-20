import { Injectable, signal, effect } from '@angular/core';

export type PracticeMode = 'JP-EN' | 'EN-JP' | 'CONJUGATION-SHADOW';
export type LessonRangeMode = 'exact' | 'up-to';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  mode = signal<PracticeMode>((localStorage.getItem('mode') as PracticeMode) || 'JP-EN');
  isRandomMode = signal<boolean>(localStorage.getItem('isRandomMode') === 'true');
  selectedLesson = signal<number | 'all'>(this.getInitialLesson());
  lessonRangeMode = signal<LessonRangeMode>((localStorage.getItem('lessonRangeMode') as LessonRangeMode) || 'exact');
  shadowPauseMs = signal<number>(this.getInitialNumber('shadowPauseMs', 700));
  shadowRepeatLoop = signal<number>(this.getInitialNumber('shadowRepeatLoop', 2));

  constructor() {
    // Persist settings
    effect(() => {
      localStorage.setItem('mode', this.mode());
      localStorage.setItem('isRandomMode', this.isRandomMode().toString());
      localStorage.setItem('selectedLesson', this.selectedLesson().toString());
      localStorage.setItem('lessonRangeMode', this.lessonRangeMode());
      localStorage.setItem('shadowPauseMs', this.shadowPauseMs().toString());
      localStorage.setItem('shadowRepeatLoop', this.shadowRepeatLoop().toString());
    });
  }

  private getInitialNumber(key: string, fallback: number): number {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = parseInt(saved, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  private getInitialLesson(): number | 'all' {
    const saved = localStorage.getItem('selectedLesson');
    if (!saved || saved === 'all') return 'all';
    const num = parseInt(saved, 10);
    return isNaN(num) ? 'all' : num;
  }
}
