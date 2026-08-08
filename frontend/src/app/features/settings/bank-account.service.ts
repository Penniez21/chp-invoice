import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BankAccount {
  id: number;
  bankName: string;
  accountType: string | null;
  accountNo: string;
  accountName: string | null;
  showOnInvoice: boolean;
  sortOrder: number;
}

export type BankAccountPayload = Omit<BankAccount, 'id'>;

/** จำนวนบัญชีสูงสุดที่แสดงบนใบแจ้งหนี้ได้ (ต้องตรงกับ BankAccount.MAX_SHOWN ฝั่ง backend) */
export const MAX_SHOWN_BANKS = 3;

@Injectable({ providedIn: 'root' })
export class BankAccountService {
  private http = inject(HttpClient);
  private base = '/api/bank-accounts';

  list(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(this.base);
  }

  /** เฉพาะบัญชีที่เลือกให้ขึ้นใบแจ้งหนี้ */
  listShown(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${this.base}?shown=true`);
  }

  create(payload: BankAccountPayload): Observable<BankAccount> {
    return this.http.post<BankAccount>(this.base, payload);
  }

  update(id: number, payload: BankAccountPayload): Observable<BankAccount> {
    return this.http.put<BankAccount>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
