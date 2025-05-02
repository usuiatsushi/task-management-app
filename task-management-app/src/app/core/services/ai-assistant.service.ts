import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Task } from '../../features/tasks/models/task.model';
import { AISuggestion } from '../models/ai-assistant.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly COLLECTION_SUGGESTIONS = 'ai_suggestions';
  private readonly API_ENDPOINT = environment.aiApiEndpoint;
  private readonly API_KEY = environment.aiApiKey;

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.API_KEY}`
  });

  constructor(
    private firestore: Firestore,
    private http: HttpClient
  ) {}

  async analyzeTask(task: Task): Promise<AISuggestion> {
    try {
      const response = await this.http.post<AISuggestion>(
        `${this.API_ENDPOINT}/analyze`,
        {
          task: task,
          context: {
            userPreferences: await this.getUserPreferences(),
            historicalData: await this.getHistoricalData()
          }
        },
        { headers: this.headers }
      ).toPromise();

      if (!response) {
        throw new Error('AI分析のレスポンスが空です');
      }

      await this.saveSuggestion(task.id, response);
      return response;
    } catch (error) {
      console.error('タスク分析に失敗しました:', error);
      throw error;
    }
  }

  getSuggestions(taskId: string): Observable<AISuggestion | null> {
    return from(this.getSuggestionsFromFirestore(taskId)).pipe(
      map(suggestion => {
        if (!suggestion || this.isSuggestionOutdated(suggestion)) {
          return null;
        }
        return suggestion;
      }),
      catchError(error => {
        console.error('推奨事項の取得に失敗しました:', error);
        return [null];
      })
    );
  }

  private async getSuggestionsFromFirestore(taskId: string): Promise<AISuggestion | null> {
    try {
      const suggestionsRef = collection(this.firestore, this.COLLECTION_SUGGESTIONS);
      const q = query(
        suggestionsRef,
        where('taskId', '==', taskId)
      );
      const snapshot = await getDocs(q);
      const suggestions = snapshot.docs.map(doc => doc.data() as AISuggestion);
      return suggestions[0] || null;
    } catch (error) {
      console.error('Firestoreからの推奨事項取得に失敗しました:', error);
      return null;
    }
  }

  private isSuggestionOutdated(suggestion: AISuggestion): boolean {
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - suggestion.lastUpdated.getTime() > oneDay;
  }

  private async getUserPreferences(): Promise<any> {
    try {
      const preferencesRef = collection(this.firestore, 'user_preferences');
      const q = query(preferencesRef);
      const snapshot = await getDocs(q);
      return snapshot.docs[0]?.data() || {};
    } catch (error) {
      console.error('ユーザー設定の取得に失敗しました:', error);
      return {};
    }
  }

  private async getHistoricalData(): Promise<any> {
    try {
      const tasksRef = collection(this.firestore, 'tasks');
      const q = query(tasksRef);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('履歴データの取得に失敗しました:', error);
      return [];
    }
  }

  private async saveSuggestion(taskId: string, suggestion: AISuggestion): Promise<void> {
    try {
      const suggestionsRef = collection(this.firestore, this.COLLECTION_SUGGESTIONS);
      await addDoc(suggestionsRef, {
        taskId,
        ...suggestion,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('推奨事項の保存に失敗しました:', error);
      throw error;
    }
  }
} 