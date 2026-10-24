import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** ลูกค้า (ฝั่งใบเสนอราคา) — แยกจาก "ผู้รับ" ของใบแจ้งหนี้ */
export interface Customer {
  id: number;
  code: string | null;
  name: string;
  taxId: string | null;
  address: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
}

export type CustomerPayload = Omit<Customer, 'id'>;

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private base = '/api/customers';

  list(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.base);
  }

  create(payload: CustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.base, payload);
  }

  update(id: number, payload: CustomerPayload): Observable<Customer> {
    return this.http.put<Customer>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
