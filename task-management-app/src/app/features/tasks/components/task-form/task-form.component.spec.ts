import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Firestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

// カレンダーサービスのモック
class MockCalendarService {
  addTaskToCalendar = jasmine.createSpy('addTaskToCalendar').and.returnValue(Promise.resolve());
  updateCalendarEvent = jasmine.createSpy('updateCalendarEvent').and.returnValue(Promise.resolve());
}

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let firestoreMock: any;
  let calendarServiceMock: MockCalendarService;
  let snackBarMock: any;
  let routerMock: any;

  beforeEach(async () => {
    firestoreMock = {
      collection: jasmine.createSpy('collection').and.returnValue({
        doc: jasmine.createSpy('doc').and.returnValue({
          update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
          get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
            data: () => ({
              title: 'Test Task',
              description: 'Test Description',
              category: 'Work',
              status: '未着手',
              priority: '中',
              dueDate: new Date(),
              assignedTo: 'Test User'
            })
          }))
        }),
        addDoc: jasmine.createSpy('addDoc').and.returnValue(Promise.resolve({ id: 'test-id' }))
      })
    };

    calendarServiceMock = new MockCalendarService();

    snackBarMock = {
      open: jasmine.createSpy('open')
    };

    routerMock = {
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
        MatSnackBarModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: Firestore, useValue: firestoreMock },
        { provide: 'CalendarService', useValue: calendarServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should validate title field', () => {
      const titleControl = component.taskForm.get('title');
      
      // 空のテスト
      titleControl?.setValue('');
      expect(titleControl?.valid).toBeFalsy();
      expect(titleControl?.errors?.['required']).toBeTruthy();
      
      // 最小文字数のテスト
      titleControl?.setValue('ab');
      expect(titleControl?.valid).toBeFalsy();
      expect(titleControl?.errors?.['minlength']).toBeTruthy();
      
      // 最大文字数のテスト
      titleControl?.setValue('a'.repeat(51));
      expect(titleControl?.valid).toBeFalsy();
      expect(titleControl?.errors?.['maxlength']).toBeTruthy();
      
      // 特殊文字のテスト
      titleControl?.setValue('Test<>');
      expect(titleControl?.valid).toBeFalsy();
      expect(titleControl?.errors?.['invalidCharacters']).toBeTruthy();
    });

    it('should validate description field', () => {
      const descriptionControl = component.taskForm.get('description');
      
      // 空のテスト
      descriptionControl?.setValue('');
      expect(descriptionControl?.valid).toBeFalsy();
      expect(descriptionControl?.errors?.['required']).toBeTruthy();
      
      // 最大文字数のテスト
      descriptionControl?.setValue('a'.repeat(1001));
      expect(descriptionControl?.valid).toBeFalsy();
      expect(descriptionControl?.errors?.['maxlength']).toBeTruthy();
      
      // 特殊文字のテスト
      descriptionControl?.setValue('Test<>');
      expect(descriptionControl?.valid).toBeFalsy();
      expect(descriptionControl?.errors?.['invalidCharacters']).toBeTruthy();
    });

    it('should validate dueDate field', () => {
      const dueDateControl = component.taskForm.get('dueDate');
      
      // 過去の日付のテスト
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      dueDateControl?.setValue(yesterday);
      expect(dueDateControl?.valid).toBeFalsy();
      expect(dueDateControl?.errors?.['pastDate']).toBeTruthy();
      
      // 1年以上先の日付のテスト
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      dueDateControl?.setValue(futureDate);
      expect(dueDateControl?.valid).toBeFalsy();
      expect(dueDateControl?.errors?.['futureDate']).toBeTruthy();
    });

    it('should validate assignedTo field', () => {
      const assignedToControl = component.taskForm.get('assignedTo');
      
      // 空のテスト
      assignedToControl?.setValue('');
      expect(assignedToControl?.valid).toBeFalsy();
      expect(assignedToControl?.errors?.['required']).toBeTruthy();
      
      // 最小文字数のテスト
      assignedToControl?.setValue('a');
      expect(assignedToControl?.valid).toBeFalsy();
      expect(assignedToControl?.errors?.['minlength']).toBeTruthy();
      
      // 最大文字数のテスト
      assignedToControl?.setValue('a'.repeat(31));
      expect(assignedToControl?.valid).toBeFalsy();
      expect(assignedToControl?.errors?.['maxlength']).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should handle successful task creation', fakeAsync(() => {
      // フォームに有効な値を設定
      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
        category: 'Work',
        status: '未着手',
        priority: '中',
        dueDate: new Date(),
        assignedTo: 'Test User'
      });

      component.onSubmit();
      tick();

      expect(firestoreMock.collection).toHaveBeenCalledWith('tasks');
      expect(calendarServiceMock.addTaskToCalendar).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('タスクを作成しました', '閉じる', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      expect(routerMock.navigate).toHaveBeenCalledWith(['/tasks']);
    }));

    it('should handle successful task update', fakeAsync(() => {
      // 編集モードを有効化
      component.isEditMode = true;
      component.taskId = 'test-id';

      // フォームに有効な値を設定
      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description',
        category: 'Work',
        status: '進行中',
        priority: '高',
        dueDate: new Date(),
        assignedTo: 'Test User'
      });

      component.onSubmit();
      tick();

      expect(firestoreMock.collection).toHaveBeenCalledWith('tasks');
      expect(calendarServiceMock.updateCalendarEvent).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('タスクを更新しました', '閉じる', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      expect(routerMock.navigate).toHaveBeenCalledWith(['/tasks']);
    }));

    it('should handle form validation errors', () => {
      // 無効なフォームで送信
      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        '入力内容に誤りがあります。エラーメッセージをご確認ください。',
        '閉じる',
        {
          duration: 5000,
          panelClass: ['warning-snackbar']
        }
      );
    });

    it('should handle network errors', fakeAsync(() => {
      // ネットワークエラーをシミュレート
      firestoreMock.collection.and.returnValue({
        addDoc: () => Promise.reject(new Error('network error'))
      });

      // フォームに有効な値を設定
      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
        category: 'Work',
        status: '未着手',
        priority: '中',
        dueDate: new Date(),
        assignedTo: 'Test User'
      });

      component.onSubmit();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'ネットワークエラーが発生しました。インターネット接続をご確認ください。',
        '閉じる',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));

    it('should handle permission errors', fakeAsync(() => {
      // 権限エラーをシミュレート
      firestoreMock.collection.and.returnValue({
        addDoc: () => Promise.reject(new Error('permission-denied'))
      });

      // フォームに有効な値を設定
      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
        category: 'Work',
        status: '未着手',
        priority: '中',
        dueDate: new Date(),
        assignedTo: 'Test User'
      });

      component.onSubmit();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        '権限がありません。ログインしているかご確認ください。',
        '閉じる',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));
  });

  describe('Category Management', () => {
    it('should add new category when addNewCategory is called', () => {
      const newCategory = '新しいカテゴリ';
      component.taskForm.get('newCategoryName')?.setValue(newCategory);
      component.addNewCategory();
      expect(component.categories).toContain(newCategory);
      expect(component.taskForm.get('category')?.value).toBe(newCategory);
      expect(component.taskForm.get('newCategoryName')?.value).toBe('');
    });

    it('should not add duplicate category', () => {
      const existingCategory = '既存のカテゴリ';
      component.categories = [existingCategory];
      component.taskForm.get('newCategoryName')?.setValue(existingCategory);
      component.addNewCategory();
      expect(component.categories.length).toBe(1);
    });
  });
}); 