import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/core/services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { initializeApp } from 'firebase/app';
import { Component } from '@angular/core';

@Component({
  template: '<router-outlet></router-outlet>'
})
class TestComponent {}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let afsSpy: jasmine.SpyObj<AngularFirestore>;
  let router: Router;

  const mockFirebaseConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('Auth', ['currentUser']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['signInWithGoogle', 'resetPassword']);
    afsSpy = jasmine.createSpyObj('AngularFirestore', ['collection']);

    // Firebaseアプリの初期化
    const app = initializeApp(mockFirebaseConfig);

    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          { path: '', component: TestComponent },
          { path: 'login', component: LoginComponent }
        ]),
        NoopAnimationsModule
      ],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AngularFirestore, useValue: afsSpy },
        { provide: FIREBASE_OPTIONS, useValue: mockFirebaseConfig }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(router, 'createUrlTree').and.returnValue({} as UrlTree);
    spyOn(router, 'serializeUrl').and.returnValue('/');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['email']).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should require password', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['required']).toBeTruthy();

    passwordControl?.setValue('password123');
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should handle form submission with invalid form', () => {
    component.loginForm.setValue({
      email: '',
      password: ''
    });
    component.onSubmit();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle Google login', async () => {
    const mockUserCredential = {
      user: {
        email: 'test@example.com',
        emailVerified: true
      }
    };
    authServiceSpy.signInWithGoogle.and.returnValue(Promise.resolve(mockUserCredential as any));
    await component.loginWithGoogle();
    expect(authServiceSpy.signInWithGoogle).toHaveBeenCalled();
  });

  it('should handle password reset', async () => {
    const testEmail = 'test@example.com';
    component.resetPasswordEmail = testEmail;
    authServiceSpy.resetPassword.and.returnValue(Promise.resolve());
    
    await component.resetPassword();
    
    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith(testEmail);
    expect(component.resetMessage).toBe('パスワードリセットメールを送信しました。メールをご確認ください。');
  });

  it('should show error message for invalid password reset email', async () => {
    component.resetPasswordEmail = '';
    await component.resetPassword();
    expect(component.resetError).toBe('メールアドレスを入力してください');
  });
}); 