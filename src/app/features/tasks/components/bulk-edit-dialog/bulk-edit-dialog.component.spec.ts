import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BulkEditDialogComponent } from './bulk-edit-dialog.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CategoryService } from '../../services/category.service';
import { Task } from '../../models/task.model';
import { of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

describe('BulkEditDialogComponent', () => {
  let component: BulkEditDialogComponent;
  let fixture: ComponentFixture<BulkEditDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<BulkEditDialogComponent>>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'タスク1',
      description: '説明1',
      status: '未着手',
      importance: '中',
      category: '開発',
      projectId: '1',
      assignedTo: 'user1',
      dueDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: 'user1',
      completed: false
    },
    {
      id: '2',
      title: 'タスク2',
      description: '説明2',
      status: '進行中',
      importance: '高',
      category: 'テスト',
      projectId: '1',
      assignedTo: 'user2',
      dueDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      userId: 'user2',
      completed: false
    }
  ];

  const mockCategories = ['開発', 'テスト', 'デザイン', 'ドキュメント'];

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [], {
      categories$: of(mockCategories)
    });

    await TestBed.configureTestingModule({
      imports: [
        BulkEditDialogComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { tasks: mockTasks } },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<BulkEditDialogComponent>>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BulkEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.editForm.get('status')?.value).toBe('');
    expect(component.editForm.get('importance')?.value).toBe('');
    expect(component.editForm.get('category')?.value).toBe('');
  });

  it('should load categories from service', () => {
    expect(component.categories).toEqual(mockCategories);
  });

  it('should close dialog with form values when save is clicked', () => {
    const formValues = {
      status: '完了',
      importance: '高',
      category: 'テスト'
    };

    component.editForm.patchValue(formValues);
    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith(formValues);
  });

  it('should close dialog without values when cancel is clicked', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should display correct number of tasks in title', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('h2');
    expect(title.textContent).toContain('一括編集');
  });

  it('should have all form fields', () => {
    const compiled = fixture.nativeElement;
    const formFields = compiled.querySelectorAll('mat-form-field');
    expect(formFields.length).toBe(3);
  });

  it('should have correct status options', () => {
    const compiled = fixture.nativeElement;
    const statusSelect = compiled.querySelector('mat-select[formControlName="status"]');
    expect(statusSelect).toBeTruthy();
    const statusOptions = ['', '未着手', '進行中', '完了'];
    expect(component.editForm.get('status')?.value).toBe('');
  });

  it('should have correct importance options', () => {
    const compiled = fixture.nativeElement;
    const importanceSelect = compiled.querySelector('mat-select[formControlName="importance"]');
    expect(importanceSelect).toBeTruthy();
    const importanceOptions = ['', '低', '中', '高'];
    expect(component.editForm.get('importance')?.value).toBe('');
  });

  it('should have correct category options', () => {
    const compiled = fixture.nativeElement;
    const categorySelect = compiled.querySelector('mat-select[formControlName="category"]');
    expect(categorySelect).toBeTruthy();
    expect(component.categories).toEqual(mockCategories);
    expect(component.editForm.get('category')?.value).toBe('');
  });
}); 