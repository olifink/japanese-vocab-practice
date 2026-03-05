import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private vocabService = inject(VocabService);
  verbs = this.vocabService.getVerbs();
  
  mode = signal<PracticeMode>('JP-EN');
  selectedLesson = signal<number | 'all'>('all');
  
  currentVerbIndex = signal<number>(0);
  userInput = signal<string>('');
  feedback = signal<{ correct: boolean; message: string } | null>(null);

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
    });
  }

  checkAnswer() {
    const verb = this.currentVerb();
    if (!verb) return;

    const answer = this.userInput().trim().toLowerCase();
    let isCorrect = false;
    let correctAnswer = '';

    if (this.mode() === 'JP-EN') {
      // Meaning can have multiple translations or be "enjoy oneself, play"
      // We'll do a simple check first
      const meanings = verb.meaning.split(',').map(m => m.trim().toLowerCase());
      isCorrect = meanings.some(m => answer === m || verb.meaning.toLowerCase().includes(answer));
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
  }

  nextWord() {
    this.currentVerbIndex.update(i => i + 1);
    this.userInput.set('');
    this.feedback.set(null);
  }

  shuffle() {
    // Shuffling is harder with computed, let's just use random index
    const list = this.filteredVerbs();
    if (list.length > 0) {
      this.currentVerbIndex.set(Math.floor(Math.random() * list.length));
      this.userInput.set('');
      this.feedback.set(null);
    }
  }
}
