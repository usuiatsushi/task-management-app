import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<string[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  private defaultCategories = [
    '技術的課題',
    '業務フロー',
    'バグ修正',
    '新機能・改善提案',
    'その他'
  ];

  constructor(private firestore: Firestore) {
    this.loadCategories();
  }

  private async loadCategories() {
    try {
      const categoriesRef = collection(this.firestore, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      
      const categories = querySnapshot.docs.map(doc => doc.data()['name']);
      const allCategories = [...new Set([...this.defaultCategories, ...categories])];
      this.categoriesSubject.next(allCategories);
    } catch (error) {
      console.error('カテゴリの読み込みに失敗しました:', error);
      this.categoriesSubject.next(this.defaultCategories);
    }
  }

  async addCategory(name: string) {
    try {
      const categoriesRef = collection(this.firestore, 'categories');
      await addDoc(categoriesRef, { name });
      await this.loadCategories();
    } catch (error) {
      console.error('カテゴリの追加に失敗しました:', error);
      throw error;
    }
  }

  async deleteCategory(name: string) {
    try {
      const categoriesRef = collection(this.firestore, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      const docToDelete = querySnapshot.docs.find(doc => doc.data()['name'] === name);
      
      if (docToDelete) {
        await deleteDoc(doc(this.firestore, 'categories', docToDelete.id));
        await this.loadCategories();
      }
    } catch (error) {
      console.error('カテゴリの削除に失敗しました:', error);
      throw error;
    }
  }
} 