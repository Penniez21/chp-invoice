import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface InvoiceRequest {
  invoiceNo: string;
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
  items: InvoiceItemDto[];
}

export interface InvoiceResponse extends InvoiceRequest {
  id: number;
  subTotal: number;
  whtAmount: number;
  netTotal: number;
  grandTotal: number;
  createdAt: string;
  items: InvoiceItemDto[];
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private base = '/api/invoices';

  create(payload: InvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.base, payload);
  }

  update(id: number, payload: InvoiceRequest): Observable<InvoiceResponse> {
    return this.http.put<InvoiceResponse>(`${this.base}/${id}`, payload);
  }

  get(id: number): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.base}/${id}`);
  }

  list(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(this.base);
  }

  /** เลขรันถัดไป (เลขที่ใบแจ้งหนี้ + หมายเลขสั่งซื้อ) ที่ยังไม่ซ้ำในฐานข้อมูล */
  nextNumbers(): Observable<{ invoiceNo: string; poNo: string }> {
    return this.http.get<{ invoiceNo: string; poNo: string }>(`${this.base}/next-numbers`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
