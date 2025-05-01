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
    // セキュリティ設定を適用
    if (environment.security) {
      // Cross-Origin-Opener-Policy
      const coopMeta = document.createElement('meta');
      coopMeta.httpEquiv = 'Cross-Origin-Opener-Policy';
      coopMeta.content = environment.security.crossOriginOpenerPolicy;
      document.head.appendChild(coopMeta);

      // Cross-Origin-Embedder-Policy
      const coepMeta = document.createElement('meta');
      coepMeta.httpEquiv = 'Cross-Origin-Embedder-Policy';
      coepMeta.content = environment.security.crossOriginEmbedderPolicy;
      document.head.appendChild(coepMeta);
    }
  }
}
