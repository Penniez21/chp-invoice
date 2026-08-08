import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface Tambon {
  n: string; // ชื่อตำบล
  z: string; // รหัสไปรษณีย์
}
export interface Amphure {
  n: string; // ชื่ออำเภอ
  t: Tambon[];
}
export interface Province {
  n: string; // ชื่อจังหวัด
  a: Amphure[];
}

/** โหลดชุดข้อมูลที่อยู่ไทย (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์) แบบ cache ครั้งเดียว */
@Injectable({ providedIn: 'root' })
export class AddressDataService {
  private http = inject(HttpClient);
  private cache$?: Observable<Province[]>;

  load(): Observable<Province[]> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<Province[]>('/data/thai-address.json')
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }
}
