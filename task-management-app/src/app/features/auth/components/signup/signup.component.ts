import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="signup-container">
      <h2>新規登録</h2>
      <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
        <mat-form-field>
          <mat-label>メールアドレス</mat-label>
          <input matInput type="email" formControlName="email">
        </mat-form-field>
        <mat-form-field>
          <mat-label>パスワード</mat-label>
          <input matInput type="password" formControlName="password">
        </mat-form-field>
        <button mat-raised-button color="primary" type="submit">登録</button>
      </form>
    </div>
  `,
  styles: [`
    .signup-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `]
})
export class SignupComponent {
  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.signupForm.valid) {
      try {
        await this.authService.signup(
          this.signupForm.value.email,
          this.signupForm.value.password
        );
        this.router.navigate(['/tasks']);
      } catch (error) {
        console.error('Signup failed:', error);
      }
    }
  }
} 