import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Recipient {
  id: number;
  name: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
}

export type RecipientPayload = Omit<Recipient, 'id'>;

@Injectable({ providedIn: 'root' })
export class RecipientService {
  private http = inject(HttpClient);
  private base = '/api/recipients';

  list(): Observable<Recipient[]> {
    return this.http.get<Recipient[]>(this.base);
  }

  create(payload: RecipientPayload): Observable<Recipient> {
    return this.http.post<Recipient>(this.base, payload);
  }

  update(id: number, payload: RecipientPayload): Observable<Recipient> {
    return this.http.put<Recipient>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
