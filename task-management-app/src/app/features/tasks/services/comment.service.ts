import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from '@angular/fire/firestore';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(private firestore: Firestore) {}

  async createComment(comment: Omit<Comment, 'id'>): Promise<string> {
    const commentsRef = collection(this.firestore, 'comments');
    const docRef = await addDoc(commentsRef, comment);
    return docRef.id;
  }

  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    const commentsRef = collection(this.firestore, 'comments');
    const q = query(commentsRef, where('taskId', '==', taskId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
  }

  async deleteComment(commentId: string): Promise<void> {
    const commentRef = doc(this.firestore, 'comments', commentId);
    await deleteDoc(commentRef);
  }
} 