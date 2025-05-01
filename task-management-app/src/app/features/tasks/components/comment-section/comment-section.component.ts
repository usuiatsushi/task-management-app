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
import { NotificationService } from '../../services/notification.service';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): any {
    if (!value) return '';
    const html = marked.parse(value, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

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
    MatSnackBarModule,
    MarkdownPipe
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
  isCollapsed: { [commentId: string]: boolean } = {};
  showPreview: boolean = false;
  mentionedUsers: string[] = [];

  constructor(
    private commentService: CommentService,
    private auth: Auth,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private notificationService: NotificationService
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]]
    });
    this.currentUser = this.auth.currentUser;
  }

  ngOnInit(): void {
    this.loadComments();
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
    });
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

  onContentChange(event: any): void {
    const content = event.target.value;
    const mentions = content.match(/@[\w-]+/g) || [];
    this.mentionedUsers = mentions.map((mention: string) => mention.substring(1));
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

      const commentId = await this.commentService.createComment(comment);
      this.commentForm.reset();
      await this.loadComments();
      this.snackBar.open('コメントを投稿しました', '閉じる', { duration: 3000 });

      try {
        // 通知を送信
        await this.notificationService.createNotification({
          type: 'comment',
          userId: currentUser.uid,
          taskId: this.taskId,
          commentId: commentId,
          message: `${currentUser.displayName || '匿名ユーザー'}さんがコメントを投稿しました`,
          createdAt: Timestamp.now(),
          isRead: false
        });

        // メンションされたユーザーに通知を送信
        for (const username of this.mentionedUsers) {
          await this.notificationService.createNotification({
            type: 'mention',
            userId: currentUser.uid,
            taskId: this.taskId,
            commentId: commentId,
            message: `${currentUser.displayName || '匿名ユーザー'}さんがあなたにメンションしました`,
            createdAt: Timestamp.now(),
            isRead: false
          });
        }
      } catch (error) {
        console.error('通知の送信に失敗しました:', error);
      }
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
      const replyId = await this.commentService.createComment(reply);
      this.replyToCommentId = null;
      this.replyContent = '';
      this.openAction[parentComment.id] = 'replies';
      await this.loadComments();
      this.snackBar.open('返信を投稿しました', '閉じる', { duration: 3000 });

      try {
        // 返信の通知を送信
        await this.notificationService.createNotification({
          type: 'reply',
          userId: currentUser.uid,
          taskId: this.taskId,
          commentId: replyId,
          parentCommentId: parentComment.id,
          message: `${currentUser.displayName || '匿名ユーザー'}さんが返信しました`,
          createdAt: Timestamp.now(),
          isRead: false
        });
      } catch (error) {
        console.error('通知の送信に失敗しました:', error);
      }
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

  toggleCollapse(commentId: string): void {
    this.isCollapsed[commentId] = !this.isCollapsed[commentId];
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  getFormattedContent(): Array<{type: 'text' | 'mention', content: string}> {
    const content = this.commentForm.get('content')?.value || 'コメントを入力してください';
    const segments: Array<{type: 'text' | 'mention', content: string}> = [];
    const parts = content.split(/(@[\w-]+)/g);
    
    parts.forEach((part: string) => {
      if (part.startsWith('@')) {
        segments.push({ type: 'mention', content: part });
      } else if (part) {
        segments.push({ type: 'text', content: part });
      }
    });
    
    return segments;
  }
} 