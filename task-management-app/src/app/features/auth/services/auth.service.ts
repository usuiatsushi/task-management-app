import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<boolean>(false);
  authState$ = this.authState.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    onAuthStateChanged(this.auth, async user => {
      if (user) {
        console.log('Auth state changed: Logged in', user.uid);
        this.authState.next(true);
        await this.createOrUpdateUser(user);
      } else {
        console.log('Auth state changed: Logged out');
        this.authState.next(false);
      }
    });
  }

  private async createOrUpdateUser(user: any): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date()
        });
        console.log('New user created in Firestore');
      }
    } catch (error) {
      console.error('ユーザーデータの作成に失敗しました:', error);
    }
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

  async signup(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }
} 