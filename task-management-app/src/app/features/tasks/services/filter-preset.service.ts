import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

export interface FilterPreset {
  id?: string;
  name: string;
  errorType: string;
  minErrorCount: number;
  userFilter: string;
  createdAt: Date;
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private readonly COLLECTION_NAME = 'filter_presets';
  private presetsSubject = new BehaviorSubject<FilterPreset[]>([]);
  presets$ = this.presetsSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.loadPresets();
  }

  private async loadPresets(): Promise<void> {
    try {
      const presetsRef = collection(this.firestore, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(presetsRef);
      const presets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate()
      })) as FilterPreset[];
      this.presetsSubject.next(presets);
    } catch (error) {
      console.error('フィルタープリセットの読み込みに失敗しました:', error);
    }
  }

  async savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): Promise<void> {
    try {
      const presetsRef = collection(this.firestore, this.COLLECTION_NAME);
      await addDoc(presetsRef, {
        ...preset,
        createdAt: new Date()
      });
      await this.loadPresets();
    } catch (error) {
      console.error('フィルタープリセットの保存に失敗しました:', error);
      throw error;
    }
  }

  async deletePreset(id: string): Promise<void> {
    try {
      const presetDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(presetDoc);
      await this.loadPresets();
    } catch (error) {
      console.error('フィルタープリセットの削除に失敗しました:', error);
      throw error;
    }
  }

  generateShareUrl(preset: FilterPreset): string {
    const params = new URLSearchParams({
      errorType: preset.errorType,
      minErrorCount: preset.minErrorCount.toString(),
      userFilter: preset.userFilter
    });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  parseShareUrl(): Partial<FilterPreset> {
    const params = new URLSearchParams(window.location.search);
    return {
      errorType: params.get('errorType') || '',
      minErrorCount: parseInt(params.get('minErrorCount') || '0', 10),
      userFilter: params.get('userFilter') || ''
    };
  }
} 