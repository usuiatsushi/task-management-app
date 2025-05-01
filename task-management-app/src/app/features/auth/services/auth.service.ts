import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<boolean>(false);
  authState$ = this.authState.asObservable();

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, user => {
      if (user) {
        console.log('Auth state changed: Logged in', user.uid);
        this.authState.next(true);
      } else {
        console.log('Auth state changed: Logged out');
        this.authState.next(false);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('ログインに失敗しました:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }
} 