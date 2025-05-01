import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, catchError } from 'rxjs';
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
    console.log('Creating task with data:', task);
    const newTask: Omit<Task, 'id'> = {
      ...task,
      status: task.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.firestore.collection('tasks').add(newTask)
        .then(docRef => {
          console.log('Task created in Firestore:', docRef.id);
          // タスクに期限がある場合、カレンダーに登録
          if (newTask.dueDate) {
            console.log('Attempting to create calendar event for task:', {
              id: docRef.id,
              title: newTask.title,
              dueDate: newTask.dueDate
            });

            this.calendarService.createEventFromTask({
              ...newTask,
              id: docRef.id
            }).pipe(
              catchError(error => {
                console.error('Calendar API Error:', error);
                if (error.error && error.error.error) {
                  console.error('Calendar API Error Details:', error.error.error);
                }
                throw error;
              })
            ).subscribe(
              calendarEvent => {
                console.log('Calendar event created successfully:', calendarEvent);
                // カレンダーイベントIDをタスクに保存
                this.firestore.collection('tasks').doc(docRef.id)
                  .update({ calendarEventId: calendarEvent.id })
                  .then(() => {
                    console.log('Task updated with calendar event ID:', calendarEvent.id);
                    resolve(docRef);
                  })
                  .catch(error => {
                    console.error('Error updating task with calendar event ID:', error);
                    reject(error);
                  });
              },
              error => {
                console.error('Error creating calendar event:', error);
                // カレンダーイベントの作成に失敗しても、タスクは作成済みなのでresolveする
                resolve(docRef);
              }
            );
          } else {
            console.log('No due date set, skipping calendar event creation');
            resolve(docRef);
          }
        })
        .catch(error => {
          console.error('Error creating task in Firestore:', error);
          reject(error);
        });
    });
  }

  // タスクを更新し、カレンダーも更新
  updateTask(id: string, task: Partial<Task>): Promise<void> {
    console.log('Updating task:', id, task);
    return new Promise((resolve, reject) => {
      this.firestore.collection('tasks').doc(id).get()
        .subscribe(doc => {
          const currentTask = doc.data() as Task;
          console.log('Current task data:', currentTask);
          const updatedTask = {
            ...task,
            updatedAt: new Date()
          };

          this.firestore.collection('tasks').doc(id).update(updatedTask)
            .then(() => {
              console.log('Task updated in Firestore');
              // タスクに期限があり、カレンダーイベントIDがある場合、カレンダーを更新
              if (task.dueDate && currentTask.calendarEventId) {
                console.log('Updating calendar event:', currentTask.calendarEventId);
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
                  () => {
                    console.log('Calendar event updated successfully');
                    resolve();
                  },
                  error => {
                    console.error('Error updating calendar event:', error);
                    reject(error);
                  }
                );
              } else {
                console.log('No calendar event to update');
                resolve();
              }
            })
            .catch(error => {
              console.error('Error updating task in Firestore:', error);
              reject(error);
            });
        });
    });
  }

  // タスクを削除し、カレンダーからも削除
  deleteTask(id: string): Promise<void> {
    console.log('Deleting task:', id);
    return new Promise((resolve, reject) => {
      this.firestore.collection('tasks').doc(id).get()
        .subscribe(doc => {
          const task = doc.data() as Task;
          console.log('Task data before deletion:', task);
          this.firestore.collection('tasks').doc(id).delete()
            .then(() => {
              console.log('Task deleted from Firestore');
              // カレンダーイベントIDがある場合、カレンダーからも削除
              if (task.calendarEventId) {
                console.log('Deleting calendar event:', task.calendarEventId);
                this.calendarService.deleteEvent(task.calendarEventId)
                  .subscribe(
                    () => {
                      console.log('Calendar event deleted successfully');
                      resolve();
                    },
                    error => {
                      console.error('Error deleting calendar event:', error);
                      reject(error);
                    }
                  );
              } else {
                console.log('No calendar event to delete');
                resolve();
              }
            })
            .catch(error => {
              console.error('Error deleting task from Firestore:', error);
              reject(error);
            });
        });
    });
  }

  // タスクを取得
  getTasks(): Observable<Task[]> {
    return this.firestore.collection<Task>('tasks').valueChanges({ idField: 'id' });
  }
} 