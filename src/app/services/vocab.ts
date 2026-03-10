import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { firstValueFrom } from 'rxjs';

export interface VocabItem {
  group: string;
  japaneseForm: string;
  dictionaryForm: string;
  teForm: string;
  naiForm: string;
  taForm: string;
  meaning: string;
  lesson: number;
}

@Injectable({
  providedIn: 'root'
})
export class VocabService {
  private vocab = signal<VocabItem[]>([]);

  constructor(private http: HttpClient) {}

  async loadVocab(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('lessons.csv', { responseType: 'text' }));

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: VocabItem[] = results.data.map((row: any) => ({
          group: row['group'],
          japaneseForm: row['N/A/Vます-form'],
          dictionaryForm: row['dictionary form'],
          teForm: row['て-form'],
          naiForm: row['ない-form'],
          taForm: row['た-form'],
          meaning: row['meaning'],
          lesson: parseInt(row['lesson'], 10)
        }));
        this.vocab.set(parsed);
      }
    });
  }

  getVocab() {
    return this.vocab;
  }
}
