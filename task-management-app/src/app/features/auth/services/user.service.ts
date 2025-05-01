import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore) {}

  async getAllUsers(): Promise<any[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      return [];
    }
  }
} 