import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private authService: AuthService,
    private afs: AngularFirestore
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        const { email, password } = this.loginForm.value;
        await signInWithEmailAndPassword(this.auth, email, password);
        // ユーザーのroleを確認
        const userSnap = await this.afs.collection('users', ref => ref.where('email', '==', email)).get().toPromise();
        if (userSnap && !userSnap.empty) {
          const userData = userSnap.docs[0].data() as any;
          if (userData.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/projects']);
          }
        } else {
          this.router.navigate(['/projects']);
        }
      } catch (error) {
        this.errorMessage = 'ログインに失敗しました。もう一度お試しください。';
      }
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      // Googleログイン後もroleを確認
      const user = await this.auth.currentUser;
      if (user) {
        const userSnap = await this.afs.collection('users', ref => ref.where('email', '==', user.email)).get().toPromise();
        if (userSnap && !userSnap.empty) {
          const userData = userSnap.docs[0].data() as any;
          if (userData.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/projects']);
          }
        } else {
          this.router.navigate(['/projects']);
        }
      }
    } catch (error) {
      this.errorMessage = 'Googleログインに失敗しました。時間をおいて再度お試しください。';
      console.error(error);
    }
  }

  async onAdminLogin() {
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    if (!email || !password) {
      this.loginError = 'メールアドレスとパスワードを入力してください';
      return;
    }
    try {
      // まず認証
      await signInWithEmailAndPassword(this.auth, email, password);
      // 認証後にFirestoreからroleを取得
      const userSnap = await this.afs.collection('users', ref => ref.where('email', '==', email)).get().toPromise();
      if (userSnap && !userSnap.empty) {
        const userData = userSnap.docs[0].data() as any;
        if (userData.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.loginError = '管理者権限がありません';
        }
      } else {
        this.loginError = 'ユーザーが見つかりません';
      }
    } catch (error) {
      console.error('管理者ログインエラー:', error);
      this.loginError = 'ログインに失敗しました';
    }
  }
} 