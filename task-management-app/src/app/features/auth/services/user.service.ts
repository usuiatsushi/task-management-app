import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore) {}

  async getAllUsers(): Promise<any[]> {
    try {
      console.log('Fetching users from Firestore...');
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Users fetched:', users.length);
      return users;
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      return [];
    }
  }
} 