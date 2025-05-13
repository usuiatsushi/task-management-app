import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Auth } from '@angular/fire/auth';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let afsSpy: jasmine.SpyObj<AngularFirestore>;
  let afAuthSpy: jasmine.SpyObj<AngularFireAuth>;
  let authSpy: jasmine.SpyObj<Auth>;
  let router: Router;

  const mockFirebaseConfig = {
    apiKey: 'AIzaSyDtfvkdvkps6QwTjwsEJ8-CBkl6TyGR-jU',
    authDomain: 'kensyu10095.firebaseapp.com',
    projectId: 'kensyu10095',
    storageBucket: 'kensyu10095.firebasestorage.app',
    messagingSenderId: '263465065376',
    appId: '1:263465065376:web:3cb93f8c54e4ceffeee2c5',
    measurementId: 'G-Z3FRW7D9BT'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'signInWithGoogle',
      'resetPassword'
    ]);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    afsSpy = jasmine.createSpyObj('AngularFirestore', ['collection']);
    afAuthSpy = jasmine.createSpyObj('AngularFireAuth', ['signInWithPopup', 'signInWithEmailAndPassword', 'sendPasswordResetEmail'], {
      authState: of(null)
    });
    authSpy = jasmine.createSpyObj('Auth', ['currentUser'], {
      currentUser: null
    });

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: AngularFirestore, useValue: afsSpy },
        { provide: AngularFireAuth, useValue: afAuthSpy },
        { provide: Auth, useValue: authSpy },
        { provide: FIREBASE_OPTIONS, useValue: mockFirebaseConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should require password', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should handle password reset', async () => {
    const email = 'test@example.com';
    component.resetPasswordEmail = email;
    authServiceSpy.resetPassword.and.returnValue(Promise.resolve());
    
    await component.resetPassword();
    
    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith(email);
    expect(component.resetMessage).toBe('パスワードリセットメールを送信しました。メールをご確認ください。');
  });

  it('should show error message for invalid password reset email', async () => {
    const email = 'invalid@example.com';
    component.resetPasswordEmail = email;
    authServiceSpy.resetPassword.and.returnValue(Promise.reject(new Error('Invalid email')));
    
    await component.resetPassword();
    
    expect(component.resetError).toBe('パスワードリセットメールの送信に失敗しました。');
  });

  it('should handle form submission with invalid form', () => {
    component.loginForm.setErrors({ invalid: true });
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should handle Google login', async () => {
    const mockUserCredential = {
      user: {
        uid: '123',
        email: 'test@example.com'
      }
    };
    authServiceSpy.signInWithGoogle.and.returnValue(Promise.resolve(mockUserCredential as any));
    await component.loginWithGoogle();
    expect(authServiceSpy.signInWithGoogle).toHaveBeenCalled();
  });
}); 