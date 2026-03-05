import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { firstValueFrom } from 'rxjs';

export interface Verb {
  group: string;
  masuForm: string;
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
  private verbs = signal<Verb[]>([]);

  constructor(private http: HttpClient) {}

  async loadVerbs(): Promise<void> {
    const csvData = await firstValueFrom(this.http.get('verbs.csv', { responseType: 'text' }));
    
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedVerbs: Verb[] = results.data.map((row: any) => ({
          group: row['group'],
          masuForm: row['ます-form'],
          dictionaryForm: row['dictionary form'],
          teForm: row['て-form'],
          naiForm: row['ない-form'],
          taForm: row['た-form'],
          meaning: row['meaning'],
          lesson: parseInt(row['lesson'], 10)
        }));
        this.verbs.set(parsedVerbs);
      }
    });
  }

  getVerbs() {
    return this.verbs;
  }
}
