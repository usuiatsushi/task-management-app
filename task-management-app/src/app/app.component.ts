import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ToastService } from './shared/services/toast.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'task-management-app';

  constructor(private toastService: ToastService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.toastService.clearAll();
      }
    });
  }

  ngOnInit() {
    // Cross-Origin-Opener-Policyの設定を適用
    if (environment.security?.crossOriginOpenerPolicy) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Cross-Origin-Opener-Policy';
      meta.content = environment.security.crossOriginOpenerPolicy;
      document.head.appendChild(meta);
    }
  }
}
