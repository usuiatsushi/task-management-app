import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { Project } from '../models/project.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.loadProjects();
      } else {
        this.projectsSubject.next([]);
      }
    });
  }

  public async loadProjects(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) return;

    const projectsRef = collection(this.firestore, 'projects');
    const q = query(projectsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });

    this.projectsSubject.next(projects);
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