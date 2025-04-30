import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Comment } from '../../models/comment.model';
import { CommentService } from 'src/app/features/tasks/services/comment.service';
import { Auth } from '@angular/fire/auth';
import { Timestamp } from 'firebase/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class CommentSectionComponent implements OnInit {
  @Input() taskId!: string;
  comments: Comment[] = [];
  commentForm: FormGroup;
  loading = false;
  currentUser: any;
  editingCommentId: string | null = null;
  editContent: string = '';
  showHistory: { [commentId: string]: boolean } = {};
  replyToCommentId: string | null = null;
  replyContent: string = '';
  showReplies: { [commentId: string]: boolean } = {};
  openAction: { [commentId: string]: 'reply' | 'replies' | 'history' | null } = {};

  constructor(
    private commentService: CommentService,
    private auth: Auth,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]]
    });
    this.currentUser = this.auth.currentUser;
  }

  ngOnInit(): void {
    this.loadComments();
  }

  async loadComments(): Promise<void> {
    try {
      this.loading = true;
      this.comments = await this.commentService.getCommentsByTaskId(this.taskId);
    } catch (error) {
      console.error('コメントの読み込みに失敗しました:', error);
      this.snackBar.open('コメントの読み込みに失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.commentForm.invalid) return;

    try {
      this.loading = true;
      const currentUser = this.auth.currentUser;
      if (!currentUser) throw new Error('ユーザーが認証されていません');

      const comment: Omit<Comment, 'id'> = {
        taskId: this.taskId,
        userId: currentUser.uid,
        userName: currentUser.displayName || '匿名ユーザー',
        content: this.commentForm.value.content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isEdited: false
      };

      await this.commentService.createComment(comment);
      this.commentForm.reset();
      await this.loadComments();
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error);
      this.snackBar.open('コメントの投稿に失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      this.loading = true;
      await this.commentService.deleteComment(commentId);
      await this.loadComments();
    } catch (error) {
      console.error('コメントの削除に失敗しました:', error);
      this.snackBar.open('コメントの削除に失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  // 編集機能のメソッド
  startEditing(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editContent = comment.content;
  }

  isEditing(comment: Comment): boolean {
    return this.editingCommentId === comment.id;
  }

  async saveEdit(comment: Comment): Promise<void> {
    if (!this.editContent.trim()) {
      this.snackBar.open('コメントを入力してください', '閉じる', { duration: 3000 });
      return;
    }

    try {
      this.loading = true;
      await this.commentService.updateComment(comment.id, this.editContent);
      this.editingCommentId = null;
      this.editContent = '';
      await this.loadComments();
      this.snackBar.open('コメントを更新しました', '閉じる', { duration: 3000 });
    } catch (error) {
      console.error('コメントの更新に失敗しました:', error);
      this.snackBar.open('コメントの更新に失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editContent = '';
  }

  toggleHistory(commentId: string): void {
    this.showHistory[commentId] = !this.showHistory[commentId];
  }

  startReply(commentId: string): void {
    this.replyToCommentId = commentId;
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyToCommentId = null;
    this.replyContent = '';
  }

  async submitReply(parentComment: Comment): Promise<void> {
    if (!this.replyContent.trim()) {
      this.snackBar.open('返信内容を入力してください', '閉じる', { duration: 3000 });
      return;
    }
    try {
      this.loading = true;
      const currentUser = this.auth.currentUser;
      if (!currentUser) throw new Error('ユーザーが認証されていません');
      const reply: Omit<Comment, 'id'> = {
        taskId: this.taskId,
        userId: currentUser.uid,
        userName: currentUser.displayName || '匿名ユーザー',
        content: this.replyContent,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isEdited: false,
        parentId: parentComment.id
      };
      await this.commentService.createComment(reply);
      this.replyToCommentId = null;
      this.replyContent = '';
      await this.loadComments();
    } catch (error) {
      console.error('返信の投稿に失敗しました:', error);
      this.snackBar.open('返信の投稿に失敗しました', '閉じる', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  get parentComments(): Comment[] {
    return this.comments.filter(c => !c.parentId);
  }

  getReplies(parentId: string): Comment[] {
    return this.comments.filter(c => c.parentId === parentId);
  }

  toggleReplies(commentId: string): void {
    this.showReplies[commentId] = !this.showReplies[commentId];
  }

  toggleReplyAction(commentId: string): void {
    this.openAction[commentId] = this.openAction[commentId] === 'reply' ? null : 'reply';
    if (this.openAction[commentId] === 'reply') {
      this.replyToCommentId = commentId;
      this.replyContent = '';
    } else {
      this.replyToCommentId = null;
      this.replyContent = '';
    }
  }

  toggleRepliesAction(commentId: string): void {
    this.openAction[commentId] = this.openAction[commentId] === 'replies' ? null : 'replies';
  }

  toggleHistoryAction(commentId: string): void {
    this.openAction[commentId] = this.openAction[commentId] === 'history' ? null : 'history';
  }
} 