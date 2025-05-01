import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private afAuth: AngularFireAuth) {
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
    } catch (error) {
      console.error('Google認証に失敗しました:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      await this.afAuth.signInWithPopup(provider);
    } catch (error) {
      console.error('Google認証に失敗しました:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.afAuth.signOut();
    } catch (error) {
      console.error('サインアウトに失敗しました:', error);
      throw error;
    }
  }
} 