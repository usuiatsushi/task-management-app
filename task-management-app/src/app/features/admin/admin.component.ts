import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../auth/services/user.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AppUser } from '../auth/models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <h1>管理者ページ</h1>
      <div *ngIf="users.length > 0">
        <table>
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>表示名</th>
              <th>権限</th>
              <th>承認状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.email }}</td>
              <td>{{ user.displayName || '未設定' }}</td>
              <td>{{ user.role }}</td>
              <td>
                <span *ngIf="user.isApproved">承認済み</span>
                <button *ngIf="!user.isApproved" (click)="approveUser(user)">承認</button>
              </td>
              <td>
                <button (click)="toggleRole(user)">権限変更</button>
                <button (click)="deleteUser(user)">削除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="users.length === 0">
        ユーザーが存在しません。
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    button {
      margin-right: 5px;
    }
  `]
})
export class AdminComponent implements OnInit {
  users: AppUser[] = [];

  constructor(
    private userService: UserService,
    private afs: AngularFirestore
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.users = await this.userService.getAllUsers();
  }

  async toggleRole(user: AppUser) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await this.afs.collection('users').doc(user.uid).update({ role: newRole });
    await this.loadUsers();
  }

  async deleteUser(user: AppUser) {
    if (confirm(`ユーザー ${user.email} を削除しますか？`)) {
      await this.afs.collection('users').doc(user.uid).delete();
      await this.loadUsers();
    }
  }

  async approveUser(user: AppUser) {
    await this.afs.collection('users').doc(user.uid).update({ isApproved: true });
    await this.loadUsers();
  }
} 