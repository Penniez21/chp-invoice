import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** ใบเสร็จรับเงิน — ช่องเดียวกับใบแจ้งหนี้ทุกอย่าง ต่างแค่เลขที่เป็น receiptNo และเก็บแยกตาราง */
export interface ReceiptItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface ReceiptRequest {
  receiptNo: string;
  poNo?: string | null;
  project?: string | null;
  issueDate: string;          // ISO yyyy-MM-dd
  dueDate?: string | null;
  issuerName: string;
  issuerTaxId?: string | null;
  issuerAddress?: string | null;
  issuerEmail?: string | null;
  issuerPhone?: string | null;
  recipientName: string;
  recipientTaxId?: string | null;
  recipientAddress?: string | null;
  recipientPhone?: string | null;
  whtRate: number;
  items: ReceiptItemDto[];
}

export interface ReceiptResponse extends ReceiptRequest {
  id: number;
  subTotal: number;
  whtAmount: number;
  netTotal: number;
  grandTotal: number;
  createdAt: string;
  items: ReceiptItemDto[];
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private http = inject(HttpClient);
  private base = '/api/receipts';

  create(payload: ReceiptRequest): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(this.base, payload);
  }

  update(id: number, payload: ReceiptRequest): Observable<ReceiptResponse> {
    return this.http.put<ReceiptResponse>(`${this.base}/${id}`, payload);
  }

  get(id: number): Observable<ReceiptResponse> {
    return this.http.get<ReceiptResponse>(`${this.base}/${id}`);
  }

  list(): Observable<ReceiptResponse[]> {
    return this.http.get<ReceiptResponse[]>(this.base);
  }

  /** เลขรันถัดไป (เลขที่ใบเสร็จ + หมายเลขสั่งซื้อ) ที่ยังไม่ซ้ำในตารางใบเสร็จ — รันแยกจากใบแจ้งหนี้ */
  nextNumbers(): Observable<{ receiptNo: string; poNo: string }> {
    return this.http.get<{ receiptNo: string; poNo: string }>(`${this.base}/next-numbers`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
