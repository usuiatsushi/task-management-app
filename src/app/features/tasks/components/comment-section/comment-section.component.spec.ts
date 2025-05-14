import { ComponentFixture, TestBed, fakeAsync, tick, flush, flushMicrotasks } from '@angular/core/testing';
import { CommentSectionComponent } from './comment-section.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommentService } from '../../services/comment.service';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../../auth/services/user.service';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { TextFieldModule } from '@angular/cdk/text-field';

describe('CommentSectionComponent', () => {
  let component: CommentSectionComponent;
  let fixture: ComponentFixture<CommentSectionComponent>;
  let commentService: jasmine.SpyObj<CommentService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let userService: jasmine.SpyObj<UserService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let auth: jasmine.SpyObj<Auth>;

  const mockComments = [
    {
      id: '1',
      taskId: 'task1',
      userId: 'user1',
      userName: 'テストユーザー1',
      content: 'テストコメント1',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      isEdited: false,
      parentId: null
    },
    {
      id: '2',
      taskId: 'task1',
      userId: 'user2',
      userName: 'テストユーザー2',
      content: 'テストコメント2',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      isEdited: true,
      parentId: '1'
    }
  ];

  const mockUsers = [
    {
      uid: 'user1',
      displayName: 'テストユーザー1',
      email: 'test1@example.com'
    },
    {
      uid: 'user2',
      displayName: 'テストユーザー2',
      email: 'test2@example.com'
    }
  ];

  beforeEach(async () => {
    const commentServiceSpy = jasmine.createSpyObj('CommentService', [
      'getCommentsByTaskId',
      'createComment',
      'updateComment',
      'deleteComment'
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['createNotification']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const authSpy = jasmine.createSpyObj('Auth', ['onAuthStateChanged'], {
      currentUser: {
        uid: 'user1',
        displayName: 'テストユーザー1',
        email: 'test1@example.com'
      }
    });

    commentServiceSpy.getCommentsByTaskId.and.returnValue(Promise.resolve(mockComments));
    userServiceSpy.getAllUsers.and.returnValue(Promise.resolve(mockUsers));
    authSpy.onAuthStateChanged.and.returnValue(of(authSpy.currentUser));

    await TestBed.configureTestingModule({
      imports: [
        CommentSectionComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        NoopAnimationsModule,
        TextFieldModule
      ],
      providers: [
        FormBuilder,
        { provide: CommentService, useValue: commentServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Auth, useValue: authSpy }
      ]
    }).compileComponents();

    commentService = TestBed.inject(CommentService) as jasmine.SpyObj<CommentService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    auth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentSectionComponent);
    component = fixture.componentInstance;
    component.taskId = 'task1';

    // デフォルトではspyOnしない
    fixture.detectChanges();
  });

  describe('初期化テスト', () => {
    it('should load comments on init', fakeAsync(() => {
      component.ngOnInit();
      tick();
      expect(commentService.getCommentsByTaskId).toHaveBeenCalledWith('task1');
      expect(component.comments).toEqual(mockComments);
    }));

    it('should load users on init', fakeAsync(() => {
      component.ngOnInit();
      tick();
      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(component.users).toEqual(mockUsers);
    }));
  });

  describe('副作用テスト', () => {
    beforeEach(() => {
      spyOn(component, 'loadComments').and.returnValue(Promise.resolve());
      spyOn(component, 'loadUsers').and.returnValue(Promise.resolve());
      notificationService.createNotification.and.returnValue(Promise.resolve('dummyId'));
    });

    it('should submit comment', fakeAsync(() => {
      const commentContent = 'テストコメント';
      component.commentForm.patchValue({ content: commentContent });
      commentService.createComment.and.returnValue(Promise.resolve('newCommentId'));

      component.onSubmit();
      tick();
      flushMicrotasks();
      tick(3000);
      fixture.detectChanges();
      expect(commentService.createComment).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('コメントを投稿しました', '閉じる', { duration: 3000 });
    }));

    it('should handle comment submission error', fakeAsync(() => {
      const commentContent = 'テストコメント';
      component.commentForm.patchValue({ content: commentContent });
      commentService.createComment.and.returnValue(Promise.reject('Error'));

      component.onSubmit();
      tick();
      flushMicrotasks();
      tick(3000);
      fixture.detectChanges();
      expect(snackBar.open).toHaveBeenCalledWith('コメントの投稿に失敗しました', '閉じる', { duration: 3000 });
    }));

    it('should delete comment', fakeAsync(() => {
      commentService.deleteComment.and.returnValue(Promise.resolve());

      component.deleteComment('1');
      tick();
      flushMicrotasks();
      tick(3000);
      fixture.detectChanges();
      expect(commentService.deleteComment).toHaveBeenCalledWith('1');
      expect(snackBar.open).toHaveBeenCalledWith('コメントを削除しました', '閉じる', { duration: 3000 });
    }));

    it('should handle comment deletion error', fakeAsync(() => {
      commentService.deleteComment.and.returnValue(Promise.reject('Error'));

      component.deleteComment('1');
      tick();
      flushMicrotasks();
      tick(3000);
      fixture.detectChanges();
      expect(snackBar.open).toHaveBeenCalledWith('コメントの削除に失敗しました', '閉じる', { duration: 3000 });
    }));

    it('should start editing comment', () => {
      const comment = mockComments[0];
      component.startEditing(comment);
      expect(component.editingCommentId).toBe(comment.id);
      expect(component.editContent).toBe(comment.content);
    });

    it('should save edited comment', fakeAsync(() => {
      const comment = mockComments[0];
      const newContent = '編集されたコメント';
      component.startEditing(comment);
      component.editContent = newContent;
      commentService.updateComment.and.returnValue(Promise.resolve());

      component.saveEdit(comment);
      tick();
      flushMicrotasks();
      tick(3000);
      fixture.detectChanges();
      expect(commentService.updateComment).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('コメントを更新しました', '閉じる', { duration: 3000 });
    }));

    it('should handle comment edit error', fakeAsync(() => {
      const comment = mockComments[0];
      const newContent = '編集されたコメント';
      component.startEditing(comment);
      component.editContent = newContent;
      commentService.updateComment.and.returnValue(Promise.reject('Error'));

      component.saveEdit(comment);
      tick();
      flushMicrotasks();
      tick(3000);
      fixture.detectChanges();
      expect(snackBar.open).toHaveBeenCalledWith('コメントの更新に失敗しました', '閉じる', { duration: 3000 });
    }));

    it('should cancel editing', () => {
      const comment = mockComments[0];
      component.startEditing(comment);
      component.cancelEdit();
      expect(component.editingCommentId).toBeNull();
    });

    it('should toggle comment collapse', () => {
      const commentId = '1';
      component.toggleCollapse(commentId);
      expect(component.isCollapsed[commentId]).toBeTruthy();
      component.toggleCollapse(commentId);
      expect(component.isCollapsed[commentId]).toBeFalsy();
    });

    it('should filter users for mention', () => {
      component.users = mockUsers;
      component.filterUsers('テスト');
      expect(component.filteredUsers.length).toBe(2);
      component.filterUsers('ユーザー1');
      expect(component.filteredUsers.length).toBe(1);
    });

    it('should select user for mention', () => {
      const user = mockUsers[0];
      component.commentForm.patchValue({ content: 'テスト' });
      component.cursorPosition = 3;
      component.mentionStart = 3;
      component.selectUser(user);
      expect(component.commentForm.get('content')?.value).toBe(`テスト@${user.displayName} `);
    });
  });

  it('should initialize form with empty content', () => {
    expect(component.commentForm.get('content')?.value).toBe('');
  });

  it('should validate comment content', () => {
    const contentControl = component.commentForm.get('content');
    expect(contentControl?.valid).toBeFalsy();
    expect(contentControl?.hasError('required')).toBeTruthy();

    contentControl?.setValue('a'.repeat(501));
    expect(contentControl?.hasError('maxlength')).toBeTruthy();

    contentControl?.setValue('テストコメント');
    expect(contentControl?.valid).toBeTruthy();
  });
}); 