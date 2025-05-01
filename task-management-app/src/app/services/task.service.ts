import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { CalendarService } from './calendar.service';
import { Task } from '../interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(
    private firestore: AngularFirestore,
    private calendarService: CalendarService
  ) {}

  // タスクを作成し、カレンダーにも登録
  createTask(task: Omit<Task, 'id' | 'calendarEventId' | 'createdAt' | 'updatedAt'>): Promise<any> {
    const newTask: Omit<Task, 'id'> = {
      ...task,
      status: task.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.firestore.collection('tasks').add(newTask)
        .then(docRef => {
          // タスクに期限がある場合、カレンダーに登録
          if (newTask.dueDate) {
            this.calendarService.createEventFromTask(newTask)
              .subscribe(
                calendarEvent => {
                  // カレンダーイベントIDをタスクに保存
                  this.firestore.collection('tasks').doc(docRef.id)
                    .update({ calendarEventId: calendarEvent.id })
                    .then(() => resolve(docRef))
                    .catch(error => reject(error));
                },
                error => reject(error)
              );
          } else {
            resolve(docRef);
          }
        })
        .catch(error => reject(error));
    });
  }

  // タスクを更新し、カレンダーも更新
  updateTask(id: string, task: Partial<Task>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('tasks').doc(id).get()
        .subscribe(doc => {
          const currentTask = doc.data() as Task;
          const updatedTask = {
            ...task,
            updatedAt: new Date()
          };

          this.firestore.collection('tasks').doc(id).update(updatedTask)
            .then(() => {
              // タスクに期限があり、カレンダーイベントIDがある場合、カレンダーを更新
              if (task.dueDate && currentTask.calendarEventId) {
                this.calendarService.updateEvent(currentTask.calendarEventId, {
                  summary: task.title,
                  description: task.description,
                  start: {
                    dateTime: task.dueDate,
                    timeZone: 'Asia/Tokyo'
                  },
                  end: {
                    dateTime: task.dueDate,
                    timeZone: 'Asia/Tokyo'
                  }
                }).subscribe(
                  () => resolve(),
                  error => reject(error)
                );
              } else {
                resolve();
              }
            })
            .catch(error => reject(error));
        });
    });
  }

  // タスクを削除し、カレンダーからも削除
  deleteTask(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('tasks').doc(id).get()
        .subscribe(doc => {
          const task = doc.data() as Task;
          this.firestore.collection('tasks').doc(id).delete()
            .then(() => {
              // カレンダーイベントIDがある場合、カレンダーからも削除
              if (task.calendarEventId) {
                this.calendarService.deleteEvent(task.calendarEventId)
                  .subscribe(
                    () => resolve(),
                    error => reject(error)
                  );
              } else {
                resolve();
              }
            })
            .catch(error => reject(error));
        });
    });
  }

  // タスクを取得
  getTasks(): Observable<Task[]> {
    return this.firestore.collection<Task>('tasks').valueChanges({ idField: 'id' });
  }
} 