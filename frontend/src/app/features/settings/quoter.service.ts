import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** ผู้เสนอราคา (ฝั่งใบเสนอราคา) — บริษัท / ร้าน / บุคคล ที่แสดงซ้ายบนของเอกสาร */
export interface Quoter {
  id: number;
  name: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  /** data URL (data:image/png;base64,...) — แสดงที่หัวใบเสนอราคา */
  logo: string | null;
  /** บุคคลผู้เสนอราคา (คนที่ดูแลใบเสนอราคา) — แสดงในกรอบเหลือง ไม่ใช่ข้อมูลบริษัทที่หัวกระดาษ */
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  /** มีค่าเฉพาะตอนบันทึก: จำนวนใบเสนอราคาเดิม (ที่ยังไม่มีโลโก้) ที่เพิ่งได้โลโก้นี้ไปด้วย */
  logoAppliedToQuotations?: number | null;
}

export type QuoterPayload = Omit<Quoter, 'id' | 'logoAppliedToQuotations'>;

@Injectable({ providedIn: 'root' })
export class QuoterService {
  private http = inject(HttpClient);
  private base = '/api/quoters';

  list(): Observable<Quoter[]> {
    return this.http.get<Quoter[]>(this.base);
  }

  create(payload: QuoterPayload): Observable<Quoter> {
    return this.http.post<Quoter>(this.base, payload);
  }

  update(id: number, payload: QuoterPayload): Observable<Quoter> {
    return this.http.put<Quoter>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
