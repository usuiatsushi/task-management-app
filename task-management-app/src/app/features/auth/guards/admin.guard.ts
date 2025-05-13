import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = await firstValueFrom(this.auth.user$.pipe(filter(u => u !== null)));
    console.log('AdminGuard user:', user);
    if (user?.role === 'admin' && user?.isApproved) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
} 