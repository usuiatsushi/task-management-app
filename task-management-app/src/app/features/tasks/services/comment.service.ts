import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy, updateDoc } from '@angular/fire/firestore';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(private firestore: Firestore) {}

  async createComment(comment: Omit<Comment, 'id'>): Promise<string> {
    try {
      console.log('コメントを作成します:', comment);
      const commentsRef = collection(this.firestore, 'comments');
      const docRef = await addDoc(commentsRef, comment);
      console.log('コメントが作成されました:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('コメント作成時のエラー:', error);
      throw error;
    }
  }

  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    try {
      console.log('タスクIDでコメントを取得します:', taskId);
      const commentsRef = collection(this.firestore, 'comments');
      const q = query(
        commentsRef, 
        where('taskId', '==', taskId),
        orderBy('createdAt', 'desc')  // 作成日時の降順でソート
      );
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      console.log('取得したコメント:', comments);
      return comments;
    } catch (error) {
      console.error('コメント取得時のエラー:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      console.log('コメントを削除します:', commentId);
      const commentRef = doc(this.firestore, 'comments', commentId);
      await deleteDoc(commentRef);
      console.log('コメントが削除されました:', commentId);
    } catch (error) {
      console.error('コメント削除時のエラー:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    try {
      console.log('コメントを更新します:', commentId);
      const commentRef = doc(this.firestore, 'comments', commentId);
      await updateDoc(commentRef, {
        content: content,
        updatedAt: new Date()
      });
      console.log('コメントが更新されました:', commentId);
    } catch (error) {
      console.error('コメント更新時のエラー:', error);
      throw error;
    }
  }
} 