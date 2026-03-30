import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  ElementRef,
  ViewChild,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from '../services/settings';
import { toJapaneseNumeral, generateRandomNumber } from '../services/japanese-numbers';

@Component({
  selector: 'app-numbers-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './numbers-practice.html',
  styleUrl: './numbers-practice.scss',
})
export class NumbersPracticeComponent {
  @ViewChild('nextBtn', { read: ElementRef }) nextBtn?: ElementRef<HTMLButtonElement>;

  settings = inject(SettingsService);

  numberStr = signal<string>('0');
  japaneseReading = computed(() => toJapaneseNumeral(this.numberStr()));
  showNext = computed(() => this.settings.isRandomMode());

  constructor() {
    // Auto-speak when cram mode is toggled on
    effect(() => {
      if (this.settings.isCramMode()) {
        untracked(() => this.speakNumber());
      }
    });
  }

  appendDigit(digit: string): void {
    this.numberStr.update(current => {
      if (current === '0') return digit;
      if (current.replace('.', '').length >= 10) return current;
      return current + digit;
    });
  }

  appendDecimal(): void {
    this.numberStr.update(current => {
      if (current.includes('.')) return current;
      return current + '.';
    });
  }

  backspace(): void {
    this.numberStr.update(current => {
      if (current.length <= 1) return '0';
      const next = current.slice(0, -1);
      return next === '' || next === '-' ? '0' : next;
    });
  }

  clear(): void {
    this.numberStr.set('0');
  }

  speakNumber(): void {
    const num = this.numberStr();
    if (!num || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(num);
    utterance.lang = 'ja-JP';
    speechSynthesis.speak(utterance);
  }

  nextNumber(): void {
    this.numberStr.set(generateRandomNumber());
    if (this.settings.isCramMode()) {
      setTimeout(() => this.speakNumber());
    }
    setTimeout(() => this.nextBtn?.nativeElement?.focus());
  }
}
