import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Stakeholder, StakeholderGroup, StakeholderMatrix } from '../models/stakeholder.model';

@Injectable({
  providedIn: 'root'
})
export class StakeholderService {
  constructor(private firestore: Firestore) {}

  // ステークホルダーの取得
  async getStakeholder(id: string): Promise<Stakeholder | null> {
    const docRef = doc(this.firestore, 'stakeholders', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Stakeholder : null;
  }

  // ステークホルダー一覧の取得
  async getStakeholders(): Promise<Stakeholder[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'stakeholders'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stakeholder);
  }

  // ステークホルダーの作成
  async createStakeholder(stakeholder: Omit<Stakeholder, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'stakeholders'), {
      ...stakeholder,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  // ステークホルダーの更新
  async updateStakeholder(id: string, stakeholder: Partial<Stakeholder>): Promise<void> {
    const docRef = doc(this.firestore, 'stakeholders', id);
    await updateDoc(docRef, {
      ...stakeholder,
      updatedAt: Timestamp.now()
    });
  }

  // ステークホルダーの削除
  async deleteStakeholder(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'stakeholders', id);
    await deleteDoc(docRef);
  }

  // ステークホルダーグループの取得
  async getStakeholderGroup(id: string): Promise<StakeholderGroup | null> {
    const docRef = doc(this.firestore, 'stakeholderGroups', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as StakeholderGroup : null;
  }

  // ステークホルダーグループ一覧の取得
  async getStakeholderGroups(): Promise<StakeholderGroup[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'stakeholderGroups'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StakeholderGroup);
  }

  // ステークホルダーグループの作成
  async createStakeholderGroup(group: Omit<StakeholderGroup, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'stakeholderGroups'), {
      ...group,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  // ステークホルダーグループの更新
  async updateStakeholderGroup(id: string, group: Partial<StakeholderGroup>): Promise<void> {
    const docRef = doc(this.firestore, 'stakeholderGroups', id);
    await updateDoc(docRef, {
      ...group,
      updatedAt: Timestamp.now()
    });
  }

  // ステークホルダーグループの削除
  async deleteStakeholderGroup(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'stakeholderGroups', id);
    await deleteDoc(docRef);
  }

  // タスクのステークホルダーマトリックスの取得
  async getStakeholderMatrix(taskId: string): Promise<StakeholderMatrix | null> {
    const q = query(collection(this.firestore, 'stakeholderMatrices'), where('taskId', '==', taskId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as unknown as StakeholderMatrix;
  }

  // タスクのステークホルダーマトリックスの作成
  async createStakeholderMatrix(matrix: Omit<StakeholderMatrix, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'stakeholderMatrices'), {
      ...matrix,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  // タスクのステークホルダーマトリックスの更新
  async updateStakeholderMatrix(id: string, matrix: Partial<StakeholderMatrix>): Promise<void> {
    const docRef = doc(this.firestore, 'stakeholderMatrices', id);
    await updateDoc(docRef, {
      ...matrix,
      updatedAt: Timestamp.now()
    });
  }
} 