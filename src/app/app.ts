import { Component, signal, computed, effect, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { VocabService, Verb } from './services/vocab';

type PracticeMode = 'JP-EN' | 'EN-JP';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('userInputField') userInputField!: ElementRef<HTMLInputElement>;
  @ViewChild('nextButton', { read: ElementRef }) nextButton!: ElementRef<HTMLButtonElement>;

  private vocabService = inject(VocabService);
  verbs = this.vocabService.getVerbs();
  
  mode = signal<PracticeMode>('JP-EN');
  isReviewMode = signal<boolean>(false);
  selectedLesson = signal<number | 'all'>('all');
  
  currentVerbIndex = signal<number>(0);
  userInput = signal<string>('');
  feedback = signal<{ correct: boolean; message: string } | null>(null);

  isInputValid = computed(() => this.userInput().trim().length >= 3);

  filteredVerbs = computed(() => {
    const allVerbs = this.verbs();
    const lesson = this.selectedLesson();
    if (lesson === 'all') return allVerbs;
    return allVerbs.filter(v => v.lesson === lesson);
  });

  currentVerb = computed(() => {
    const list = this.filteredVerbs();
    if (list.length === 0) return null;
    return list[this.currentVerbIndex() % list.length];
  });

  lessons = computed(() => {
    const allVerbs = this.verbs();
    const uniqueLessons = [...new Set(allVerbs.map(v => v.lesson))].sort((a, b) => a - b);
    return uniqueLessons;
  });

  constructor() {
    this.vocabService.loadVerbs();
    
    // Reset index when filter changes
    effect(() => {
      this.selectedLesson();
      this.currentVerbIndex.set(0);
      this.feedback.set(null);
      this.userInput.set('');
      
      // Focus input field when filter/mode changes
      setTimeout(() => {
        this.userInputField?.nativeElement?.focus();
      });
    });
  }

  checkAnswer() {
    const verb = this.currentVerb();
    if (!verb) return;

    const answer = this.userInput().trim().toLowerCase();
    if (!answer) return; // Ignore empty submissions or treat as "not checked"

    let isCorrect = false;
    let correctAnswer = '';

    if (this.mode() === 'JP-EN') {
      const meanings = verb.meaning.split(',').map(m => m.trim().toLowerCase());
      // Revert to includes check as requested
      isCorrect = meanings.some(m => m.includes(answer)) || verb.meaning.toLowerCase().includes(answer);
      correctAnswer = verb.meaning;
    } else {
      isCorrect = answer === verb.masuForm;
      correctAnswer = verb.masuForm;
    }

    if (isCorrect) {
      this.feedback.set({ correct: true, message: 'Correct!' });
    } else {
      this.feedback.set({ correct: false, message: `Incorrect. Correct answer: ${correctAnswer}` });
    }

    // Focus the next button after checking
    setTimeout(() => {
      this.nextButton?.nativeElement?.focus();
    });
  }

  nextWord() {
    this.currentVerbIndex.update(i => i + 1);
    this.userInput.set('');
    this.feedback.set(null);
    
    // Focus input field for the next word
    setTimeout(() => {
      this.userInputField?.nativeElement?.focus();
    });
  }

  shuffle() {
    const list = this.filteredVerbs();
    if (list.length > 0) {
      this.currentVerbIndex.set(Math.floor(Math.random() * list.length));
      this.userInput.set('');
      this.feedback.set(null);
      
      setTimeout(() => {
        this.userInputField?.nativeElement?.focus();
      });
    }
  }
}
