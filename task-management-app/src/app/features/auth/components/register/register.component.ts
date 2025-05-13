import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  registerError = '';
  registerSuccess = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.required, Validators.maxLength(30)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern('^(?=.*[a-zA-Z])(?=.*[0-9]).+$') // 英字と数字を両方含む
        ]
      ],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  async onRegister() {
    if (this.registerForm.valid) {
      const { email, password, displayName } = this.registerForm.value;
      try {
        const user = await this.authService.signup(email, password);
        await this.afs.collection('users').doc(user?.uid).set({
          uid: user?.uid,
          email,
          displayName,
          role: 'user',
          isApproved: false
        });
        this.successMessage = '認証メールを送信しました。メールをご確認ください。';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      } catch (error: any) {
        console.error('登録エラー:', error);
        if (error.code === 'auth/email-already-in-use') {
          this.registerError = 'このメールアドレスは既に使用されています。';
        } else if (error.code === 'auth/invalid-email') {
          this.registerError = '無効なメールアドレスです。';
        } else if (error.code === 'auth/weak-password') {
          this.registerError = 'パスワードが弱すぎます。';
        } else {
          this.registerError = `登録に失敗しました: ${error.message}`;
        }
      }
    }
  }

  async onRegisterAdmin() {
    if (this.registerForm.valid) {
      const { email, password, displayName } = this.registerForm.value;
      try {
        const user = await this.authService.signup(email, password);
        const userData = {
          uid: user?.uid,
          email,
          displayName,
          role: 'admin',
          isApproved: false
        };
        await this.afs.collection('users').doc(user?.uid).set(userData);
        this.successMessage = '認証メールを送信しました。メールをご確認ください。';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      } catch (error: any) {
        console.error('管理者登録エラー:', error);
        if (error.code === 'auth/email-already-in-use') {
          this.registerError = 'このメールアドレスは既に使用されています。';
        } else if (error.code === 'auth/invalid-email') {
          this.registerError = '無効なメールアドレスです。';
        } else if (error.code === 'auth/weak-password') {
          this.registerError = 'パスワードが弱すぎます。';
        } else {
          this.registerError = `管理者登録に失敗しました: ${error.message}`;
        }
      }
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }
} 