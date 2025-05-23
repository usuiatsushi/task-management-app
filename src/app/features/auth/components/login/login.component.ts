import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, signInWithEmailAndPassword, signOut, sendEmailVerification } from '@angular/fire/auth';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { getAuth } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loginError = '';
  resetPasswordEmail: string = '';
  resetMessage: string = '';
  resetError: string = '';
  emailVerificationError: string = '';
  showResendVerification: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private authService: AuthService,
    private afs: AngularFirestore,
    private snackBar: MatSnackBar
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
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(this.auth);
          this.errorMessage = 'メール認証が完了していません。メールをご確認ください。';
          this.showResendVerification = true;
          return;
        }
        this.showResendVerification = false;
        // ユーザーのroleとisApprovedを確認
        const userSnap = await this.afs.collection('users', ref => ref.where('email', '==', email)).get().toPromise();
        if (userSnap && !userSnap.empty) {
          const userData = userSnap.docs[0].data() as any;
          if (userData.isApproved === false) {
            await signOut(this.auth);
            this.errorMessage = '管理者の承認待ちです。ログインできません。';
            return;
          }
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
      // Googleログイン後もroleとisApprovedを確認
      const user = await this.auth.currentUser;
      if (user) {
        const userSnap = await this.afs.collection('users', ref => ref.where('email', '==', user.email)).get().toPromise();
        if (userSnap && !userSnap.empty) {
          const userData = userSnap.docs[0].data() as any;
          if (userData.isApproved === false) {
            await signOut(this.auth);
            this.errorMessage = '管理者の承認待ちです。ログインできません。';
            return;
          }
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
      // 認証後にFirestoreからroleとisApprovedを取得
      const userSnap = await this.afs.collection('users', ref => ref.where('email', '==', email)).get().toPromise();
      if (userSnap && !userSnap.empty) {
        const userData = userSnap.docs[0].data() as any;
        if (userData.isApproved === false) {
          await signOut(this.auth);
          this.loginError = '管理者の承認待ちです。ログインできません。';
          return;
        }
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

  async resetPassword() {
    this.resetMessage = '';
    this.resetError = '';
    if (!this.resetPasswordEmail) {
      this.resetError = 'メールアドレスを入力してください';
      return;
    }
    try {
      await this.authService.resetPassword(this.resetPasswordEmail);
      this.resetMessage = 'パスワードリセットメールを送信しました。メールをご確認ください。';
    } catch (error) {
      this.resetError = 'パスワードリセットメールの送信に失敗しました。';
    }
  }
} 