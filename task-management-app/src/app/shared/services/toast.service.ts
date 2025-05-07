import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: ToastMessage['type'] = 'info') {
    console.log('ToastService.show called:', { message, type });
    
    // すでに同じ内容・typeの通知が存在する場合は追加しない
    const exists = this.toastsSubject.value.some(
      t => t.message === message && t.type === type
    );
    if (exists) {
      console.log('Toast already exists, skipping');
      return;
    }

    const id = crypto.randomUUID();
    const toast: ToastMessage = { id, message, type };
    console.log('Adding new toast:', toast);
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
  }

  remove(id: string) {
    console.log('Removing toast:', id);
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  clearAll() {
    console.log('Clearing all toasts');
    this.toastsSubject.next([]);
  }
} 