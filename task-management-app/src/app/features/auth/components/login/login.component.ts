import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private authService: AuthService
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
        this.router.navigate(['/tasks']);
      } catch (error) {
        this.errorMessage = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      }
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.errorMessage = 'Googleログインに失敗しました。';
      console.error(error);
    }
  }
} 