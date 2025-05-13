import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProjectFormComponent } from './project-form.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Firestore } from '@angular/fire/firestore';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FIREBASE_APP_NAME } from '@angular/fire/compat';
import { MatDialog } from '@angular/material/dialog';
import { Timestamp } from '@angular/fire/firestore';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let firestore: jasmine.SpyObj<Firestore>;
  let angularFirestore: jasmine.SpyObj<AngularFirestore>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockProject = {
    id: '1',
    name: 'テストプロジェクト',
    description: 'テスト説明',
    members: ['user1', 'user2'],
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    userId: 'user1',
    tasks: []
  };

  const mockUsers = [
    { id: 'user1', email: 'user1@example.com' },
    { id: 'user2', email: 'user2@example.com' }
  ];

  const mockFirebaseConfig = {
    apiKey: 'AIzaSyDtfvkdvkps6QwTjwsEJ8-CBkl6TyGR-jU',
    authDomain: 'kensyu10095.firebaseapp.com',
    projectId: 'kensyu10095',
    storageBucket: 'kensyu10095.firebasestorage.app',
    messagingSenderId: '263465065376',
    appId: '1:263465065376:web:3cb93f8c54e4ceffeee2c5',
    measurementId: 'G-Z3FRW7D9BT'
  };

  beforeEach(async () => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getProject', 'createProject', 'updateProject']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUidByEmail']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection']);
    const angularFirestoreSpy = jasmine.createSpyObj('AngularFirestore', ['collection']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    projectServiceSpy.getProject.and.returnValue(Promise.resolve(mockProject));
    projectServiceSpy.createProject.and.returnValue(Promise.resolve());
    projectServiceSpy.updateProject.and.returnValue(Promise.resolve());
    authServiceSpy.getUidByEmail.and.returnValue(Promise.resolve('user3'));
    
    const mockCollection = {
      valueChanges: () => of(mockUsers),
      doc: () => ({
        get: () => Promise.resolve({ 
          exists: () => true,
          data: () => ({ displayName: 'Test User', email: 'test@example.com' })
        })
      })
    };
    angularFirestoreSpy.collection.and.returnValue(mockCollection as any);
    firestoreSpy.collection.and.returnValue(mockCollection as any);

    const paramMapSpy = jasmine.createSpyObj('ParamMap', ['get']);
    paramMapSpy.get.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [
        ProjectFormComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatSelectModule,
        MatOptionModule
      ],
      providers: [
        FormBuilder,
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Firestore, useValue: firestoreSpy },
        { provide: AngularFirestore, useValue: angularFirestoreSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: FIREBASE_OPTIONS, useValue: mockFirebaseConfig },
        { provide: FIREBASE_APP_NAME, useValue: '[DEFAULT]' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: paramMapSpy
            }
          }
        }
      ]
    }).compileComponents();

    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    firestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
    angularFirestore = TestBed.inject(AngularFirestore) as jasmine.SpyObj<AngularFirestore>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.projectForm.get('name')?.value).toBe('');
    expect(component.projectForm.get('description')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.projectForm;
    form.get('name')?.setValue('');
    form.get('description')?.setValue('');
    form.markAsTouched();
    fixture.detectChanges();

    expect(form.valid).toBeFalsy();
    expect(form.get('name')?.errors?.['required']).toBeTruthy();

    form.get('name')?.setValue('テストプロジェクト');
    expect(form.valid).toBeTruthy();
  });

  it('should validate max length', () => {
    const form = component.projectForm;
    form.get('name')?.setValue('a'.repeat(101));
    expect(form.get('name')?.errors?.['maxlength']).toBeTruthy();

    form.get('description')?.setValue('a'.repeat(501));
    expect(form.get('description')?.errors?.['maxlength']).toBeTruthy();
  });

  it('should create new project', async () => {
    component.projectForm.setValue({
      name: '新規プロジェクト',
      description: '新規説明'
    });
    component.members = ['user1'];

    await component.onSubmit();

    expect(projectService.createProject).toHaveBeenCalledWith({
      name: '新規プロジェクト',
      description: '新規説明',
      members: ['user1'],
      createdAt: jasmine.any(Timestamp),
      updatedAt: jasmine.any(Timestamp),
      userId: 'user1',
      tasks: []
    });
    expect(snackBar.open).toHaveBeenCalledWith('プロジェクトを作成しました', '閉じる', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should update existing project', async () => {
    // テスト用のActivatedRouteを設定
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jasmine.Spy).and.returnValue('1');

    // コンポーネントを再初期化
    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();

    // フォームに値を設定
    component.projectForm.setValue({
      name: '更新プロジェクト',
      description: '更新説明'
    });
    component.members = ['user1', 'user2'];

    // 更新処理を実行
    await component.onSubmit();

    // 期待される結果を検証
    expect(projectService.updateProject).toHaveBeenCalledWith('1', {
      name: '更新プロジェクト',
      description: '更新説明',
      members: ['user1', 'user2'],
      createdAt: mockProject.createdAt,
      updatedAt: jasmine.any(Timestamp),
      userId: 'user1',
      tasks: []
    });
    expect(snackBar.open).toHaveBeenCalledWith('プロジェクトを更新しました', '閉じる', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should add member by email', async () => {
    component.newMemberEmail = 'user3@example.com';
    await component.addMemberByEmail();

    expect(authService.getUidByEmail).toHaveBeenCalledWith('user3@example.com');
    expect(component.members).toContain('user3');
    expect(snackBar.open).toHaveBeenCalledWith('メンバーを追加しました', '閉じる', { duration: 2000 });
  });

  it('should not add duplicate member', async () => {
    component.members = ['user1'];
    component.newMemberEmail = 'user1@example.com';
    authService.getUidByEmail.and.returnValue(Promise.resolve('user1'));

    await component.addMemberByEmail();

    expect(component.members.length).toBe(1);
    expect(snackBar.open).toHaveBeenCalledWith('既に追加されています', '閉じる', { duration: 3000 });
  });

  it('should remove member', async () => {
    component.members = ['user1', 'user2'];
    await component.removeMember('user1');

    expect(component.members).not.toContain('user1');
    expect(snackBar.open).toHaveBeenCalledWith('メンバーを削除しました', '閉じる', { duration: 2000 });
  });

  it('should navigate back on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should auto resize textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.style.height = '100px';
    Object.defineProperty(textarea, 'scrollHeight', {
      get: () => 200
    });
    const event = { target: textarea } as unknown as Event;

    component.autoResize(event);

    expect(textarea.style.height).toBe('200px');
  });
}); 