import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FilterPreset {
  id?: string;
  name: string;
  category: string;
  errorType: string;
  minErrorCount: number;
  userFilter: string;
  createdAt: Date;
  createdBy: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private readonly COLLECTION_NAME = 'filter_presets';
  private presetsSubject = new BehaviorSubject<FilterPreset[]>([]);
  presets$ = this.presetsSubject.asObservable();
  categories$ = this.presets$.pipe(
    map(presets => [...new Set(presets.map(p => p.category))].sort())
  );

  constructor(private firestore: Firestore) {
    this.loadPresets();
  }

  private async loadPresets(): Promise<void> {
    try {
      const presetsRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(presetsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
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

  async deletePresets(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map(id => this.deletePreset(id)));
    } catch (error) {
      console.error('フィルタープリセットの一括削除に失敗しました:', error);
      throw error;
    }
  }

  searchPresets(searchTerm: string, category?: string): Observable<FilterPreset[]> {
    return this.presets$.pipe(
      map(presets => {
        let filtered = presets;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(preset =>
            preset.name.toLowerCase().includes(term) ||
            preset.tags.some(tag => tag.toLowerCase().includes(term))
          );
        }
        if (category) {
          filtered = filtered.filter(preset => preset.category === category);
        }
        return filtered;
      })
    );
  }

  generateShareUrl(preset: FilterPreset): string {
    const params = new URLSearchParams({
      errorType: preset.errorType,
      minErrorCount: preset.minErrorCount.toString(),
      userFilter: preset.userFilter,
      category: preset.category
    });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  parseShareUrl(): Partial<FilterPreset> {
    const params = new URLSearchParams(window.location.search);
    return {
      errorType: params.get('errorType') || '',
      minErrorCount: parseInt(params.get('minErrorCount') || '0', 10),
      userFilter: params.get('userFilter') || '',
      category: params.get('category') || ''
    };
  }
} 