import { Component } from '@angular/core';
import { Router, NavigationStart, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'task-management-app';

  constructor(private toastService: ToastService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.toastService.clearAll();
      }
    });
  }
}
