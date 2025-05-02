import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, DocumentData } from '@angular/fire/firestore';
import * as TaskActions from './task.actions';
import { Task } from './task.model';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private firestore = inject(Firestore);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      mergeMap(() =>
        from(getDocs(collection(this.firestore, 'tasks'))).pipe(
          map(snapshot => {
            const tasks = snapshot.docs.map(doc => {
              const data = doc.data() as DocumentData;
              return {
                id: doc.id,
                ...data,
                dueDate: data['dueDate']?.toDate(),
                createdAt: data['createdAt']?.toDate(),
                updatedAt: data['updatedAt']?.toDate()
              } as Task;
            });
            return TaskActions.loadTasksSuccess({ tasks });
          }),
          catchError(error => of(TaskActions.loadTasksFailure({ error: error.message })))
        )
      )
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.createTask),
      mergeMap(({ task }) => {
        const now = new Date();
        const taskData = {
          title: task.title,
          description: task.description,
          category: task.category,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
          assignedTo: task.assignedTo,
          createdAt: now,
          updatedAt: now
        };
        return from(addDoc(collection(this.firestore, 'tasks'), taskData)).pipe(
          map(docRef => {
            const newTask = {
              ...task,
              id: docRef.id,
              createdAt: now,
              updatedAt: now
            } as Task;
            return TaskActions.createTaskSuccess({ task: newTask });
          }),
          catchError(error => of(TaskActions.createTaskFailure({ error: error.message })))
        );
      })
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.updateTask),
      mergeMap(({ task }) => {
        const taskData = {
          title: task.title,
          description: task.description,
          category: task.category,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
          assignedTo: task.assignedTo,
          updatedAt: new Date()
        };
        return from(updateDoc(doc(this.firestore, 'tasks', task.id), taskData)).pipe(
          map(() => TaskActions.updateTaskSuccess({ task })),
          catchError(error => of(TaskActions.updateTaskFailure({ error: error.message })))
        );
      })
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.deleteTask),
      mergeMap(({ id }) =>
        from(deleteDoc(doc(this.firestore, 'tasks', id))).pipe(
          map(() => TaskActions.deleteTaskSuccess({ id })),
          catchError(error => of(TaskActions.deleteTaskFailure({ error: error.message })))
        )
      )
    )
  );
} 