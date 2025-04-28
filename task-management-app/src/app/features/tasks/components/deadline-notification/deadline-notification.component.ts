import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-deadline-notification',
  template: `
    <span>{{ data.message }}</span>
  `,
  styles: [`
    span {
      color: #fff;
      font-weight: bold;
      font-size: 16px;
    }
  `],
  standalone: true
})
export class DeadlineNotificationComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: { message: string }) {}
} 