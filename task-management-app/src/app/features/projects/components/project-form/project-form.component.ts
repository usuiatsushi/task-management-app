import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc } from '@angular/fire/firestore';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

interface MemberInfo {
  uid: string;
  displayName?: string;
  email?: string;
}

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
  ]
})
export class ProjectFormComponent implements OnInit {
  projectForm: FormGroup;
  isEditMode = false;
  projectId: string | null = null;
  members: string[] = [];
  memberInfos: MemberInfo[] = [];
  newMemberEmail: string = '';
  memberLoading: boolean = false;
  allUsers: any[] = [];
  selectedUserUid: string | null = null;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private firestore: Firestore,
    private angularFirestore: AngularFirestore
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId && this.projectId !== 'new') {
      this.isEditMode = true;
      this.loadProject();
    }
    this.angularFirestore.collection('users').valueChanges({ idField: 'uid' }).subscribe(users => {
      this.allUsers = users;
    });
  }

  private async loadProject(): Promise<void> {
    if (!this.projectId) return;
    const project = await this.projectService.getProject(this.projectId);
    if (project) {
      this.projectForm.patchValue({
        name: project.name,
        description: project.description
      });
      this.members = project.members || [];
      await this.loadMemberInfos();
    }
  }

  private async loadMemberInfos() {
    this.memberInfos = [];
    for (const uid of this.members) {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as any;
        this.memberInfos.push({
          uid,
          displayName: data.displayName,
          email: data.email
        });
      } else {
        this.memberInfos.push({ uid, displayName: '(不明なユーザー)', email: '' });
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) return;
    try {
      const projectData = { ...this.projectForm.value, members: this.members };
      if (this.isEditMode && this.projectId) {
        await this.projectService.updateProject(this.projectId, projectData);
        this.snackBar.open('プロジェクトを更新しました', '閉じる', { duration: 3000 });
      } else {
        await this.projectService.createProject(projectData);
        this.snackBar.open('プロジェクトを作成しました', '閉じる', { duration: 3000 });
      }
      this.router.navigate(['/projects']);
    } catch (error) {
      console.error('プロジェクトの保存に失敗しました:', error);
      this.snackBar.open('プロジェクトの保存に失敗しました', '閉じる', { duration: 3000 });
    }
  }

  async addMemberByEmail() {
    if (!this.newMemberEmail) return;
    this.memberLoading = true;
    try {
      const uid = await this.authService.getUidByEmail(this.newMemberEmail);
      if (!uid) {
        this.snackBar.open('該当ユーザーが見つかりません', '閉じる', { duration: 3000 });
        this.memberLoading = false;
        return;
      }
      if (this.members.includes(uid)) {
        this.snackBar.open('既に追加されています', '閉じる', { duration: 3000 });
        this.memberLoading = false;
        return;
      }
      this.members.push(uid);
      await this.loadMemberInfos();
      this.snackBar.open('メンバーを追加しました', '閉じる', { duration: 2000 });
      this.newMemberEmail = '';
    } catch (e) {
      this.snackBar.open('追加に失敗しました', '閉じる', { duration: 3000 });
    }
    this.memberLoading = false;
  }

  async removeMember(uid: string) {
    this.members = this.members.filter(m => m !== uid);
    await this.loadMemberInfos();
    this.snackBar.open('メンバーを削除しました', '閉じる', { duration: 2000 });
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // 一度リセット
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  addMemberByUid() {
    if (
      this.selectedUserUid &&
      !this.members.includes(this.selectedUserUid)
    ) {
      this.members.push(this.selectedUserUid);
      this.selectedUserUid = null;
      this.updateMemberInfos();
    }
  }

  private updateMemberInfos() {
    // Implementation of updateMemberInfos method
  }
} 