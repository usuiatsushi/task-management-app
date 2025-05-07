import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
  authState$: Observable<any>;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    this.authState$ = this.afAuth.authState;
    this.afAuth.authState.subscribe(user => {
      this.userSubject.next(user);
    });
  }

  async getGoogleAuthToken(): Promise<string> {
    try {
      const user = await this.afAuth.currentUser;
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      
      const result = await this.afAuth.signInWithPopup(provider);
      const credential = result.credential as any;
      
      if (!credential?.accessToken) {
        throw new Error('認証トークンの取得に失敗しました');
      }
      
      return credential.accessToken;
    } catch (error: any) {
      console.error('Google認証に失敗しました:', error);
      if (error.code === 'auth/cancelled-popup-request') {
        throw error;
      }
      throw new Error('認証に失敗しました');
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.afAuth.signOut();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('サインアウトに失敗しました:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.afAuth.currentUser;
  }

  async signup(email: string, password: string) {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      console.error('サインアップに失敗しました:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      console.error('ログインに失敗しました:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await this.afAuth.signInWithPopup(provider);
      return result.user;
    } catch (error) {
      console.error('Googleログインに失敗しました:', error);
      throw error;
    }
  }
} 