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
  masuForm: string;
  dictionaryForm: string;
  negativeForm: string;
  pastForm: string;
  teForm: string;
  pastNegativeForm: string;
}

// Adjectives share the same conjugation structure as verbs
export type AdjectiveItem = VerbConjugationItem;

export interface DailyExpressionItem {
  moduleName: string;
  unitName: string;
  kana: string;
  english: string;
}

@Injectable({
  providedIn: 'root'
})
export class VocabService {
  private vocab = signal<VocabItem[]>([]);
  private verbConjugations = signal<VerbConjugationItem[]>([]);
  private adjectives = signal<AdjectiveItem[]>([]);
  private dailyExpressions = signal<DailyExpressionItem[]>([]);
  private http = inject(HttpClient);

  private getValue(row: Record<string, string>, key: string): string {
    return row[key]?.trim() ?? '';
  }

  private getFirstAvailableValue(row: Record<string, string>, keys: string[]): string {
    for (const key of keys) {
      const value = this.getValue(row, key);
      if (value !== '') {
        return value;
      }
    }

    return '';
  }

  private parseLessonValue(rawLesson: string): LessonValue {
    const numericLesson = Number(rawLesson);
    if (!Number.isNaN(numericLesson) && rawLesson !== '') {
      return numericLesson;
    }
    return rawLesson;
  }

  private parseVocabCsv(csvData: string): VocabItem[] {
    const results = Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true
    });

    return results.data.map((row) => ({
      group: this.getValue(row, 'group'),
      japaneseForm: this.getFirstAvailableValue(row, ['word', 'N/A/Vます-form']),
      dictionaryForm: this.getValue(row, 'dictionary form'),
      teForm: this.getValue(row, 'て-form'),
      naiForm: this.getValue(row, 'ない-form'),
      taForm: this.getValue(row, 'た-form'),
      meaning: this.getValue(row, 'meaning'),
      lesson: this.parseLessonValue(this.getValue(row, 'lesson'))
    }));
  }

  async loadVocab(): Promise<void> {
    const [lessonsCsvData, phrasesCsvData] = await Promise.all([
      firstValueFrom(this.http.get('lessons.csv', { responseType: 'text' })),
      firstValueFrom(this.http.get('phrases.csv', { responseType: 'text' }))
    ]);

    const parsedLessons = this.parseVocabCsv(lessonsCsvData);
    const parsedPhrases = this.parseVocabCsv(phrasesCsvData);
    this.vocab.set([...parsedLessons, ...parsedPhrases]);
  }

  private parseConjugationCsv(csvData: string): VerbConjugationItem[] {
    const results = Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true
    });
    return results.data.map((row) => ({
      english: this.getValue(row, 'English'),
      masuForm: this.getValue(row, 'MasuForm'),
      dictionaryForm: this.getValue(row, 'DictionaryForm'),
      negativeForm: this.getValue(row, 'NegativeForm'),
      pastForm: this.getValue(row, 'PastForm'),
      teForm: this.getValue(row, 'TeForm'),
      pastNegativeForm: this.getValue(row, 'PastNegativeForm')
    }));
  }

  async loadVerbConjugations(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('verbs.csv', { responseType: 'text' }));
    this.verbConjugations.set(this.parseConjugationCsv(csvData));
  }

  async loadAdjectives(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('adjectives.csv', { responseType: 'text' }));
    this.adjectives.set(this.parseConjugationCsv(csvData));
  }

  private parseDailyCsv(csvData: string): DailyExpressionItem[] {
    const results = Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true
    });

    return results.data.map((row) => ({
      moduleName: this.getValue(row, 'module_name'),
      unitName: this.getValue(row, 'unit_name'),
      kana: this.getValue(row, 'kana'),
      english: this.getValue(row, 'english')
    }));
  }

  async loadDailyExpressions(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('daily.csv', { responseType: 'text' }));
    this.dailyExpressions.set(this.parseDailyCsv(csvData));
  }

  getVocab() {
    return this.vocab;
  }

  getVerbConjugations() {
    return this.verbConjugations;
  }

  getAdjectives() {
    return this.adjectives;
  }

  getDailyExpressions() {
    return this.dailyExpressions;
  }
}
