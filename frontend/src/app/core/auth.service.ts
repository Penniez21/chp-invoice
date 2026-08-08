import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

const TOKEN_KEY = 'chp_token';
const USER_KEY = 'chp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ใช้ path สัมพัทธ์ — dev server จะ proxy /api ไป backend (ดู proxy.conf.json)
  private readonly apiBase = '/api';

  // สถานะผู้ใช้ปัจจุบัน (signal)
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _username = signal<string | null>(localStorage.getItem(USER_KEY));

  readonly username = this._username.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiBase}/auth/login`, { username, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._username.set(null);
  }

  getToken(): string | null {
    return this._token();
  }

  private setSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, res.username);
    this._token.set(res.token);
    this._username.set(res.username);
  }
}
