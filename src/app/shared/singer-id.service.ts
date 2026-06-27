import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SingerIdService {
  private chanteurIdSource = new BehaviorSubject<string>(''); // Initialisé à vide
  chanteurId$ = this.chanteurIdSource.asObservable();

  setChanteurId(id: string): void {
    this.chanteurIdSource.next(id);
  }

  getChanteurId(): string {
    return this.chanteurIdSource.getValue();
  }
}
