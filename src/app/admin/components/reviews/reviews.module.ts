import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsComponent } from './reviews.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    ReviewsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", component: ReviewsComponent }
    ])
  ]
})
export class ReviewsModule { }
