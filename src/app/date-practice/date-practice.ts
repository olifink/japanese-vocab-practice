import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  untracked,
  OnDestroy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SettingsService } from '../services/settings';
import { WEEKDAYS, MONTHS, DAYS, getWeekdayEntry } from '../services/japanese-dates';

@Component({
  selector: 'app-date-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatFormFieldModule],
  templateUrl: './date-practice.html',
  styleUrl: './date-practice.scss',
})
export class DatePracticeComponent implements OnDestroy {
  settings = inject(SettingsService);

  readonly weekdays = WEEKDAYS;
  readonly months = MONTHS;
  readonly days = DAYS;

  dateString = signal<string>(this.getTodayString());
  currentCramItem = signal<string>('');

  private parsedDate = computed(() => {
    const parts = this.dateString().split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    return { year, month, day, weekday: new Date(year, month - 1, day).getDay() };
  });

  selectedYear = computed(() => this.parsedDate().year);
  selectedMonth = computed(() => this.parsedDate().month);
  selectedDay = computed(() => this.parsedDate().day);

  japaneseYear = computed(() => `${this.selectedYear()}年`);
  japaneseMonth = computed(() => MONTHS[this.selectedMonth() - 1]?.japanese ?? '');
  japaneseDay = computed(() => DAYS[this.selectedDay() - 1]?.japanese ?? '');
  japaneseWeekday = computed(() => getWeekdayEntry(this.parsedDate().weekday)?.japanese ?? '');
  japaneseFullDate = computed(
    () =>
      `${this.japaneseYear()}${this.japaneseMonth()}${this.japaneseDay()}${this.japaneseWeekday()}`,
  );

  weekdayEnglish = computed(() => getWeekdayEntry(this.parsedDate().weekday)?.english ?? '');
  monthEnglish = computed(() => MONTHS[this.selectedMonth() - 1]?.english ?? '');

  private cramPlaybackRequestId = 0;

  constructor() {
    effect(() => {
      const isCramMode = this.settings.isCramMode();
      if (isCramMode) {
        untracked(() => void this.startCramCycle());
      } else {
        this.stopPlayback();
        this.currentCramItem.set('');
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPlayback();
  }

  private getTodayString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.dateString.set(input.value);
    }
  }

  setRandomDate(): void {
    const baseYear = new Date().getFullYear();
    const year = baseYear - 2 + Math.floor(Math.random() * 5);
    const month = Math.floor(Math.random() * 12) + 1;
    const maxDay = new Date(year, month, 0).getDate();
    const day = Math.floor(Math.random() * maxDay) + 1;
    this.dateString.set(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    );
  }

  speak(text: string | undefined): void {
    if (!text || !('speechSynthesis' in window)) return;
    this.cramPlaybackRequestId += 1;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    speechSynthesis.speak(utterance);
  }

  private stopPlayback(): void {
    this.cramPlaybackRequestId += 1;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private speakUtterance(text: string): Promise<void> {
    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  }

  private async speakList(items: string[], requestId: number): Promise<boolean> {
    const pauseMs = this.settings.shadowPauseMs();
    for (let i = 0; i < items.length; i++) {
      if (this.cramPlaybackRequestId !== requestId) return false;
      this.currentCramItem.set(items[i]);
      await this.speakUtterance(items[i]);
      if (pauseMs > 0 && i < items.length - 1) {
        await this.wait(pauseMs);
      }
    }
    return true;
  }

  async speakAllWeekdays(): Promise<void> {
    this.cramPlaybackRequestId += 1;
    const requestId = this.cramPlaybackRequestId;
    speechSynthesis.cancel();
    this.currentCramItem.set('');
    await this.speakList(
      WEEKDAYS.map(w => w.japanese),
      requestId,
    );
    if (this.cramPlaybackRequestId === requestId) this.currentCramItem.set('');
  }

  async speakAllMonths(): Promise<void> {
    this.cramPlaybackRequestId += 1;
    const requestId = this.cramPlaybackRequestId;
    speechSynthesis.cancel();
    this.currentCramItem.set('');
    await this.speakList(
      MONTHS.map(m => m.japanese),
      requestId,
    );
    if (this.cramPlaybackRequestId === requestId) this.currentCramItem.set('');
  }

  async speakAllDays(): Promise<void> {
    this.cramPlaybackRequestId += 1;
    const requestId = this.cramPlaybackRequestId;
    speechSynthesis.cancel();
    this.currentCramItem.set('');
    await this.speakList(
      DAYS.map(d => d.japanese),
      requestId,
    );
    if (this.cramPlaybackRequestId === requestId) this.currentCramItem.set('');
  }

  private async startCramCycle(): Promise<void> {
    if (!('speechSynthesis' in window)) return;

    this.cramPlaybackRequestId += 1;
    const requestId = this.cramPlaybackRequestId;
    speechSynthesis.cancel();

    const pauseMs = this.settings.shadowPauseMs();
    const weekdayItems = WEEKDAYS.map(w => w.japanese);
    const monthItems = MONTHS.map(m => m.japanese);
    const dayItems = DAYS.map(d => d.japanese);

    while (this.cramPlaybackRequestId === requestId) {
      let ok = await this.speakList(weekdayItems, requestId);
      if (!ok) break;
      if (pauseMs > 0 && this.cramPlaybackRequestId === requestId) await this.wait(pauseMs * 2);

      ok = await this.speakList(monthItems, requestId);
      if (!ok) break;
      if (pauseMs > 0 && this.cramPlaybackRequestId === requestId) await this.wait(pauseMs * 2);

      ok = await this.speakList(dayItems, requestId);
      if (!ok) break;
      if (pauseMs > 0 && this.cramPlaybackRequestId === requestId) await this.wait(pauseMs * 2);
    }
  }
}
