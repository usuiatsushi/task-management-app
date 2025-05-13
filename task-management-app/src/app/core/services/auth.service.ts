import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { BehaviorSubject, Observable, map, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
  authState$: Observable<any>;
  isAdmin$: Observable<boolean>;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private firestore: AngularFirestore
  ) {
    this.authState$ = this.afAuth.authState;
    this.afAuth.authState.subscribe(user => {
      console.log('現在のユーザー情報:', user);
      this.userSubject.next(user);
    });

    // 管理者判定のObservable
    this.isAdmin$ = this.user$.pipe(
      switchMap(user => {
        if (!user) return new Observable<boolean>(observer => observer.next(false));
        return this.firestore.doc(`users/${user.uid}`).valueChanges().pipe(
          map((userData: any) => {
            console.log('Firestoreユーザーデータ:', userData);
            return userData?.role === 'admin';
          })
        );
      })
    );
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
      await this.router.navigate(['/auth/login']);
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

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await this.afAuth.signInWithPopup(provider);
      if (result.user) {
        await this.router.navigate(['/projects']);
      }
      return result;
    } catch (error) {
      console.error('Googleログインエラー:', error);
      throw error;
    }
  }
} 