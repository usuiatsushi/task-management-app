import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp, getDoc } from '@angular/fire/firestore';
import { Project } from '../models/project.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();
  private clearProjectsTimeout: any;

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.authService.authState$.subscribe(user => {
      console.log('authState$ changed:', user);
      if (user) {
        if (this.clearProjectsTimeout) {
          clearTimeout(this.clearProjectsTimeout);
          this.clearProjectsTimeout = null;
        }
        this.loadProjects();
      } else {
        // 500ms待ってもuserが復帰しなければ空にする
        this.clearProjectsTimeout = setTimeout(() => {
          this.projectsSubject.next([]);
        }, 500);
      }
    });
  }

  public async loadProjects(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      const projectsRef = collection(this.firestore, 'projects');
      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      const userData = userDoc.data();
      const role = userData?.['role'];

      console.log('user.uid:', user.uid);
      let querySnapshot;
      if (role === 'admin') {
        // 管理者は全件取得
        querySnapshot = await getDocs(projectsRef);
      } else {
        // 一般ユーザーは自分のプロジェクトのみ
        const q = query(projectsRef, where('userId', '==', user.uid));
        querySnapshot = await getDocs(q);
        console.log('取得プロジェクト数:', querySnapshot.size);
      }

      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          name: data['name'],
          description: data['description'],
          userId: data['userId'],
          createdAt: data['createdAt'],
          updatedAt: data['updatedAt'],
          tasks: data['tasks'] || []
        } as Project);
      });

      this.projectsSubject.next(projects);
    } catch (error) {
      console.error('loadProjects error:', error);
      this.projectsSubject.next([]);
    }
  }

  async createProject(project: Omit<Project, 'id'>): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('ユーザーが認証されていません');

    const projectData = {
      ...project,
      userId: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      tasks: []
    };

    const docRef = await addDoc(collection(this.firestore, 'projects'), projectData);
    await this.loadProjects();
    return docRef.id;
  }

  async updateProject(id: string, project: Partial<Project>): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', id);
    await updateDoc(projectRef, {
      ...project,
      updatedAt: Timestamp.now()
    });
    await this.loadProjects();
  }

  async deleteProject(id: string): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', id);
    await deleteDoc(projectRef);
    await this.loadProjects();
  }

  async addTaskToProject(projectId: string, taskId: string): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', projectId);
    const project = this.projectsSubject.value.find(p => p.id === projectId);
    if (!project) throw new Error('プロジェクトが見つかりません');

    const updatedTasks = [...project.tasks, taskId];
    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: Timestamp.now()
    });
    await this.loadProjects();
  }

  async removeTaskFromProject(projectId: string, taskId: string): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', projectId);
    const project = this.projectsSubject.value.find(p => p.id === projectId);
    if (!project) throw new Error('プロジェクトが見つかりません');

    const updatedTasks = project.tasks.filter(id => id !== taskId);
    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: Timestamp.now()
    });
    await this.loadProjects();
  }

  async getProject(id: string): Promise<Project | null> {
    const project = this.projectsSubject.value.find(p => p.id === id);
    return project || null;
  }
} 