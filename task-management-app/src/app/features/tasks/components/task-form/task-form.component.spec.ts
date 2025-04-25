import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Firestore } from '@angular/fire/firestore';
import { CalendarService } from '../../../../core/services/calendar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let mockFirestore: any;
  let mockCalendarService: any;
  let mockSnackBar: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockFirestore = {
      collection: jasmine.createSpy('collection').and.returnValue({
        doc: jasmine.createSpy('doc').and.returnValue({
          get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
            exists: true,
            data: () => ({
              title: 'テストタスク',
              description: 'テスト説明',
              category: 'テストカテゴリ',
              status: '未着手',
              priority: '中',
              dueDate: new Date(),
              assignedTo: 'テスト担当者'
            })
          }))
        })
      })
    };

    mockCalendarService = {
      addTaskToCalendar: jasmine.createSpy('addTaskToCalendar').and.returnValue(Promise.resolve()),
      updateCalendarEvent: jasmine.createSpy('updateCalendarEvent').and.returnValue(Promise.resolve())
    };

    mockSnackBar = {
      open: jasmine.createSpy('open')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      declarations: [TaskFormComponent],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: Firestore, useValue: mockFirestore },
        { provide: CalendarService, useValue: mockCalendarService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('description')?.value).toBe('');
    expect(component.taskForm.get('category')?.value).toBe('');
    expect(component.taskForm.get('status')?.value).toBe('未着手');
    expect(component.taskForm.get('priority')?.value).toBe('中');
    expect(component.taskForm.get('dueDate')?.value).toBeNull();
    expect(component.taskForm.get('assignedTo')?.value).toBe('');
  });

  it('should validate title field', () => {
    const titleControl = component.taskForm.get('title');
    
    // 空の場合はエラー
    titleControl?.setValue('');
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.errors?.['required']).toBeTruthy();
    
    // 2文字以下の場合はエラー
    titleControl?.setValue('ab');
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.errors?.['minlength']).toBeTruthy();
    
    // 51文字以上の場合はエラー
    titleControl?.setValue('a'.repeat(51));
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.errors?.['maxlength']).toBeTruthy();
    
    // 特殊文字が含まれる場合はエラー
    titleControl?.setValue('test<>');
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.errors?.['invalidChars']).toBeTruthy();
    
    // 正常な値の場合は有効
    titleControl?.setValue('テストタスク');
    expect(titleControl?.valid).toBeTruthy();
  });

  it('should validate description field', () => {
    const descriptionControl = component.taskForm.get('description');
    
    // 空の場合はエラー
    descriptionControl?.setValue('');
    expect(descriptionControl?.valid).toBeFalsy();
    expect(descriptionControl?.errors?.['required']).toBeTruthy();
    
    // 1001文字以上の場合はエラー
    descriptionControl?.setValue('a'.repeat(1001));
    expect(descriptionControl?.valid).toBeFalsy();
    expect(descriptionControl?.errors?.['maxlength']).toBeTruthy();
    
    // 特殊文字が含まれる場合はエラー
    descriptionControl?.setValue('test<>');
    expect(descriptionControl?.valid).toBeFalsy();
    expect(descriptionControl?.errors?.['invalidChars']).toBeTruthy();
    
    // 正常な値の場合は有効
    descriptionControl?.setValue('テスト説明');
    expect(descriptionControl?.valid).toBeTruthy();
  });

  it('should validate dueDate field', () => {
    const dueDateControl = component.taskForm.get('dueDate');
    
    // 過去の日付の場合はエラー
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    dueDateControl?.setValue(yesterday);
    expect(dueDateControl?.valid).toBeFalsy();
    expect(dueDateControl?.errors?.['pastDate']).toBeTruthy();
    
    // 1年以上先の日付の場合はエラー
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() + 1);
    dueDateControl?.setValue(nextYear);
    expect(dueDateControl?.valid).toBeFalsy();
    expect(dueDateControl?.errors?.['futureDate']).toBeTruthy();
    
    // 正常な値の場合は有効
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDateControl?.setValue(tomorrow);
    expect(dueDateControl?.valid).toBeTruthy();
  });

  it('should handle form submission successfully', fakeAsync(() => {
    const validTaskData = {
      title: 'テストタスク',
      description: 'テスト説明',
      category: 'テストカテゴリ',
      status: '未着手',
      priority: '中',
      dueDate: new Date(),
      assignedTo: 'テスト担当者'
    };

    component.taskForm.setValue(validTaskData);
    component.onSubmit();
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'タスクを作成しました',
      '閉じる',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
  }));

  it('should handle form submission with errors', fakeAsync(() => {
    const invalidTaskData = {
      title: '',
      description: '',
      category: '',
      status: '未着手',
      priority: '中',
      dueDate: null,
      assignedTo: ''
    };

    component.taskForm.setValue(invalidTaskData);
    component.onSubmit();
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      '入力内容に誤りがあります。エラーメッセージをご確認ください。',
      '閉じる',
      { duration: 5000, panelClass: ['warning-snackbar'] }
    );
  }));

  it('should handle network error during submission', fakeAsync(() => {
    const validTaskData = {
      title: 'テストタスク',
      description: 'テスト説明',
      category: 'テストカテゴリ',
      status: '未着手',
      priority: '中',
      dueDate: new Date(),
      assignedTo: 'テスト担当者'
    };

    mockFirestore.collection.and.returnValue({
      addDoc: () => throwError(new Error('network error'))
    });

    component.taskForm.setValue(validTaskData);
    component.onSubmit();
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'ネットワークエラーが発生しました。インターネット接続をご確認ください。',
      '閉じる',
      { duration: 5000, panelClass: ['error-snackbar'] }
    );
  }));
}); 