import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { apiErrorMessage } from '../../../core/api-error';
import { AccountService } from '../account.service';

/** รหัสผ่านใหม่กับยืนยันต้องตรงกัน */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirmPassword')?.value;
  return !b || a === b ? null : { mismatch: true };
}

@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  private fb = inject(FormBuilder);
  private service = inject(AccountService);
  private toast = inject(ToastService);
  protected auth = inject(AuthService);

  protected readonly savingPassword = signal(false);
  protected readonly savingUsername = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  protected readonly usernameForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newUsername: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9._-]+$/)],
    ],
  });

  protected submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toast.error('ข้อมูลยังไม่ถูกต้อง', 'ตรวจรหัสผ่านใหม่และช่องยืนยันอีกครั้ง');
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.savingPassword.set(true);
    this.service.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('เปลี่ยนรหัสผ่านแล้ว', 'ครั้งต่อไปให้ใช้รหัสผ่านใหม่เข้าสู่ระบบ');
      },
      error: (e) => {
        this.savingPassword.set(false);
        this.toast.error('เปลี่ยนรหัสผ่านไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected submitUsername(): void {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.toast.error('ข้อมูลยังไม่ถูกต้อง', 'ตรวจชื่อผู้ใช้ใหม่และรหัสผ่านปัจจุบันอีกครั้ง');
      return;
    }
    const { currentPassword, newUsername } = this.usernameForm.getRawValue();

    this.savingUsername.set(true);
    this.service.changeUsername(currentPassword, newUsername).subscribe({
      next: (res) => {
        this.savingUsername.set(false);
        this.usernameForm.reset();
        this.toast.success('เปลี่ยนชื่อผู้ใช้แล้ว', `ตอนนี้ใช้ชื่อ "${res.username}" เข้าสู่ระบบ`);
      },
      error: (e) => {
        this.savingUsername.set(false);
        this.toast.error('เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }
}
