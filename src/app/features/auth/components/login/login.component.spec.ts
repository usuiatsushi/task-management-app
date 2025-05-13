import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Auth } from '@angular/fire/auth';

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
    apiKey: 'dummy',
    authDomain: 'dummy',
    projectId: 'dummy',
    storageBucket: 'dummy',
    messagingSenderId: 'dummy',
    appId: 'dummy'
  };

  beforeEach(async () => {
    // 既存のFirebaseインスタンスをクリーンアップ
    const apps = getApps();
    await Promise.all(apps.map(app => deleteApp(app)));

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
        RouterTestingModule
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
    component.loginForm.get('email')?.setValue(email);
    authServiceSpy.resetPassword.and.returnValue(Promise.resolve());
    
    await component.resetPassword();
    
    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith(email);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'パスワードリセットメールを送信しました',
      '閉じる',
      { duration: 3000 }
    );
  });

  it('should show error message for invalid password reset email', async () => {
    const email = 'invalid@example.com';
    component.loginForm.get('email')?.setValue(email);
    authServiceSpy.resetPassword.and.returnValue(Promise.reject(new Error('Invalid email')));
    
    await component.resetPassword();
    
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'パスワードリセットメールの送信に失敗しました',
      '閉じる',
      { duration: 3000 }
    );
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