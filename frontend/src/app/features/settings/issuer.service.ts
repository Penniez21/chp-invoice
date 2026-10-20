import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Issuer {
  id: number;
  name: string;
  taxId: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export type IssuerPayload = Omit<Issuer, 'id'>;

@Injectable({ providedIn: 'root' })
export class IssuerService {
  private http = inject(HttpClient);
  private base = '/api/issuers';

  list(): Observable<Issuer[]> {
    return this.http.get<Issuer[]>(this.base);
  }

  create(payload: IssuerPayload): Observable<Issuer> {
    return this.http.post<Issuer>(this.base, payload);
  }

  update(id: number, payload: IssuerPayload): Observable<Issuer> {
    return this.http.put<Issuer>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
