import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { firstValueFrom } from 'rxjs';

export type LessonValue = number | string;

export interface VocabItem {
  group: string;
  japaneseForm: string;
  dictionaryForm: string;
  teForm: string;
  naiForm: string;
  taForm: string;
  meaning: string;
  lesson: LessonValue;
}

export interface VerbConjugationItem {
  english: string;
  dictionaryForm: string;
  negativeForm: string;
  pastForm: string;
  teForm: string;
}

@Injectable({
  providedIn: 'root'
})
export class VocabService {
  private vocab = signal<VocabItem[]>([]);
  private verbConjugations = signal<VerbConjugationItem[]>([]);
  private http = inject(HttpClient);

  private getValue(row: Record<string, string>, key: string): string {
    return row[key]?.trim() ?? '';
  }

  private parseLessonValue(rawLesson: string): LessonValue {
    const numericLesson = Number(rawLesson);
    if (!Number.isNaN(numericLesson) && rawLesson !== '') {
      return numericLesson;
    }
    return rawLesson;
  }

  async loadVocab(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('lessons.csv', { responseType: 'text' }));

    Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: VocabItem[] = results.data.map((row) => ({
          group: this.getValue(row, 'group'),
          japaneseForm: this.getValue(row, 'N/A/Vます-form'),
          dictionaryForm: this.getValue(row, 'dictionary form'),
          teForm: this.getValue(row, 'て-form'),
          naiForm: this.getValue(row, 'ない-form'),
          taForm: this.getValue(row, 'た-form'),
          meaning: this.getValue(row, 'meaning'),
          lesson: this.parseLessonValue(this.getValue(row, 'lesson'))
        }));
        this.vocab.set(parsed);
      }
    });
  }

  async loadVerbConjugations(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('verbs.csv', { responseType: 'text' }));

    Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: VerbConjugationItem[] = results.data.map((row) => ({
          english: this.getValue(row, 'English'),
          dictionaryForm: this.getValue(row, 'DictionaryForm'),
          negativeForm: this.getValue(row, 'NegativeForm'),
          pastForm: this.getValue(row, 'PastForm'),
          teForm: this.getValue(row, 'TeForm')
        }));
        this.verbConjugations.set(parsed);
      }
    });
  }

  getVocab() {
    return this.vocab;
  }

  getVerbConjugations() {
    return this.verbConjugations;
  }
}
