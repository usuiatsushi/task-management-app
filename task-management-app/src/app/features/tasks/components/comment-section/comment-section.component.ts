import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
      console.log('現在のユーザー:', currentUser);
      if (!currentUser) throw new Error('ユーザーが認証されていません');

      const comment: Omit<Comment, 'id'> = {
        taskId: this.taskId,
        userId: currentUser.uid,
        userName: currentUser.displayName || '匿名ユーザー',
        content: this.commentForm.value.content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('投稿するコメント:', comment);
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
} 