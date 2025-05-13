import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;
  let afAuthSpy: jasmine.SpyObj<AngularFireAuth>;
  let afsSpy: jasmine.SpyObj<AngularFirestore>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    afAuthSpy = jasmine.createSpyObj('AngularFireAuth', ['dummy']);
    afsSpy = jasmine.createSpyObj('AngularFirestore', ['collection']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['signup']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AngularFireAuth, useValue: afAuthSpy },
        { provide: AngularFirestore, useValue: afsSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: FIREBASE_OPTIONS, useValue: {
          apiKey: 'AIzaSyDtfvkdvkps6QwTjwsEJ8-CBkl6TyGR-jU',
          authDomain: 'kensyu10095.firebaseapp.com',
          projectId: 'kensyu10095',
          storageBucket: 'kensyu10095.firebasestorage.app',
          messagingSenderId: '263465065376',
          appId: '1:263465065376:web:3cb93f8c54e4ceffeee2c5',
          measurementId: 'G-Z3FRW7D9BT'
        }}
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('displayName')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should require email and validate email format', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should require displayName and max length', () => {
    const displayNameControl = component.registerForm.get('displayName');
    displayNameControl?.setValue('');
    expect(displayNameControl?.valid).toBeFalsy();
    displayNameControl?.setValue('a'.repeat(31));
    expect(displayNameControl?.valid).toBeFalsy();
    displayNameControl?.setValue('ユーザー名');
    expect(displayNameControl?.valid).toBeTruthy();
  });

  it('should require password, min length, and pattern', () => {
    const passwordControl = component.registerForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    passwordControl?.setValue('12345');
    expect(passwordControl?.valid).toBeFalsy();
    passwordControl?.setValue('abcdef');
    expect(passwordControl?.valid).toBeFalsy();
    passwordControl?.setValue('abc123');
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should require confirmPassword and match password', () => {
    const passwordControl = component.registerForm.get('password');
    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    passwordControl?.setValue('abc123');
    confirmPasswordControl?.setValue('def456');
    component.registerForm.updateValueAndValidity();
    expect(confirmPasswordControl?.errors?.['passwordMismatch']).toBeTruthy();
    confirmPasswordControl?.setValue('abc123');
    component.registerForm.updateValueAndValidity();
    expect(confirmPasswordControl?.errors).toBeNull();
  });

  it('should not submit if form is invalid', async () => {
    spyOn(component, 'onRegister').and.callThrough();
    component.registerForm.setValue({ email: '', displayName: '', password: '', confirmPassword: '' });
    await component.onRegister();
    expect(router.navigate).not.toHaveBeenCalled();
  });
}); 