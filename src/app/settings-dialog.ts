import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from './services/settings';
import { VocabService } from './services/vocab';
import { computed } from '@angular/core';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>settings</mat-icon>
      Settings
    </h2>
    <mat-dialog-content class="settings-content">
      <div class="control-row">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Practice Mode</mat-label>
          <mat-select [value]="settings.mode()" (selectionChange)="settings.mode.set($event.value)">
            <mat-option value="JP-EN">Japanese to English</mat-option>
            <mat-option value="EN-JP">English to Japanese</mat-option>
            <mat-option value="CONJUGATION-SHADOW">Verb Conjugation Shadowing</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (settings.mode() !== 'CONJUGATION-SHADOW') {
      <div class="control-row lesson-row">
        <mat-form-field appearance="outline" class="lesson-select">
          <mat-label>Lesson</mat-label>
          <mat-select [value]="settings.selectedLesson()" (selectionChange)="settings.selectedLesson.set($event.value)">
            <mat-option value="all">All Lessons</mat-option>
            @for (lesson of lessons(); track lesson) {
            <mat-option [value]="lesson">Lesson {{ lesson }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (settings.selectedLesson() !== 'all') {
        <mat-button-toggle-group [value]="settings.lessonRangeMode()" (change)="settings.lessonRangeMode.set($event.value)"
          aria-label="Lesson Range">
          <mat-button-toggle value="exact">Only</mat-button-toggle>
          <mat-button-toggle value="up-to">Up to</mat-button-toggle>
        </mat-button-toggle-group>
        }
      </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>CLOSE</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-top: 24px !important; /* Extra space for floating labels */
      min-width: 320px;
    }
    .control-row {
      display: flex;
      flex-direction: column;
    }
    .full-width {
      width: 100%;
    }
    .lesson-row {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      mat-button-toggle-group {
        width: fit-content;
        align-self: flex-start;
      }
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
    }
  `]
})
export class SettingsDialog {
  settings = inject(SettingsService);
  private vocabService = inject(VocabService);
  vocab = this.vocabService.getVocab();

  lessons = computed(() => {
    const allVocab = this.vocab();
    const uniqueLessons = [...new Set(allVocab.map(v => v.lesson))].sort((a, b) => a - b);
    return uniqueLessons;
  });
}
