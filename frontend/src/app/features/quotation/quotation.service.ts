import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** วิธีคิดภาษีมูลค่าเพิ่ม: ราคารวม VAT แล้ว / บวก VAT เพิ่ม / ไม่มี VAT */
export type VatMode = 'INCLUDED' | 'EXCLUDED' | 'NONE';

export interface QuotationItemDto {
  description: string;
  /** รายละเอียดย่อยใต้รายการ บรรทัดละข้อ ไม่มีราคา */
  details?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  lineTotal?: number;
}

export interface QuotationRequest {
  quotationNo: string;
  issueDate: string;          // ISO yyyy-MM-dd
  customerNo?: string | null;
  project?: string | null;
  location?: string | null;
  sellerName: string;
  sellerTaxId?: string | null;
  sellerAddress?: string | null;
  sellerPhone?: string | null;
  sellerEmail?: string | null;
  customerName: string;
  customerTaxId?: string | null;
  customerAddress?: string | null;
  customerAttn?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  remark?: string | null;
  vatMode: VatMode;
  vatRate: number;
  items: QuotationItemDto[];
}

export interface QuotationResponse extends QuotationRequest {
  id: number;
  itemsTotal: number;
  beforeVat: number;
  vatAmount: number;
  grandTotal: number;
  createdAt: string;
  items: QuotationItemDto[];
}

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private http = inject(HttpClient);
  private base = '/api/quotations';

  create(payload: QuotationRequest): Observable<QuotationResponse> {
    return this.http.post<QuotationResponse>(this.base, payload);
  }

  update(id: number, payload: QuotationRequest): Observable<QuotationResponse> {
    return this.http.put<QuotationResponse>(`${this.base}/${id}`, payload);
  }

  get(id: number): Observable<QuotationResponse> {
    return this.http.get<QuotationResponse>(`${this.base}/${id}`);
  }

  list(): Observable<QuotationResponse[]> {
    return this.http.get<QuotationResponse[]>(this.base);
  }

  /** เลขที่ใบเสนอราคาถัดไปที่ยังไม่ซ้ำ: PSPO- + เลขรัน 3 หลัก (เช่น PSPO-066 → PSPO-067) */
  nextNumber(): Observable<{ quotationNo: string }> {
    return this.http.get<{ quotationNo: string }>(`${this.base}/next-number`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
