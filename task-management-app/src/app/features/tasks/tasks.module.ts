import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AiRecommendationsComponent } from './components/ai-recommendations/ai-recommendations.component';

@NgModule({
  declarations: [
    AiRecommendationsComponent
  ],
  imports: [
    MatTabsModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule
  ],
  exports: [
    AiRecommendationsComponent
  ]
})
export class TasksModule { } 