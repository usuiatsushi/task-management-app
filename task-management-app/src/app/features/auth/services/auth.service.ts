import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AppUser } from '../models/user.model';
import { BehaviorSubject } from 'rxjs';
import { GoogleAuthProvider } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public afAuth: AngularFireAuth;
  currentUser$ = new BehaviorSubject<AppUser | null>(null);

  constructor(afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.afAuth = afAuth;
    this.afAuth.authState.subscribe(async user => {
      if (user) {
        const userDoc = await this.afs.collection('users').doc<AppUser>(user.uid).ref.get();
        if (userDoc.exists) {
          this.currentUser$.next(userDoc.data() as AppUser);
        } else {
          // 新規ユーザーの場合はrole:userで登録
          const newUser: AppUser = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: 'user'
          };
          await this.afs.collection('users').doc(user.uid).set(newUser);
          this.currentUser$.next(newUser);
        }
      } else {
        this.currentUser$.next(null);
      }
    });
  }

  get currentUserRole(): 'admin' | 'user' | null {
    return this.currentUser$.value?.role || null;
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await this.afAuth.signInWithPopup(provider);
    const user = result.user;
    if (user) {
      // 既存ユーザーの確認
      const userDoc = await this.afs.collection('users').doc(user.uid).ref.get();
      if (userDoc.exists) {
        // 既存ユーザーの場合は既存のデータを保持
        await this.afs.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
        }, { merge: true });
      } else {
        // 新規ユーザーの場合のみisApproved: falseを設定
        await this.afs.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'user',
          isApproved: false
        });
      }
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('パスワードリセットメールの送信に失敗しました:', error);
      throw error;
    }
  }
} 