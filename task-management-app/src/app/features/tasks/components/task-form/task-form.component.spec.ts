import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { CalendarService } from '../../services/calendar.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  beforeEach(async () => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [], {
      categories$: of(['カテゴリ1', 'カテゴリ2'])
    });
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    const calendarServiceSpy = jasmine.createSpyObj('CalendarService', ['addTaskToCalendar', 'updateCalendarEvent']);

    await TestBed.configureTestingModule({
      imports: [
        TaskFormComponent,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Firestore, useValue: {} },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: CalendarService, useValue: calendarServiceSpy }
      ]
    }).compileComponents();

    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    describe('Title Field', () => {
      it('should show required error when empty', () => {
        const titleControl = component.taskForm.get('title');
        titleControl?.setValue('');
        titleControl?.markAsTouched();
        fixture.detectChanges();
        
        expect(titleControl?.errors?.['required']).toBeTruthy();
        expect(component.getErrorMessage('title')).toBe('タイトルは必須です');
      });

      it('should show min length error when title is too short', () => {
        const titleControl = component.taskForm.get('title');
        titleControl?.setValue('ab');
        titleControl?.markAsTouched();
        fixture.detectChanges();

        expect(titleControl?.errors?.['minlength']).toBeTruthy();
        expect(component.getErrorMessage('title')).toBe('タイトルは3文字以上で入力してください');
      });

      it('should show max length error when title is too long', () => {
        const titleControl = component.taskForm.get('title');
        titleControl?.setValue('a'.repeat(51));
        titleControl?.markAsTouched();
        fixture.detectChanges();

        expect(titleControl?.errors?.['maxlength']).toBeTruthy();
        expect(component.getErrorMessage('title')).toBe('タイトルは50文字以下で入力してください');
      });

      it('should show invalid characters error', () => {
        const titleControl = component.taskForm.get('title');
        titleControl?.setValue('test<>test');
        titleControl?.markAsTouched();
        fixture.detectChanges();

        expect(titleControl?.errors?.['invalidChars']).toBeTruthy();
        expect(component.getErrorMessage('title')).toBe('特殊文字（<>）は使用できません');
      });
    });

    describe('Description Field', () => {
      it('should show required error when empty', () => {
        const descControl = component.taskForm.get('description');
        descControl?.setValue('');
        descControl?.markAsTouched();
        fixture.detectChanges();

        expect(descControl?.errors?.['required']).toBeTruthy();
        expect(component.getErrorMessage('description')).toBe('説明は必須です');
      });

      it('should show max length error when description is too long', () => {
        const descControl = component.taskForm.get('description');
        descControl?.setValue('a'.repeat(1001));
        descControl?.markAsTouched();
        fixture.detectChanges();

        expect(descControl?.errors?.['maxlength']).toBeTruthy();
        expect(component.getErrorMessage('description')).toBe('説明は1000文字以下で入力してください');
      });
    });

    describe('Due Date Field', () => {
      it('should show past date error', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        
        const dueDateControl = component.taskForm.get('dueDate');
        dueDateControl?.setValue(pastDate);
        dueDateControl?.markAsTouched();
        fixture.detectChanges();

        expect(dueDateControl?.errors?.['pastDate']).toBeTruthy();
        expect(component.getErrorMessage('dueDate')).toBe('過去の日付は選択できません');
      });

      it('should show future date error', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);
        
        const dueDateControl = component.taskForm.get('dueDate');
        dueDateControl?.setValue(futureDate);
        dueDateControl?.markAsTouched();
        fixture.detectChanges();

        expect(dueDateControl?.errors?.['futureDate']).toBeTruthy();
        expect(component.getErrorMessage('dueDate')).toBe('1年以上先の日付は選択できません');
      });
    });
  });

  describe('Form Submission', () => {
    it('should show error message when form is invalid', fakeAsync(() => {
      component.taskForm.controls['title'].setValue('');
      component.taskForm.controls['description'].setValue('');
      component.taskForm.controls['category'].setValue('');
      component.taskForm.controls['assignedTo'].setValue('');
      
      component.onSubmit();
      tick(100);
      
      expect(snackBar.open).toHaveBeenCalledWith(
        '入力内容に誤りがあります。エラーメッセージをご確認ください。',
        '閉じる',
        jasmine.any(Object)
      );
    }));

    it('should navigate to tasks list on cancel', () => {
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
    });
  });

  describe('Category Management', () => {
    it('should add new category', () => {
      const newCategory = '新しいカテゴリ';
      component.taskForm.controls['newCategoryName'].setValue(newCategory);
      component.addNewCategory();
      fixture.detectChanges();

      expect(component.categories).toContain(newCategory);
      expect(component.taskForm.get('category')?.value).toBe(newCategory);
      expect(component.taskForm.get('newCategoryName')?.value).toBe('');
    });

    it('should not add duplicate category', () => {
      const initialLength = component.categories.length;
      component.taskForm.controls['newCategoryName'].setValue('カテゴリ1');
      component.addNewCategory();
      fixture.detectChanges();

      expect(component.categories.length).toBe(initialLength);
    });
  });
}); 