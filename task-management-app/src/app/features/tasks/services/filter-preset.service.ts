import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc } from '@angular/fire/firestore';
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
  version: number;
  lastUsed?: Date;
  usageCount: number;
}

export interface PresetHistory {
  id?: string;
  presetId: string;
  version: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private readonly COLLECTION_NAME = 'filter_presets';
  private readonly HISTORY_COLLECTION_NAME = 'preset_history';
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
        createdAt: doc.data()['createdAt']?.toDate(),
        lastUsed: doc.data()['lastUsed']?.toDate()
      })) as FilterPreset[];
      this.presetsSubject.next(presets);
    } catch (error) {
      console.error('フィルタープリセットの読み込みに失敗しました:', error);
    }
  }

  async savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt' | 'version' | 'usageCount'>): Promise<void> {
    try {
      const presetsRef = collection(this.firestore, this.COLLECTION_NAME);
      const newPreset: Omit<FilterPreset, 'id'> = {
        ...preset,
        createdAt: new Date(),
        version: 1,
        usageCount: 0
      };
      await addDoc(presetsRef, newPreset);
      await this.loadPresets();
    } catch (error) {
      console.error('フィルタープリセットの保存に失敗しました:', error);
      throw error;
    }
  }

  async updatePreset(id: string, changes: Partial<FilterPreset>): Promise<void> {
    try {
      const presetDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      const currentPreset = this.presetsSubject.value.find(p => p.id === id);
      if (!currentPreset) throw new Error('プリセットが見つかりません');

      const history: Omit<PresetHistory, 'id'> = {
        presetId: id,
        version: currentPreset.version + 1,
        changes: Object.entries(changes).map(([field, newValue]) => ({
          field,
          oldValue: currentPreset[field as keyof FilterPreset],
          newValue
        })),
        timestamp: new Date(),
        userId: 'current-user' // TODO: 実際のユーザーIDを使用
      };

      const historyRef = collection(this.firestore, this.HISTORY_COLLECTION_NAME);
      await addDoc(historyRef, history);

      await updateDoc(presetDoc, {
        ...changes,
        version: currentPreset.version + 1
      });

      await this.loadPresets();
    } catch (error) {
      console.error('フィルタープリセットの更新に失敗しました:', error);
      throw error;
    }
  }

  async recordUsage(id: string): Promise<void> {
    try {
      const presetDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      const currentPreset = this.presetsSubject.value.find(p => p.id === id);
      if (!currentPreset) throw new Error('プリセットが見つかりません');

      await updateDoc(presetDoc, {
        lastUsed: new Date(),
        usageCount: (currentPreset.usageCount || 0) + 1
      });

      await this.loadPresets();
    } catch (error) {
      console.error('使用履歴の記録に失敗しました:', error);
      throw error;
    }
  }

  async getPresetHistory(presetId: string): Promise<PresetHistory[]> {
    try {
      const historyRef = collection(this.firestore, this.HISTORY_COLLECTION_NAME);
      const q = query(historyRef, where('presetId', '==', presetId), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data()['timestamp']?.toDate()
      })) as PresetHistory[];
    } catch (error) {
      console.error('履歴の取得に失敗しました:', error);
      throw error;
    }
  }

  exportPresets(): string {
    const presets = this.presetsSubject.value;
    return JSON.stringify(presets, null, 2);
  }

  async importPresets(json: string): Promise<void> {
    try {
      const presets = JSON.parse(json) as FilterPreset[];
      const presetsRef = collection(this.firestore, this.COLLECTION_NAME);

      for (const preset of presets) {
        const { id, ...presetData } = preset;
        await addDoc(presetsRef, {
          ...presetData,
          createdAt: new Date(),
          version: 1,
          usageCount: 0
        });
      }

      await this.loadPresets();
    } catch (error) {
      console.error('プリセットのインポートに失敗しました:', error);
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