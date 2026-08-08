import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService, LoginResponse } from '../../core/auth.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = '/api/account';

  /** ทั้งสองคำสั่งคืนโทเคนใหม่มาด้วย — เก็บทับทันทีเพื่อไม่ให้หลุดออกจากระบบ */
  changePassword(currentPassword: string, newPassword: string): Observable<LoginResponse> {
    return this.http
      .put<LoginResponse>(`${this.base}/password`, { currentPassword, newPassword })
      .pipe(tap((res) => this.auth.applySession(res)));
  }

  changeUsername(currentPassword: string, newUsername: string): Observable<LoginResponse> {
    return this.http
      .put<LoginResponse>(`${this.base}/username`, { currentPassword, newUsername })
      .pipe(tap((res) => this.auth.applySession(res)));
  }
}
